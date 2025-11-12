import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const router = express.Router();
const execAsync = promisify(exec);

/**
 * Manual seed endpoint - can be called once to seed the database
 * Access: GET /api/seed/run?token=your_jwt_secret
 * This is a one-time setup endpoint - remove after use or secure properly
 */
router.get('/run', async (req, res) => {
  try {
    // Simple security: require JWT_SECRET as query param
    const token = req.query.token;
    const expectedToken = process.env.JWT_SECRET;

    if (!token || token !== expectedToken) {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized. Provide valid token as query parameter.' 
      });
    }

    console.log('Starting manual seed...');
    
    // Run seed command
    const { stdout, stderr } = await execAsync('npm run seed', {
      cwd: __dirname + '/../..'
    });

    console.log('Seed output:', stdout);
    if (stderr) console.error('Seed errors:', stderr);

    res.json({
      success: true,
      message: 'Database seeded successfully!',
      output: stdout
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to seed database',
      details: error.message
    });
  }
});

export default router;
