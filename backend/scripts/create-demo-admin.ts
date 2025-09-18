// Demo Admin User Setup Script
// This script creates the demo admin user with credentials: admin@wellness.com / Aditya@777

import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createDemoAdmin() {
  try {
    console.log('🔧 Creating demo admin user...');

    // Hash the password
    const password = 'Aditya@777';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Check if admin user already exists
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: 'admin@wellness.com' }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists, updating password...');
      
      await prisma.adminUser.update({
        where: { email: 'admin@wellness.com' },
        data: {
          password: hashedPassword,
          isActive: true,
          updatedAt: new Date()
        }
      });

      console.log('✅ Demo admin user password updated successfully');
    } else {
      // Create new admin user
      const adminUser = await prisma.adminUser.create({
        data: {
          email: 'admin@wellness.com',
          name: 'System Administrator',
          password: hashedPassword,
          role: 'admin',
          permissions: JSON.stringify([
            'content:read',
            'content:write',
            'content:delete',
            'practices:read',
            'practices:write',
            'practices:delete',
            'users:read',
            'analytics:read',
            'admin:sessions'
          ]),
          isActive: true
        }
      });

      console.log('✅ Demo admin user created successfully');
      console.log(`📧 Email: ${adminUser.email}`);
      console.log(`🔐 Password: ${password}`);
      console.log(`👤 Role: ${adminUser.role}`);
    }

    // Create a super admin user as well
    const existingSuperAdmin = await prisma.adminUser.findUnique({
      where: { email: 'superadmin@wellness.com' }
    });

    if (!existingSuperAdmin) {
      const superAdminPassword = 'SuperAdmin@777';
      const hashedSuperAdminPassword = await bcrypt.hash(superAdminPassword, saltRounds);

      const superAdmin = await prisma.adminUser.create({
        data: {
          email: 'superadmin@wellness.com',
          name: 'Super Administrator',
          password: hashedSuperAdminPassword,
          role: 'super_admin',
          permissions: JSON.stringify([
            'content:read',
            'content:write',
            'content:delete',
            'practices:read',
            'practices:write',
            'practices:delete',
            'users:read',
            'users:write',
            'users:delete',
            'analytics:read',
            'admin:read',
            'admin:write',
            'admin:delete',
            'admin:sessions',
            'system:maintenance'
          ]),
          isActive: true
        }
      });

      console.log('✅ Super admin user created successfully');
      console.log(`📧 Email: ${superAdmin.email}`);
      console.log(`🔐 Password: ${superAdminPassword}`);
      console.log(`👤 Role: ${superAdmin.role}`);
    }

    console.log('\n🎉 Demo admin setup completed!');
    console.log('\n📋 Admin Login Credentials:');
    console.log('   Regular Admin:');
    console.log('   Email: admin@wellness.com');
    console.log('   Password: Aditya@777');
    console.log('\n   Super Admin:');
    console.log('   Email: superadmin@wellness.com');
    console.log('   Password: SuperAdmin@777');

  } catch (error) {
    console.error('❌ Error creating demo admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  createDemoAdmin()
    .then(() => {
      console.log('Demo admin setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Demo admin setup failed:', error);
      process.exit(1);
    });
}

export { createDemoAdmin };