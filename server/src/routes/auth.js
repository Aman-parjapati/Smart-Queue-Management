const router = require('express').Router();
const {
  register, loginCustomer, loginAdmin, loginStaff,
  createStaff, listStaff, deleteStaff, getMe, updateProfile, deleteProfile
} = require('../controllers/authController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Public
router.post('/register',       authLimiter, register);
router.post('/login',          authLimiter, loginCustomer);   // customers
router.post('/login/admin',    authLimiter, loginAdmin);       // admins
router.post('/login/staff',    authLimiter, loginStaff);       // staff

// Protected
router.get('/me',              authMiddleware, getMe);
router.put('/profile',         authMiddleware, updateProfile);
router.delete('/profile',      authMiddleware, deleteProfile);

// Admin-only staff management
router.post('/staff',          authMiddleware, requireRole('admin'), createStaff);
router.get('/staff',           authMiddleware, requireRole('admin'), listStaff);
router.delete('/staff/:id',    authMiddleware, requireRole('admin'), deleteStaff);

module.exports = router;
