import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

/**
 * Database Configuration with Connection Pooling
 * 
 * This implements a singleton pattern to ensure we only have one PrismaClient instance
 * across the entire application, preventing connection pool exhaustion.
 */

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ] 
      : [{ emit: 'event', level: 'error' }],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

const hasEventSupport = typeof prisma.$on === 'function';

// Log slow queries in development when event hooks are available
if (hasEventSupport && process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: any) => {
    if (e.duration > 1000) { // Queries taking > 1 second
      logger.warn({
        query: e.query,
        duration: `${e.duration}ms`,
        params: e.params
      }, 'Slow database query detected');
    }
  });
}

// Log errors if event hooks are available; skip silently in test mocks
if (hasEventSupport) {
  prisma.$on('error' as never, (e: any) => {
    logger.error({ err: e }, 'Database error');
  });
}

// Graceful shutdown (no-op in tests where disconnect is not provided)
process.on('beforeExit', async () => {
  if (typeof prisma.$disconnect === 'function') {
    await prisma.$disconnect();
  }
});

export default prisma;
