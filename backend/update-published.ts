import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating practices to published status...');
  
  const result = await prisma.practice.updateMany({
    where: {
      isPublished: false
    },
    data: {
      isPublished: true
    }
  });
  
  console.log(`✅ Updated ${result.count} practices to published`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
