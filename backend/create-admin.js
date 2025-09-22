const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.adminUser.findFirst({
      where: { email: 'admin@example.com' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:');
      console.log(`Email: ${existingAdmin.email}`);
      console.log(`Name: ${existingAdmin.name}`);
      console.log(`Role: ${existingAdmin.role}`);
      console.log(`Active: ${existingAdmin.isActive}`);
      return;
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    const admin = await prisma.adminUser.create({
      data: {
        email: 'admin@example.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      }
    });

    console.log('🎉 Admin user created successfully!');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Password: Admin123!');
    console.log(`👤 Name: ${admin.name}`);
    console.log(`🛡️ Role: ${admin.role}`);
    console.log('');
    console.log('🚀 You can now log into the admin panel!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();