import express from 'express';
import { requireAdmin, logAdminAction } from '../middleware/requireAdmin';
import { list, get, create, update, remove } from '../controllers/adminSimpleContentController';

const router = express.Router();

router.get('/', requireAdmin, list);
router.get('/:id', requireAdmin, get);
router.post('/', requireAdmin, logAdminAction('CREATE_CONTENT'), create);
router.put('/:id', requireAdmin, logAdminAction('UPDATE_CONTENT'), update);
router.delete('/:id', requireAdmin, logAdminAction('DELETE_CONTENT'), remove);

export default router;
