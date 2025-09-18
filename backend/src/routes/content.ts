import express from 'express';
import { authenticate, requirePassword } from '../middleware/auth';
import { 
  listContent, 
  getContentById, 
  rateContent, 
  getUserRating,
  listPlaylists,
  getPlaylistById,
  ratePlaylist,
  getUserPlaylistRating,
  getPersonalizedRecommendations,
  searchContent
} from '../controllers/contentController';

const router = express.Router();

router.use(authenticate as any);
router.use(requirePassword as any);

// Content routes
router.get('/', listContent as any);
router.get('/search', searchContent as any);
router.get('/recommendations', getPersonalizedRecommendations as any);
router.get('/:id', getContentById as any);
router.post('/:id/rate', rateContent as any);
router.get('/:id/rating', getUserRating as any);

// Playlist routes
router.get('/playlists/list', listPlaylists as any);
router.get('/playlists/:id', getPlaylistById as any);
router.post('/playlists/:id/rate', ratePlaylist as any);
router.get('/playlists/:id/rating', getUserPlaylistRating as any);

export default router;
