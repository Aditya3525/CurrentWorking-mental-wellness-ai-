const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

(async () => {
  const prisma = new PrismaClient();
  try {
    const admins = await prisma.adminUser.findMany();
    console.log('Admins:', admins.map(a => ({ email: a.email, role: a.role, isActive: a.isActive, passwordHashPrefix: a.password?.slice(0,7) })));

    const check = async (email, password) => {
      const a = await prisma.adminUser.findUnique({ where: { email } });
      if (!a) return { email, exists: false };
      const ok = await bcrypt.compare(password, a.password);
      return { email, exists: true, match: ok };
    };

    console.log('Password checks:');
    console.log(await check('admin@mentalwellbeing.ai', 'admin123'));
    console.log(await check('admin@example.com', 'admin123'));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
