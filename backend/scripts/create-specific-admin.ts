import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@wellness.com';
  const password = process.env.ADMIN_PASSWORD || 'Aditya@777';
  const name = process.env.ADMIN_NAME || 'Wellness Admin';

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    return;
  }
  const hashed = await bcrypt.hash(password, 10);
  const admin = await prisma.adminUser.create({
    data: {
      email,
      name,
      password: hashed,
      role: 'admin',
      isActive: true
    }
  });
  console.log('Created admin user:', { id: admin.id, email: admin.email });
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
