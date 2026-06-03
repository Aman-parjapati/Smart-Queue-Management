const supabase            = require('../db/supabase');
const { getQueueState, invalidateCache, getNextInQueue, calcWaitTime } = require('../services/queueService');
const { addClient, removeClient, broadcastQueue } = require('../services/sseService');
const { notifyTurnNear }  = require('../services/twilioService');

// ── SSE Endpoint ─────────────────────────────────────────────
async function liveQueue(req, res) {
  const { businessId } = req.params;
  const { slotId } = req.query;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL);
  res.flushHeaders();

  const clientId = `${Date.now()}-${Math.random()}`;
  addClient(businessId, clientId, res, slotId);

  // Send current state immediately on connect
  try {
    let targetSlotId = slotId;
    if (!targetSlotId) {
      // Get active slot for this business today
      const today = new Date().toISOString().split('T')[0];
      const { data: slots } = await supabase
        .from('slots')
        .select('id')
        .eq('business_id', businessId)
        .eq('date', today)
        .eq('is_active', true);

      if (slots && slots.length > 0) {
        targetSlotId = slots[0].id;
      }
    }

    if (targetSlotId) {
      const queue = await getQueueState(targetSlotId);
      res.write(`data: ${JSON.stringify({ slotId: targetSlotId, queue })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ slotId: null, queue: [] })}\n\n`);
    }
  } catch { /* ignore initial load errors */ }

  req.on('close', () => removeClient(businessId, clientId));
}

// ── Call Next Token ──────────────────────────────────────────
async function callNext(req, res) {
  const { slotId } = req.body;

  // Mark currently serving as done
  await supabase
    .from('bookings')
    .update({ status: 'done' })
    .eq('slot_id', slotId)
    .eq('status', 'serving');

  await supabase.from('queue_events').insert({
    booking_id: null,
    event_type: 'done',
  });

  const next = await getNextInQueue(slotId);
  if (!next) {
    return res.json({ message: 'Queue is empty', next: null });
  }

  // Mark next as serving
  await supabase
    .from('bookings')
    .update({ status: 'serving' })
    .eq('id', next.id);

  await supabase.from('queue_events').insert({
    booking_id: next.id,
    event_type: 'serving',
  });

  // Check if anyone is 2 tokens away and notify them
  const queue = await getQueueState(slotId);
  const twoAway = queue.find(b => b.token_number === next.token_number + 2);
  if (twoAway) {
    // Get their phone
    const { data: user } = await supabase
      .from('users')
      .select('phone, name')
      .eq('id', twoAway.user_id)
      .single();
    if (user?.phone) {
      const { data: slot } = await supabase
        .from('slots')
        .select('businesses(name)')
        .eq('id', slotId)
        .single();
      await notifyTurnNear(user.phone, twoAway.token_number, slot?.businesses?.name || 'the service');
    }
  }

  await invalidateCache(slotId);
  const updatedQueue = await getQueueState(slotId);

  // Get business_id to broadcast
  const { data: slot } = await supabase
    .from('slots')
    .select('business_id')
    .eq('id', slotId)
    .single();

  broadcastQueue(slot.business_id, { slotId, queue: updatedQueue });
  res.json({ success: true, serving: next, queue: updatedQueue });
}

// ── Skip Token ───────────────────────────────────────────────
async function skipToken(req, res) {
  const { bookingId, slotId } = req.body;

  const { data: booking } = await supabase
    .from('bookings')
    .update({ status: 'skipped' })
    .eq('id', bookingId)
    .select()
    .single();

  await supabase.from('queue_events').insert({ booking_id: bookingId, event_type: 'skipped' });

  await invalidateCache(slotId);
  const queue = await getQueueState(slotId);

  const { data: slot } = await supabase
    .from('slots')
    .select('business_id')
    .eq('id', slotId)
    .single();

  broadcastQueue(slot.business_id, { slotId, queue });
  res.json({ success: true, booking, queue });
}

// ── Get Queue Status for a slot ──────────────────────────────
async function getQueueStatus(req, res) {
  const { slotId } = req.params;
  const queue = await getQueueState(slotId);

  // Get avg service time
  const { data: slot } = await supabase
    .from('slots')
    .select('businesses(avg_service_time)')
    .eq('id', slotId)
    .single();

  const avgTime = slot?.businesses?.avg_service_time || 10;

  const activeQueue = queue.filter(b => b.status !== 'done');

  const enriched = activeQueue.map((b, i) => ({
    ...b,
    position: i + 1,
    estimated_wait: calcWaitTime(i, avgTime),
  }));

  res.json(enriched);
}

// ── Complete Service ──────────────────────────────────────────
async function completeService(req, res) {
  const { bookingId, slotId } = req.body;

  if (!bookingId || !slotId) {
    return res.status(400).json({ error: 'bookingId and slotId are required' });
  }

  const { data: booking, error } = await supabase
    .from('bookings')
    .update({ status: 'done' })
    .eq('id', bookingId)
    .eq('status', 'serving')
    .select()
    .single();

  if (error || !booking) {
    return res.status(400).json({ error: 'Booking not found or not currently serving' });
  }

  await supabase.from('queue_events').insert({
    booking_id: bookingId,
    event_type: 'done',
  });

  await invalidateCache(slotId);
  const queue = await getQueueState(slotId);

  // Get business_id to broadcast
  const { data: slot } = await supabase
    .from('slots')
    .select('business_id')
    .eq('id', slotId)
    .single();

  if (slot) {
    broadcastQueue(slot.business_id, { slotId, queue });
  }

  res.json({ success: true, booking, queue });
}

module.exports = { liveQueue, callNext, skipToken, getQueueStatus, completeService };
