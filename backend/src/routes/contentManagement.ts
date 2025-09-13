import express from 'express';
import { authenticateAdmin, requirePermission } from '../middleware/adminAuth';
import {
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
} from '../controllers/adminController';

// Note: This file provides an alternative mount point if needed.
const router = express.Router();

router.use(authenticateAdmin as any);

// Content
router.get('/content', listAllContent as any);
router.get('/content/:id', getContentById as any);
router.post('/content', requirePermission('content:create') as any, createContent as any);
router.put('/content/:id', requirePermission('content:edit') as any, updateContent as any);
router.delete('/content/:id', requirePermission('content:delete') as any, deleteContent as any);

// Playlists
router.get('/playlists', listAllPlaylists as any);
router.post('/playlists', requirePermission('playlist:create') as any, createPlaylist as any);
router.put('/playlists/:id', requirePermission('playlist:edit') as any, updatePlaylist as any);
router.delete('/playlists/:id', requirePermission('playlist:delete') as any, deletePlaylist as any);
router.post('/playlists/:playlistId/content/:contentId', requirePermission('playlist:edit') as any, addContentToPlaylist as any);
router.delete('/playlists/:playlistId/content/:contentId', requirePermission('playlist:edit') as any, removeContentFromPlaylist as any);
router.put('/playlists/:playlistId/reorder', requirePermission('playlist:edit') as any, reorderPlaylistItems as any);

export default router;

