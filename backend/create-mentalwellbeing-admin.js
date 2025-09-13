// Idempotent script to create initial AdminUser records for the CMS
// Usage: npm run admin:create

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function ensureAdmin(email, name, password, role = 'super_admin') {
	const existing = await prisma.adminUser.findUnique({ where: { email } });
	const hash = await bcrypt.hash(password, 10);
	if (existing) {
		const updated = await prisma.adminUser.update({
			where: { email },
			data: { password: hash, role, isActive: true, name },
		});
		return { created: false, reset: true, admin: updated };
	}
	const admin = await prisma.adminUser.create({
		data: {
			email,
			name,
			password: hash,
			role,
			isActive: true,
		},
	});
	return { created: true, reset: false, admin };
}

(async () => {
	try {
		// Create the demo admin used by the UI hint
		const demo = await ensureAdmin(
			'admin@mentalwellbeing.ai',
			'Demo Admin',
			'admin123',
			'super_admin'
		);

		// Also create a fallback example admin (user tried this in chat)
		const example = await ensureAdmin(
			'admin@example.com',
			'Example Admin',
			'admin123',
			'admin'
		);

			console.log('[admin:create] Results:');
			console.log(
				` - admin@mentalwellbeing.ai: ${demo.created ? 'CREATED' : 'UPDATED'} (role=${demo.admin.role})`
			);
			console.log(
				` - admin@example.com: ${example.created ? 'CREATED' : 'UPDATED'} (role=${example.admin.role})`
			);

		process.exit(0);
	} catch (err) {
		console.error('Failed to create admin users:', err);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
})();
