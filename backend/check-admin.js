const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkAndCreateAdmin() {
  try {
    console.log('🔍 Checking for admin user...');
    
    // Check if admin user exists
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: 'admin@example.com' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', {
        email: existingAdmin.email,
        role: existingAdmin.role,
        isActive: existingAdmin.isActive
      });
      return;
    }

    console.log('👤 Creating admin user...');
    
    // Create admin user if doesn't exist
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.adminUser.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        permissions: {
          create: true,
          read: true,
          update: true,
          delete: true,
          manageUsers: true,
          manageContent: true,
          viewAnalytics: true
        }
      }
    });

    console.log('✅ Admin user created successfully:', {
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateAdmin();
