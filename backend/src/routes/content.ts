import express from 'express';
import { authenticate } from '../middleware/auth';
import { listContent, getContentById } from '../controllers/contentController';

const router = express.Router();

router.use(authenticate as any);
router.get('/', listContent as any);
router.get('/:id', getContentById as any);

export default router;
