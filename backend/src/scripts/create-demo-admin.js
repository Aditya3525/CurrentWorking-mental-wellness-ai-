const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createDemoAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@mentalwellbeing.ai' }
    });

    if (existingAdmin) {
      console.log('✅ Demo admin already exists:', existingAdmin.email);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@mentalwellbeing.ai',
        password: hashedPassword,
        name: 'Admin User',
        firstName: 'Admin',
        lastName: 'User',
        isOnboarded: true,
        dataConsent: true,
        clinicianSharing: false
      }
    });

    console.log('✅ Demo admin created successfully!');
    console.log('📧 Email: admin@mentalwellbeing.ai');
    console.log('🔑 Password: admin123');
    console.log('🆔 ID:', admin.id);

  } catch (error) {
    console.error('❌ Error creating demo admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoAdmin();