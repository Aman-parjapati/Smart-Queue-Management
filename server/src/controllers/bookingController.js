const supabase        = require('../db/supabase');
const { generateQRCode } = require('../services/qrService');
const { invalidateCache, getQueueState } = require('../services/queueService');
const { broadcastQueue } = require('../services/sseService');
const { sendBookingConfirmation } = require('../services/twilioService');
const { sendBookingEmail } = require('../services/emailService');

async function createBooking(req, res) {
  const { slot_id } = req.body;
  const user_id = req.user.id;

  if (!slot_id) return res.status(400).json({ error: 'slot_id is required' });

  // Fetch slot
  const { data: slot, error: slotErr } = await supabase
    .from('slots')
    .select('*, businesses(name, avg_service_time)')
    .eq('id', slot_id)
    .single();

  if (slotErr || !slot) return res.status(404).json({ error: 'Slot not found' });
  if (!slot.is_active) return res.status(400).json({ error: 'Slot is not active' });
  if (slot.booked_count >= slot.max_capacity) {
    return res.status(400).json({ error: 'Slot is fully booked' });
  }

  // Check duplicate booking
  const { data: existing } = await supabase
    .from('bookings')
    .select('id')
    .eq('user_id', user_id)
    .eq('slot_id', slot_id)
    .single();

  if (existing) return res.status(409).json({ error: 'You already have a booking for this slot' });

  const token_number = slot.booked_count + 1;

  // Create booking (without QR first to get the ID)
  const { data: booking, error: bookErr } = await supabase
    .from('bookings')
    .insert({ user_id, slot_id, token_number, status: 'pending', qr_code: '' })
    .select()
    .single();

  if (bookErr) return res.status(500).json({ error: bookErr.message });

  // Generate QR code
  const qr_code = await generateQRCode(booking.id);

  // Update with QR code
  const { data: updated } = await supabase
    .from('bookings')
    .update({ qr_code })
    .eq('id', booking.id)
    .select()
    .single();

  // Increment booked_count on slot
  await supabase
    .from('slots')
    .update({ booked_count: token_number })
    .eq('id', slot_id);

  // Invalidate cache and broadcast
  await invalidateCache(slot_id);
  const queue = await getQueueState(slot_id);
  broadcastQueue(slot.business_id, { slotId: slot_id, queue });

  // Send SMS/WhatsApp/Email booking confirmations with QR code asynchronously
  (async () => {
    try {
      const { data: customer } = await supabase
        .from('users')
        .select('name, phone, email')
        .eq('id', user_id)
        .single();

      if (customer) {
        if (customer.phone) {
          await sendBookingConfirmation(
            customer.phone,
            booking.id,
            token_number,
            slot.businesses.name,
            slot.date,
            slot.start_time,
            slot.end_time
          );
        }
        if (customer.email) {
          await sendBookingEmail(
            customer.email,
            customer.name,
            booking.id,
            token_number,
            slot.businesses.name,
            slot.date,
            slot.start_time,
            slot.end_time
          );
        }
      }
    } catch (err) {
      console.error('Failed to send booking notifications:', err);
    }
  })();

  res.status(201).json(updated);
}

async function getMyBookings(req, res) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, slots(date, start_time, end_time, businesses(name, category))')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

async function getBooking(req, res) {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('bookings')
    .select('*, slots(*, businesses(*))')
    .eq('id', id)
    .single();

  if (error) return res.status(404).json({ error: 'Booking not found' });
  if (data.user_id !== req.user.id && req.user.role === 'customer') {
    return res.status(403).json({ error: 'Access denied' });
  }
  res.json(data);
}

async function checkIn(req, res) {
  // Called when QR is scanned by staff
  const { bookingId } = req.body;

  const { data: booking, error } = await supabase
    .from('bookings')
    .update({ status: 'arrived' })
    .eq('id', bookingId)
    .eq('status', 'pending')
    .select('*, slots(business_id)')
    .single();

  if (error || !booking) return res.status(400).json({ error: 'Booking not found or already checked in' });

  // Log event
  await supabase.from('queue_events').insert({
    booking_id: bookingId,
    event_type: 'arrived',
  });

  // Invalidate and broadcast
  await invalidateCache(booking.slot_id);
  const queue = await getQueueState(booking.slot_id);
  broadcastQueue(booking.slots.business_id, { slotId: booking.slot_id, queue });

  res.json({ success: true, booking });
}

module.exports = { createBooking, getMyBookings, getBooking, checkIn };
