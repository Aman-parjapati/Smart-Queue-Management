const router = require('express').Router();
const { getAnalytics } = require('../controllers/analyticsController');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.get('/:businessId', authMiddleware, requireRole('admin', 'staff'), getAnalytics);

module.exports = router;
