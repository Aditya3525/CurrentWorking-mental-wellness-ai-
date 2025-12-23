import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getTherapists,
  getTherapistById,
  searchTherapists,
  requestBooking,
  getUserBookings,
  cancelBooking
} from '../controllers/therapistController';

const router = express.Router();

// Public therapist directory routes
router.get('/', getTherapists);
router.get('/search', searchTherapists);
router.get('/:id', getTherapistById);

// Protected booking routes
router.post('/booking', authenticate, requestBooking);
router.get('/bookings', authenticate, getUserBookings);
router.delete('/bookings/:id', authenticate, cancelBooking);

export default router;
