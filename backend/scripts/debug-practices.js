const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const practices = await prisma.practice.findMany({
      select: { id: true, title: true, requiredEquipment: true, approach: true }
    });
    console.log(JSON.stringify(practices, null, 2));
  } catch (error) {
    console.error('Failed to fetch practices:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
