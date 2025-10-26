import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import request from 'supertest';
import app from '../src/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Admin auth session flow', () => {
  const adminEmail = 'admin@mentalwellbeing.ai';
  let createdUserId: string | null = null;

  beforeAll(async () => {
    // Ensure admin user exists with no password (so default demo password works)
    const user = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        name: 'Test Admin',
        isOnboarded: true,
        dataConsent: true,
      },
    });
    createdUserId = user.id;
  });

  afterAll(async () => {
    // Leave user in DB for other tests; just disconnect prisma
    await prisma.$disconnect();
  });

  it('logs in and then returns session details', async () => {
    const agent = request.agent(app);

    const loginRes = await agent
      .post('/api/admin/login')
      .set('Origin', 'http://localhost:3000')
      .set('Accept', 'application/json')
      .send({ email: adminEmail, password: 'admin123' })
      .expect(200);

    expect(loginRes.body).toBeDefined();
    expect(loginRes.body.email).toBe(adminEmail);

    const sessionRes = await agent
      .get('/api/admin/session')
      .set('Origin', 'http://localhost:3000')
      .set('Accept', 'application/json')
      .expect(200);

    expect(sessionRes.body).toBeDefined();
    expect(sessionRes.body.email).toBe(adminEmail);
    expect(sessionRes.body.role).toBe('Admin');
  });
});
