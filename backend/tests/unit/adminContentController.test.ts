import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test data factory
const createMockContentData = (overrides = {}) => ({
  title: 'Test Content',
  type: 'article',
  category: 'Mindfulness',
  approach: 'hybrid',
  content: 'Test content body with meaningful information about mindfulness practices.',
  duration: '5 min',
  difficulty: 'Beginner',
  description: 'A comprehensive guide to mindfulness practices',
  isPublished: false,
  ...overrides
});

const createMockUserData = (overrides = {}) => ({
  email: `test${Date.now()}@example.com`,
  name: 'Test User',
  password: 'hashedpassword',
  ...overrides
});

describe('Admin Content Controller Tests', () => {
  let testAdmin: any;

  beforeEach(async () => {
    // Clean database
    await prisma.content.deleteMany();
    await prisma.user.deleteMany();
    
    // Create test admin
    testAdmin = await prisma.user.create({
      data: createMockUserData({
        email: 'admin@test.com',
        name: 'Test Admin'
      })
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Content Creation', () => {
    it('should create content with valid data', async () => {
      const contentData = createMockContentData({
        createdBy: testAdmin.id
      });

      const createdContent = await prisma.content.create({
        data: contentData
      });

      expect(createdContent.title).toBe(contentData.title);
      expect(createdContent.type).toBe(contentData.type);
      expect(createdContent.category).toBe(contentData.category);
      expect(createdContent.isPublished).toBe(false);
      expect(createdContent.createdBy).toBe(testAdmin.id);
    });

    it('should create content with all optional fields', async () => {
      const contentData = createMockContentData({
        author: 'Dr. Jane Smith',
        fileType: 'pdf',
        fileUrl: 'https://example.com/file.pdf',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        severityLevel: 'Mild',
        targetAudience: JSON.stringify(['anxiety', 'beginners']),
        effectiveness: 4.5,
        prerequisites: JSON.stringify(['basic_mindfulness']),
        outcomes: JSON.stringify(['reduced_stress', 'improved_focus']),
        keywords: 'mindfulness, meditation, stress relief',
        adminNotes: 'High-quality content for beginners'
      });

      const createdContent = await prisma.content.create({
        data: contentData
      });

      expect(createdContent.author).toBe('Dr. Jane Smith');
      expect(createdContent.effectiveness).toBe(4.5);
      expect(createdContent.severityLevel).toBe('Mild');
      expect(createdContent.keywords).toBe('mindfulness, meditation, stress relief');
    });
  });

  describe('Content Retrieval', () => {
    it('should retrieve content with pagination', async () => {
      // Create multiple content items
      await Promise.all([
        prisma.content.create({ data: createMockContentData({ title: 'Content 1' }) }),
        prisma.content.create({ data: createMockContentData({ title: 'Content 2' }) }),
        prisma.content.create({ data: createMockContentData({ title: 'Content 3' }) }),
      ]);

      const page1 = await prisma.content.findMany({
        take: 2,
        skip: 0,
        orderBy: { createdAt: 'desc' }
      });

      const page2 = await prisma.content.findMany({
        take: 2,
        skip: 2,
        orderBy: { createdAt: 'desc' }
      });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(1);
    });

    it('should filter content by category', async () => {
      await Promise.all([
        prisma.content.create({ data: createMockContentData({ category: 'Mindfulness' }) }),
        prisma.content.create({ data: createMockContentData({ category: 'Anxiety' }) }),
        prisma.content.create({ data: createMockContentData({ category: 'Mindfulness' }) }),
      ]);

      const mindfulnessContent = await prisma.content.findMany({
        where: { category: 'Mindfulness' }
      });

      expect(mindfulnessContent).toHaveLength(2);
    });
  });

  describe('Bulk Operations', () => {
    it('should publish multiple content items', async () => {
      const content1 = await prisma.content.create({
        data: createMockContentData({ title: 'Content 1', isPublished: false })
      });
      const content2 = await prisma.content.create({
        data: createMockContentData({ title: 'Content 2', isPublished: false })
      });

      await prisma.content.updateMany({
        where: {
          id: { in: [content1.id, content2.id] }
        },
        data: {
          isPublished: true,
          lastEditedBy: testAdmin.id
        }
      });

      const updatedContent = await prisma.content.findMany({
        where: {
          id: { in: [content1.id, content2.id] }
        }
      });

      expect(updatedContent.every(c => c.isPublished)).toBe(true);
      expect(updatedContent.every(c => c.lastEditedBy === testAdmin.id)).toBe(true);
    });
  });
});