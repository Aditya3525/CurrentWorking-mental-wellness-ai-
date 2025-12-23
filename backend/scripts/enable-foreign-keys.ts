/**
 * Enable foreign key constraints for SQLite database
 * Run this before using Prisma Studio
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function enableForeignKeys() {
  try {
    // Enable foreign keys
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;');
    
    // Verify it's enabled
    const result = await prisma.$queryRawUnsafe('PRAGMA foreign_keys;') as any[];
    
    if (result[0].foreign_keys === 1) {
      console.log('✅ Foreign key constraints are ENABLED');
      console.log('✅ You can now perform CRUD operations in Prisma Studio');
    } else {
      console.log('❌ Foreign key constraints are still DISABLED');
    }
    
  } catch (error) {
    console.error('❌ Error enabling foreign keys:', error);
  } finally {
    await prisma.$disconnect();
  }
}

enableForeignKeys();
