// Convenience script to add a normal User for testing
// Usage: node add-aditya-user.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

(async () => {
	try {
		const email = 'aditya@example.com';
		const existing = await prisma.user.findUnique({ where: { email } });
		if (existing) {
			console.log('User already exists:', email);
			process.exit(0);
		}
		const password = await bcrypt.hash('password123', 10);
		const user = await prisma.user.create({
			data: {
				email,
				name: 'Aditya',
				password,
				approach: 'hybrid',
				isOnboarded: true,
				dataConsent: true,
			},
		});
		console.log('Created user:', user.email);
		process.exit(0);
	} catch (err) {
		console.error(err);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
})();
