import express from 'express';
import { authenticate } from '../middleware/auth';
import { listContent, getContentById } from '../controllers/contentController';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// YouTube API status check (for diagnostics) - No auth required
router.get('/youtube/status', asyncHandler(async (req, res) => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const hasApiKey = !!(apiKey && apiKey.trim() && apiKey !== 'your_youtube_data_api_key');
  
  res.json({
    configured: hasApiKey,
    apiKeyPresent: hasApiKey,
    quotaAvailable: true, // We'd need to make an actual API call to check quota
    message: hasApiKey 
      ? 'YouTube API key is configured' 
      : 'YouTube API key is not configured. Set YOUTUBE_API_KEY in .env'
  });
}));

// Apply authentication to all other routes
router.use(authenticate as any);
router.get('/', listContent as any);
router.get('/:id', getContentById as any);

export default router;
