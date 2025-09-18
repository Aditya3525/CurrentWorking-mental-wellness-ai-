import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  upload,
  uploadFile,
  uploadMultipleFiles,
  getFile,
  getFileThumbnail,
  listFiles,
  deleteFile,
  updateFileMetadata,
  getFileAnalytics
} from '../controllers/fileController';

const router = express.Router();

// Single file upload
router.post('/upload', authenticate as any, upload.single('file'), uploadFile as any);

// Multiple file upload
router.post('/upload/multiple', authenticate as any, upload.array('files', 10), uploadMultipleFiles as any);

// Get file by ID (public endpoint, no auth required)
router.get('/:id', getFile as any);

// Get file thumbnail (public endpoint, no auth required)
router.get('/:id/thumbnail', getFileThumbnail as any);

// List user's files
router.get('/', authenticate as any, listFiles as any);

// Update file metadata
router.put('/:id', authenticate as any, updateFileMetadata as any);

// Delete file
router.delete('/:id', authenticate as any, deleteFile as any);

// File analytics (admin only)
router.get('/analytics/overview', authenticate as any, getFileAnalytics as any);

export default router;

export default router;