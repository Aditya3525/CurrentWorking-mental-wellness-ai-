const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchema() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    const content = await prisma.content.findFirst();
    console.log('📄 Content fields:', Object.keys(content || {}));
    console.log('\n📊 Sample content:', JSON.stringify(content, null, 2));

    // Check if ContentEngagement exists
    try {
      const engagement = await prisma.contentEngagement.findFirst();
      console.log('\n✅ ContentEngagement table exists');
      console.log('Fields:', Object.keys(engagement || {}));
    } catch (e) {
      console.log('\n❌ ContentEngagement table does not exist or error:', e.message);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
