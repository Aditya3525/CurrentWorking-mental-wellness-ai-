import express from 'express';
import { authenticateAdmin, requireRole, requirePermission } from '../middleware/adminAuth';
import {
  adminLogin,
  adminLogout,
  createContent,
  updateContent,
  deleteContent,
  listAllContent,
  getContentById,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addContentToPlaylist,
  removeContentFromPlaylist,
  reorderPlaylistItems,
  listAllPlaylists,
  getDashboardStats,
  getContentAnalytics
} from '../controllers/adminController';

const router = express.Router();

// Public routes (no authentication required)
router.post('/login', adminLogin);

// All other routes require admin authentication
router.use(authenticateAdmin as any);

// Authentication routes
router.post('/logout', adminLogout);

// Dashboard and Analytics
router.get('/dashboard/stats', getDashboardStats);
router.get('/analytics/content/:id', getContentAnalytics);

// Content Management Routes
router.get('/content', listAllContent);
router.get('/content/:id', getContentById);
router.post('/content', requirePermission('content:create'), createContent);
router.put('/content/:id', requirePermission('content:edit'), updateContent);
router.delete('/content/:id', requirePermission('content:delete'), deleteContent);

// Playlist Management Routes
router.get('/playlists', listAllPlaylists);
router.post('/playlists', requirePermission('playlist:create'), createPlaylist);
router.put('/playlists/:id', requirePermission('playlist:edit'), updatePlaylist);
router.delete('/playlists/:id', requirePermission('playlist:delete'), deletePlaylist);

// Playlist Content Management
router.post('/playlists/:playlistId/content/:contentId', 
  requirePermission('playlist:edit'), 
  addContentToPlaylist
);
router.delete('/playlists/:playlistId/content/:contentId', 
  requirePermission('playlist:edit'), 
  removeContentFromPlaylist
);
router.put('/playlists/:playlistId/reorder', 
  requirePermission('playlist:edit'), 
  reorderPlaylistItems
);

export default router;
