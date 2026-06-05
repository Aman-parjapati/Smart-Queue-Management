const router   = require('express').Router();
const supabase = require('../db/supabase');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Get slots for a business (optionally filter by date)
router.get('/business/:businessId', async (req, res) => {
  const { businessId } = req.params;
  const { date } = req.query;

  let query = supabase
    .from('slots')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('date')
    .order('start_time');

  if (date) query = query.eq('date', date);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Create slot (admin/staff)
router.post('/', authMiddleware, requireRole('admin', 'staff'), async (req, res) => {
  const { business_id, date, start_time, end_time, max_capacity } = req.body;
  const { data, error } = await supabase
    .from('slots')
    .insert({ business_id, date, start_time, end_time, max_capacity })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Deactivate slot
router.patch('/:id/deactivate', authMiddleware, requireRole('admin', 'staff'), async (req, res) => {
  const { data, error } = await supabase
    .from('slots')
    .update({ is_active: false })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Update slot details (admin/staff)
router.put('/:id', authMiddleware, requireRole('admin', 'staff'), async (req, res) => {
  const { id } = req.params;
  const { start_time, end_time, max_capacity } = req.body;

  try {
    const { data: slot, error: slotErr } = await supabase
      .from('slots')
      .select('*, businesses(*)')
      .eq('id', id)
      .single();

    if (slotErr || !slot) return res.status(404).json({ error: 'Slot not found' });

    if (req.user.role === 'staff' && slot.business_id !== req.user.business_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role === 'admin' && slot.businesses.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: updated, error: updateErr } = await supabase
      .from('slots')
      .update({ start_time, end_time, max_capacity })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete slot (admin/staff)
router.delete('/:id', authMiddleware, requireRole('admin', 'staff'), async (req, res) => {
  const { id } = req.params;

  try {
    const { data: slot, error: slotErr } = await supabase
      .from('slots')
      .select('*, businesses(*)')
      .eq('id', id)
      .single();

    if (slotErr || !slot) return res.status(404).json({ error: 'Slot not found' });

    if (req.user.role === 'staff' && slot.business_id !== req.user.business_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role === 'admin' && slot.businesses.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if slot has active bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('slot_id', id);

    if (bookings && bookings.length > 0) {
      return res.status(400).json({ error: 'Cannot delete a slot that already has bookings. Please cancel bookings first.' });
    }

    const { error: deleteErr } = await supabase
      .from('slots')
      .delete()
      .eq('id', id);

    if (deleteErr) throw deleteErr;
    res.json({ success: true, message: 'Slot deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
