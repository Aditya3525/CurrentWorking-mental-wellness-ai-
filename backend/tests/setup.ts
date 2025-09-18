/// <reference types="jest" />

import { PrismaClient } from '@prisma/client';

declare global {
  var __PRISMA__: PrismaClient | undefined;
  namespace jest {
    interface Matchers<R> {
      toBeArray(): R;
      toBeValidDate(): R;
    }
  }
}

// Test database setup
const prisma = global.__PRISMA__ || new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

if (process.env.NODE_ENV !== 'production') {
  global.__PRISMA__ = prisma;
}

// Setup and teardown functions
beforeAll(async () => {
  // Setup test database
  console.log('Setting up test database...');
});

afterAll(async () => {
  // Cleanup test database
  await prisma.$disconnect();
  console.log('Test database disconnected');
});

beforeEach(async () => {
  // Clean database before each test
  await cleanDatabase();
});

async function cleanDatabase() {
  // Delete test data in proper order to avoid foreign key constraints
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;
  
  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
      } catch (error) {
        console.log(`Error truncating ${tablename}:`, error);
      }
    }
  }
}

export { prisma };