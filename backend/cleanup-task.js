const { PrismaClient } = require('@prisma/client');
const { TokenManager } = require('./src/utils/tokenUtils');

const prisma = new PrismaClient();

/**
 * Scheduled cleanup task for tokens and audit logs
 * Run this as a cron job in production
 */
async function performCleanup() {
  try {
    console.log('🧹 Starting scheduled cleanup...');
    
    // Clean up expired tokens
    console.log('Cleaning up expired tokens...');
    await TokenManager.cleanupExpiredTokens();
    
    // Clean up old audit logs (keep 90 days)
    console.log('Cleaning up old audit logs...');
    const deletedLogs = await prisma.userActivity.deleteMany({
      where: {
        timestamp: {
          lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
        }
      }
    });
    
    console.log(`✅ Cleanup completed:`);
    console.log(`- Expired tokens cleaned`);
    console.log(`- ${deletedLogs.count} old audit logs removed`);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup if called directly
if (require.main === module) {
  performCleanup();
}

module.exports = { performCleanup };
