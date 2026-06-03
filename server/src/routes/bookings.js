const router = require('express').Router();
const { createBooking, getMyBookings, getBooking, checkIn } = require('../controllers/bookingController');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.post('/',           authMiddleware, createBooking);
router.get('/my',          authMiddleware, getMyBookings);
router.get('/:id',         authMiddleware, getBooking);
router.post('/checkin',    authMiddleware, requireRole('admin', 'staff'), checkIn);

module.exports = router;
