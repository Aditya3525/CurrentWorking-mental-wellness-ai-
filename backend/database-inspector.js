const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('Connected to database successfully!');
    console.log('\n=== DATABASE TABLES ===');

    // Show all available models
    const models = Object.keys(prisma).filter(key =>
      !key.startsWith('$') && !key.startsWith('_') && typeof prisma[key] === 'object'
    );
    console.log('Available tables:', models.join(', '));

    console.log('\n=== USERS ===');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isOnboarded: true,
        createdAt: true
      }
    });
    console.log(`Total users: ${users.length}`);
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Name: ${user.name}, Onboarded: ${user.isOnboarded}`);
    });

    console.log('\n=== ASSESSMENTS ===');
    const assessments = await prisma.assessment.findMany({
      select: {
        id: true,
        userId: true,
        score: true,
        completedAt: true
      }
    });
    console.log(`Total assessments: ${assessments.length}`);

    console.log('\n=== CHAT MESSAGES ===');
    const messages = await prisma.chatMessage.findMany({
      select: {
        id: true,
        userId: true,
        type: true,
        createdAt: true
      }
    });
    console.log(`Total messages: ${messages.length}`);

    console.log('\n=== COMMANDS TO DELETE DATA ===');
    console.log('// To delete all users:');
    console.log('await prisma.user.deleteMany();');
    console.log('');
    console.log('// To delete specific user by email:');
    console.log('await prisma.user.deleteMany({ where: { email: "user@example.com" } });');
    console.log('');
    console.log('// To delete all assessments:');
    console.log('await prisma.assessment.deleteMany();');
    console.log('');
    console.log('// To delete all chat messages:');
    console.log('await prisma.chatMessage.deleteMany();');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();