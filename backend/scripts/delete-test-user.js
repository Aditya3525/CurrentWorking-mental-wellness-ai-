const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const email = process.argv[2];
    if (!email) {
      console.error('Usage: node scripts/delete-test-user.js <email>');
      process.exit(1);
    }
    const deleted = await prisma.user.delete({
      where: { email: email.toLowerCase() },
    });
    console.log('Deleted user:', deleted.id, deleted.email);
  } catch (error) {
    console.error('Delete failed:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
