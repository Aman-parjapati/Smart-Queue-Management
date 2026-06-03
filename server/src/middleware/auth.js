const jwt = require('jsonwebtoken');

/**
 * Verifies the Bearer JWT and attaches decoded payload to req.user.
 * Payload shape: { id, email, role, table, business_id? }
 *   role:  'customer' | 'admin' | 'staff'
 *   table: 'users'    | 'business_admins' | 'staff'
 */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ error: 'No token provided' });

  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
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
