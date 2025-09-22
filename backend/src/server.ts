import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import passport from './config/passport';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import assessmentRoutes from './routes/assessments';
import planRoutes from './routes/plans';
import chatRoutes from './routes/chat';
import progressRoutes from './routes/progress';
import contentRoutes from './routes/content';
import adminAuthRoutes from './routes/adminAuth';
// import analyticsRoutes from './routes/analytics'; // Temporarily disabled pending schema alignment
// import fileRoutes from './routes/files'; // Temporarily disabled pending File model and media libs
import adminPracticesRoutes from './routes/adminPractices';
import adminContentRoutes from './routes/adminContent';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { startSessionCleanup } from './controllers/adminAuthController';
import { startPasswordResetCleanup } from './controllers/adminPasswordController';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(limiter);
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Session middleware (required for passport)
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
// app.use('/api/analytics', analyticsRoutes); // Disabled to avoid runtime errors from outdated analytics controller
// app.use('/api/files', fileRoutes); // Disabled pending File model and media processing libraries
app.use('/api/admin/practices', adminPracticesRoutes);
app.use('/api/admin/content', adminContentRoutes);

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from frontend build
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  
  // Handle React Router - send all non-API requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  });
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`🔒 Admin Auth: /api/admin/auth`);
  
  // Start admin session cleanup
  startSessionCleanup();
  
  // Start password reset cleanup
  startPasswordResetCleanup();
});

export default app;
