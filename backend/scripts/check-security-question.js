const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany({
      take: 1,
      select: {
        id: true,
        email: true,
      },
    });
    console.log('Sample user:', users);

    if (users[0]) {
      console.log('Attempting to set security question for', users[0].email);
      const updated = await prisma.user.update({
        where: { id: users[0].id },
        data: {
          securityQuestion: 'Test question',
          securityAnswerHash: 'dummy-hash',
        },
        select: {
          id: true,
          securityQuestion: true,
          securityAnswerHash: true,
        },
      });
      console.log('Update succeeded:', updated);
    }
  } catch (error) {
    console.error('Prisma error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
