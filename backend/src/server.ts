import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';
import pinoHttp from 'pino-http';
import { PrismaClient } from '@prisma/client';
import passport from './config/passport';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import assessmentRoutes from './routes/assessments';
import planRoutes from './routes/plans';
import chatRoutes from './routes/chat';
import conversationRoutes from './routes/conversations';
import progressRoutes from './routes/progress';
import moodRoutes from './routes/mood';
import contentRoutes from './routes/content';
import adminRoutes from './routes/admin';
import publicPracticesRoutes from './routes/practices';
import publicContentRoutes from './routes/publicContent';
import engagementRoutes from './routes/engagement';
import dashboardRoutes from './routes/dashboard';
import chatbotRoutes from './routes/chatbot';
import seedRoutes from './routes/seed';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { logger, refreshLogLevelFromEnv } from './utils/logger';
import { llmService } from './services/llmProvider';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });
refreshLogLevelFromEnv();

const app = express();
const PORT = typeof process.env.PORT === 'string' ? parseInt(process.env.PORT, 10) : 5000;
const readinessPrisma = new PrismaClient();
// When deployed behind a proxy, trust it so secure cookies and IP work correctly
app.set('trust proxy', 1);

// Rate limiting (enabled only in production to avoid noisy 429s during local dev)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const httpLogger = pinoHttp({
  logger,
  genReqId: (req: IncomingMessage, _res: ServerResponse) => {
    const headerId = req.headers['x-request-id'];
    if (typeof headerId === 'string' && headerId.trim().length > 0) {
      return headerId.trim();
    }
    if (Array.isArray(headerId) && headerId.length > 0) {
      return headerId[0];
    }
    return randomUUID();
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(httpLogger);
app.use((req, res, next) => {
  res.locals.requestId = (req as any).id;
  try {
    const sid = (req as any).sessionID;
    if (sid) logger.debug({ sid, reqId: (req as any).id }, 'session trace');
  } catch {}
  next();
});
if (process.env.NODE_ENV === 'production') {
  app.use(limiter);
}
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.FRONTEND_URL || 'http://localhost:3000')
    : true, // Allow all origins in development
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
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
// Serve uploaded media statically
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    requestId: (req as any).id
  });
});

app.get('/health/ready', async (req, res) => {
  const requestId = (req as any).id;
  const checks: {
    database: { status: 'pass' | 'fail'; error?: string };
    providers: Record<string, { available: boolean; name: string; cooldownActive: boolean; cooldownExpiresAt: string | null; lastError?: string }>; }
    = {
      database: { status: 'pass' },
      providers: {}
    };

  let databaseHealthy = true;
  try {
    await readinessPrisma.$queryRaw`SELECT 1`;
  } catch (error: any) {
    databaseHealthy = false;
    checks.database = {
      status: 'fail',
      error: error?.message ?? 'Database connectivity check failed'
    };
    logger.error({ err: error, requestId }, 'Database readiness check failed');
  }

  const providerStatus = await llmService.getProviderStatus();
  checks.providers = providerStatus;
  const providersHealthy = Object.values(providerStatus).some((status) => status.available);

  const isReady = databaseHealthy && providersHealthy;
  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'degraded',
    requestId,
    checks,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/practices', publicPracticesRoutes);
app.use('/api/public-content', publicContentRoutes);
app.use('/api/dashboard', dashboardRoutes);
// Enhanced engagement & recommendation endpoints
app.use('/api/content', engagementRoutes); // For /api/content/:id/engage and /api/content/:id/engagement
app.use('/api/recommendations', engagementRoutes); // For /api/recommendations/personalized
app.use('/api/crisis', engagementRoutes); // For /api/crisis/check
app.use('/api/seed', seedRoutes); // Manual database seeding endpoint

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
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info({
      event: 'server_started',
      port: PORT,
      environment: process.env.NODE_ENV,
      frontendUrl: process.env.FRONTEND_URL,
      host: '0.0.0.0'
    }, 'HTTP server is listening on all network interfaces');
  });
}

export default app;
