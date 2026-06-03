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

module.exports = router;
