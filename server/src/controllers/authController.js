const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const supabase = require('../db/supabase');

// ── helpers ───────────────────────────────────────────────────
function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// ── CUSTOMER register / login ────────────────────────────────
async function register(req, res) {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'name, email and password are required' });

  const { data: existing } = await supabase
    .from('users').select('id').eq('email', email).single();
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const password_hash = await bcrypt.hash(password, 12);
  const { data, error } = await supabase
    .from('users')
    .insert({ name, email, phone, password_hash, role: 'customer' })
    .select('id, name, email, phone, role')
    .single();

  if (error) return res.status(500).json({ error: error.message });

  const token = signToken({ id: data.id, email: data.email, role: 'customer', table: 'users' });
  res.status(201).json({ user: data, token });
}

async function loginCustomer(req, res) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'email and password are required' });

  const { data: user, error } = await supabase
    .from('users').select('*').eq('email', email).single();
  if (error || !user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken({ id: user.id, email: user.email, role: 'customer', table: 'users' });
  const { password_hash, ...safe } = user;
  res.json({ user: { ...safe, role: 'customer' }, token });
}

// ── ADMIN login ──────────────────────────────────────────────
async function loginAdmin(req, res) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'email and password are required' });

  const { data: admin, error } = await supabase
    .from('business_admins').select('*').eq('email', email).single();

  if (error || !admin) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken({ id: admin.id, email: admin.email, role: 'admin', table: 'business_admins' });
  const { password_hash, ...safe } = admin;
  res.json({ user: { ...safe, role: 'admin' }, token });
}


// ── STAFF login ──────────────────────────────────────────────
async function loginStaff(req, res) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'email and password are required' });

  const { data: staff, error } = await supabase
    .from('staff').select('*').eq('email', email).single();
  if (error || !staff) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, staff.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken({ id: staff.id, email: staff.email, role: 'staff', table: 'staff', business_id: staff.business_id });
  const { password_hash, ...safe } = staff;
  res.json({ user: { ...safe, role: 'staff' }, token });
}

// ── Admin creates a staff member ─────────────────────────────
async function createStaff(req, res) {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'name, email and password are required' });

  // Admin must own a business — fetch it
  const { data: biz, error: bizErr } = await supabase
    .from('businesses').select('id').eq('owner_id', req.user.id).single();
  if (bizErr || !biz)
    return res.status(400).json({ error: 'No business found for this admin' });

  const { data: existing } = await supabase
    .from('staff').select('id').eq('email', email).single();
  if (existing) return res.status(409).json({ error: 'Email already in use' });

  const password_hash = await bcrypt.hash(password, 12);
  const { data, error } = await supabase
    .from('staff')
    .insert({ name, email, phone, password_hash, business_id: biz.id, admin_id: req.user.id })
    .select('id, name, email, phone, business_id')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
}

// ── List staff for admin ─────────────────────────────────────
async function listStaff(req, res) {
  const { data: biz } = await supabase
    .from('businesses').select('id').eq('owner_id', req.user.id).single();
  if (!biz) return res.json([]);

  const { data, error } = await supabase
    .from('staff')
    .select('id, name, email, phone, created_at')
    .eq('business_id', biz.id)
    .order('created_at');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

// ── Delete staff member ──────────────────────────────────────
async function deleteStaff(req, res) {
  const { id } = req.params;
  const { data: biz } = await supabase
    .from('businesses').select('id').eq('owner_id', req.user.id).single();
  if (!biz) return res.status(403).json({ error: 'No business found' });

  const { error } = await supabase
    .from('staff').delete().eq('id', id).eq('business_id', biz.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
}

// ── /me — works for all three tables ─────────────────────────
async function getMe(req, res) {
  const { id, role, table } = req.user;
  const { data, error } = await supabase
    .from(table)
    .select('id, name, email, phone, created_at')
    .eq('id', id)
    .single();

  if (error) return res.status(404).json({ error: 'User not found' });
  res.json({ ...data, role });
}

module.exports = { register, loginCustomer, loginAdmin, loginStaff, createStaff, listStaff, deleteStaff, getMe };
