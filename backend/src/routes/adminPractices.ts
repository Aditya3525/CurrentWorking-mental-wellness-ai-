import express from 'express';
import { requireAdmin, logAdminAction } from '../middleware/requireAdmin';
import { list, get, create, update, remove } from '../controllers/adminSimplePracticeController';

const router = express.Router();

router.get('/', requireAdmin, list);
router.get('/:id', requireAdmin, get);
router.post('/', requireAdmin, logAdminAction('CREATE_PRACTICE'), create);
router.put('/:id', requireAdmin, logAdminAction('UPDATE_PRACTICE'), update);
router.delete('/:id', requireAdmin, logAdminAction('DELETE_PRACTICE'), remove);

export default router;
