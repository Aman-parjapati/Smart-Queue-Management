const jwt = require('jsonwebtoken');
const supabase = require('../db/supabase');

/**
 * Verifies the Bearer JWT, checks if the user exists in the database,
 * and attaches the decoded payload to req.user.
 * Payload shape: { id, email, role, table, business_id? }
 *   role:  'customer' | 'admin' | 'staff'
 *   table: 'users'    | 'business_admins' | 'staff'
 */
async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ error: 'No token provided' });

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify that the user still exists in the database
    const { data: dbUser, error } = await supabase
      .from(decoded.table)
      .select('id')
      .eq('id', decoded.id)
      .single();

    if (error || !dbUser) {
      return res.status(401).json({ error: 'Session expired or user deleted' });
    }

    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Role guard — pass one or more allowed roles.
 * e.g. requireRole('admin', 'staff')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role))
      return res.status(403).json({ error: 'Access denied' });
    next();
  };
}

module.exports = { authMiddleware, requireRole };
