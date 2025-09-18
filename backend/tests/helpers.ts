export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

export interface TestContent {
  id: string;
  title: string;
  type: string;
  content: string;
}

export interface TestPractice {
  id: string;
  title: string;
  type: string;
  duration: number;
  instructions: string;
}

export const createTestUser = async (prisma: any, userData: Partial<TestUser> = {}): Promise<TestUser> => {
  const defaultUser = {
    email: `test${Date.now()}@example.com`,
    name: 'Test User',
    role: 'USER' as const,
    ...userData
  };

  return await prisma.user.create({
    data: defaultUser
  });
};

export const createTestAdmin = async (prisma: any, adminData: Partial<TestUser> = {}): Promise<TestUser> => {
  return createTestUser(prisma, { role: 'ADMIN', ...adminData });
};

export const createTestContent = async (prisma: any, contentData: Partial<TestContent> = {}): Promise<TestContent> => {
  const defaultContent = {
    title: `Test Content ${Date.now()}`,
    type: 'article',
    content: 'Test content body',
    category: 'mindfulness',
    difficulty: 'beginner',
    isPublished: true,
    ...contentData
  };

  return await prisma.content.create({
    data: defaultContent
  });
};

export const createTestPractice = async (prisma: any, practiceData: Partial<TestPractice> = {}): Promise<TestPractice> => {
  const defaultPractice = {
    title: `Test Practice ${Date.now()}`,
    type: 'meditation',
    duration: 10,
    instructions: 'Test practice instructions',
    category: 'mindfulness',
    difficulty: 'beginner',
    isPublished: true,
    ...practiceData
  };

  return await prisma.practice.create({
    data: defaultPractice
  });
};

export const generateAuthToken = (userId: string): string => {
  // Mock JWT token generation for testing
  return `test-token-${userId}`;
};

export const mockRequest = (data: any = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
  session: {},
  ...data
});

export const mockResponse = () => {
  const res = {
    status: jest.fn(() => res),
    json: jest.fn(() => res),
    send: jest.fn(() => res),
    cookie: jest.fn(() => res),
    clearCookie: jest.fn(() => res),
    redirect: jest.fn(() => res)
  };
  return res;
};

export const mockNext = () => jest.fn();

export const expectValidationError = (response: any, field?: string) => {
  expect(response.status).toHaveBeenCalledWith(400);
  if (field) {
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining(field)
      })
    );
  }
};

export const expectUnauthorizedError = (response: any) => {
  expect(response.status).toHaveBeenCalledWith(401);
};

export const expectForbiddenError = (response: any) => {
  expect(response.status).toHaveBeenCalledWith(403);
};

export const expectNotFoundError = (response: any) => {
  expect(response.status).toHaveBeenCalledWith(404);
};

export const expectSuccessResponse = (response: any, data?: any) => {
  expect(response.status).toHaveBeenCalledWith(200);
  if (data) {
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining(data)
    );
  }
};