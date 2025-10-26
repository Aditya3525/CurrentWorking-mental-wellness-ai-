import express from 'express';
import { conversationController } from '../controllers/conversationController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all conversations
router.get('/', conversationController.getConversations);

// Search conversations (must be before /:id to avoid conflict)
router.get('/search', conversationController.searchConversations);

// Get conversation count
router.get('/count', conversationController.getConversationCount);

// Export bulk conversations (must be before /:id to avoid conflict)
router.post('/export/bulk', conversationController.exportBulkConversations);

// Create new conversation
router.post('/', conversationController.createConversation);

// Get specific conversation with messages
router.get('/:id', conversationController.getConversation);

// Update conversation (rename or archive)
router.patch('/:id', conversationController.updateConversation);

// Delete conversation
router.delete('/:id', conversationController.deleteConversation);

// Generate conversation title
router.post('/:id/title', conversationController.generateTitle);

// Archive/unarchive conversation
router.post('/:id/archive', conversationController.archiveConversation);

// Export single conversation
router.get('/:id/export', conversationController.exportConversation);

export default router;
