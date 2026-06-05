const router    = require('express').Router();
const supabase  = require('../db/supabase');
const { authMiddleware, requireRole } = require('../middleware/auth');

// List all businesses (public)
router.get('/', async (req, res) => {
  try {
    const { data: businesses, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .order('name');
    if (bizError) throw bizError;

    // Get today's active slots
    const today = new Date().toISOString().split('T')[0];
    const { data: slots, error: slotError } = await supabase
      .from('slots')
      .select('business_id')
      .eq('date', today)
      .eq('is_active', true);
    if (slotError) throw slotError;

    const activeBizIds = new Set(slots.map(s => s.business_id));
    const result = businesses.map(b => ({
      ...b,
      has_slots_today: activeBizIds.has(b.id)
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single business
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Business not found' });
  res.json(data);
});

// Create business (admin only)
router.post('/', authMiddleware, requireRole('admin'), async (req, res) => {
  const { name, category, address, branch, avg_service_time } = req.body;
  const { data, error } = await supabase
    .from('businesses')
    .insert({ owner_id: req.user.id, name, category, address, branch, avg_service_time })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Update business
router.put('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  const { name, category, address, branch, avg_service_time } = req.body;
  const { data, error } = await supabase
    .from('businesses')
    .update({ name, category, address, branch, avg_service_time })
    .eq('id', req.params.id)
    .eq('owner_id', req.user.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
