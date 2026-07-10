const express = require('express');
const {
  createReservation,
  getMyReservations,
  cancelMyReservation,
  getAllReservations,
  updateReservation,
} = require('../controllers/reservationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createReservation);
router.get('/me', protect, getMyReservations);
router.delete('/:id', protect, cancelMyReservation);

router.get('/', protect, authorize('admin'), getAllReservations);
router.put('/:id', protect, authorize('admin'), updateReservation);

module.exports = router;
