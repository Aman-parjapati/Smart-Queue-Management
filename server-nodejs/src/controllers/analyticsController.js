const supabase = require('../db/supabase');

async function getAnalytics(req, res) {
  const { businessId } = req.params;
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];

  // Get all slots for this business on target date
  const { data: slots, error: slotErr } = await supabase
    .from('slots')
    .select('id, date, start_time, booked_count, max_capacity')
    .eq('business_id', businessId)
    .eq('date', targetDate);

  if (slotErr) return res.status(500).json({ error: slotErr.message });

  const slotIds = slots.map(s => s.id);
  if (slotIds.length === 0) return res.json({ slots, summary: {} });

  // Count tokens by status
  const { data: statusCounts } = await supabase
    .from('bookings')
    .select('status')
    .in('slot_id', slotIds);

  const summary = {
    total: statusCounts?.length || 0,
    done: statusCounts?.filter(b => b.status === 'done').length || 0,
    serving: statusCounts?.filter(b => b.status === 'serving').length || 0,
    pending: statusCounts?.filter(b => b.status === 'pending').length || 0,
    skipped: statusCounts?.filter(b => b.status === 'skipped').length || 0,
    arrived: statusCounts?.filter(b => b.status === 'arrived').length || 0,
  };

  // Peak hour analysis
  const { data: events } = await supabase
    .from('queue_events')
    .select('event_type, timestamp')
    .in('booking_id',
      (await supabase.from('bookings').select('id').in('slot_id', slotIds)).data?.map(b => b.id) || []
    );

  const hourCounts = {};
  events?.forEach(e => {
    const hour = new Date(e.timestamp).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  res.json({ slots, summary, hourCounts });
}

module.exports = { getAnalytics };
