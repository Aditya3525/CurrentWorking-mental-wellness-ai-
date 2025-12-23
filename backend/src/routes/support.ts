import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createSupportTicket,
  getUserTickets,
  getTicketById,
  acknowledgeTicket
} from '../controllers/supportController';

const router = express.Router();

// All support routes require authentication
router.use(authenticate);

// Support ticket routes
router.post('/tickets', createSupportTicket);
router.get('/tickets', getUserTickets);
router.get('/tickets/:id', getTicketById);
router.put('/tickets/:id/acknowledge', acknowledgeTicket);

export default router;
