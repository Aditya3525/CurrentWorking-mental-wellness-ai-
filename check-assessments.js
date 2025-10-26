const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAssessments() {
  try {
    const results = await prisma.assessmentResult.findMany({
      orderBy: { completedAt: 'desc' },
      take: 15,
      select: {
        id: true,
        assessmentType: true,
        score: true,
        completedAt: true,
        userId: true
      }
    });
    
    console.log('Recent Assessments:');
    console.log(JSON.stringify(results, null, 2));
    
    await prisma.$disconnect();
  } catch (err) {
    console.error('Error:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkAssessments();
