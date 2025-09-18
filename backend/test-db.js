const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function testDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check if admin user exists
    console.log('Checking for admin user...');
    const admin = await prisma.adminUser.findUnique({
      where: { email: 'admin@example.com' }
    });
    
    if (admin) {
      console.log('✅ Admin user found:', admin.email);
      console.log('Password check...');
      const isValid = await bcrypt.compare('admin123', admin.password);
      console.log('Password valid:', isValid);
    } else {
      console.log('❌ Admin user not found, creating...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const newAdmin = await prisma.adminUser.create({
        data: {
          email: 'admin@example.com',
          name: 'Admin User',
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          isActive: true,
          permissions: JSON.stringify({
            create: true,
            read: true,
            update: true,
            delete: true,
            manageUsers: true,
            manageContent: true,
            viewAnalytics: true
          })
        }
      });
      console.log('✅ Admin user created:', newAdmin.email);
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase().then(() => {
  console.log('Done!');
  process.exit(0);
}).catch(error => {
  console.error('Failed:', error);
  process.exit(1);
});
