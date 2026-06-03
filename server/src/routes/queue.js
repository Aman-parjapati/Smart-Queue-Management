const router = require('express').Router();
const { liveQueue, callNext, skipToken, getQueueStatus, completeService } = require('../controllers/queueController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// SSE — no auth needed (public queue board)
router.get('/live/:businessId', liveQueue);

// Get current queue state (REST fallback)
router.get('/status/:slotId', getQueueStatus);

// Admin/Staff actions
router.post('/next',       authMiddleware, requireRole('admin', 'staff'), callNext);
router.post('/skip',       authMiddleware, requireRole('admin', 'staff'), skipToken);
router.post('/complete',   authMiddleware, requireRole('admin', 'staff'), completeService);

module.exports = router;
