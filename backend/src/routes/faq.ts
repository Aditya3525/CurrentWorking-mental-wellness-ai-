import express from 'express';
import {
  getFAQs,
  searchFAQs,
  incrementFAQView,
  voteFAQ
} from '../controllers/faqController';

const router = express.Router();

// Public FAQ routes (no authentication required)
router.get('/', getFAQs);
router.get('/search', searchFAQs);
router.post('/:id/view', incrementFAQView);
router.post('/:id/vote', voteFAQ);

export default router;
