const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateDurations() {
  console.log('🔄 Starting duration migration...\n');

  try {
    // Get all content
    const allContent = await prisma.content.findMany({
      select: { id: true, title: true, duration: true }
    });

    console.log(`Found ${allContent.length} content items to check\n`);

    let updated = 0;
    let skipped = 0;

    for (const content of allContent) {
      if (!content.duration) {
        console.log(`⏭️  Skipping "${content.title}" (no duration)`);
        skipped++;
        continue;
      }

      // Parse duration - could be "10 min", "10:00", "600", etc.
      let seconds = 0;
      const durationStr = content.duration.toString().trim();

      // Try different formats
      if (durationStr.includes(':')) {
        // Format: "10:30" (minutes:seconds)
        const parts = durationStr.split(':');
        seconds = parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
      } else if (durationStr.includes('min')) {
        // Format: "10 min"
        const minutes = parseInt(durationStr.replace(/[^0-9]/g, ''));
        seconds = minutes * 60;
      } else {
        // Assume it's already in seconds or just a number
        seconds = parseInt(durationStr);
      }

      if (isNaN(seconds) || seconds <= 0) {
        console.log(`⚠️  Warning: Could not parse duration "${content.duration}" for "${content.title}"`);
        skipped++;
        continue;
      }

      console.log(`✅ Converting "${content.title}": "${content.duration}" → ${seconds}s`);
      updated++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Items to update: ${updated}`);
    console.log(`   - Items skipped: ${skipped}`);
    console.log(`\n✨ Duration migration analysis complete!`);
    console.log(`\nNote: The actual conversion will happen when you run the Prisma migration.`);
    console.log(`Make sure to review the conversion logic above before proceeding.`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateDurations().catch((e) => {
  console.error(e);
  process.exit(1);
});
