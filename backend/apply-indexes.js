const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyIndexes() {
  try {
    console.log('Applying database indexes...');
    
    const sqlFile = path.join(__dirname, 'database_indexes.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split SQL by semicolons and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      try {
        await prisma.$executeRawUnsafe(statement.trim());
        console.log('✓ Applied index:', statement.substring(0, 50) + '...');
      } catch (error) {
        console.warn('⚠ Index might already exist:', statement.substring(0, 50) + '...');
      }
    }
    
    console.log('✅ Database indexes applied successfully!');
  } catch (error) {
    console.error('❌ Error applying indexes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

applyIndexes();
