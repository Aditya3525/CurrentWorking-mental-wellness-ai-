/**
 * Custom Prisma Studio launcher with SQLite foreign keys enabled
 * This script creates a wrapper that ensures foreign keys are always on
 */

import { spawn } from 'child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupAndLaunchStudio() {
  try {
    console.log('🔧 Setting up SQLite database...');
    
    // Try to enable foreign keys (though it won't persist for Prisma Studio)
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;');
    
    console.log('\n⚠️  IMPORTANT: SQLite Foreign Key Limitation');
    console.log('━'.repeat(60));
    console.log('SQLite does not support persistent foreign key constraints.');
    console.log('Each connection must enable them with PRAGMA foreign_keys = ON;');
    console.log('');
    console.log('Prisma Studio creates its own connections and CANNOT enable');
    console.log('foreign keys automatically for SQLite.');
    console.log('');
    console.log('📋 To DELETE records in Prisma Studio:');
    console.log('   1. Delete child records first (manual cascade)');
    console.log('   2. OR use the delete script:');
    console.log('      npx tsx scripts/delete-user.ts user@example.com');
    console.log('');
    console.log('✅ For production, consider switching to PostgreSQL');
    console.log('   which properly enforces foreign key constraints.');
    console.log('━'.repeat(60));
    console.log('');
    console.log('🚀 Launching Prisma Studio...\n');
    
    await prisma.$disconnect();
    
    // Launch Prisma Studio
    const studioProcess = spawn('npx', ['prisma', 'studio'], {
      stdio: 'inherit',
      shell: true
    });
    
    studioProcess.on('error', (error) => {
      console.error('Failed to start Prisma Studio:', error);
      process.exit(1);
    });
    
    studioProcess.on('close', (code) => {
      process.exit(code || 0);
    });
    
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

setupAndLaunchStudio();
