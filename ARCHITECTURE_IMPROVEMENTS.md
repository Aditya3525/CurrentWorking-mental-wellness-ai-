# 🏗️ Architecture & Code Quality Improvements

## System Architecture Enhancements

### 1. Backend Architecture Improvements

#### A. Domain-Driven Design (DDD) Structure

**Current Structure:**
```
backend/src/
├── controllers/  # Mix of business logic and HTTP handling
├── services/     # Some business logic
├── routes/       # Route definitions
└── middleware/   # Cross-cutting concerns
```

**Improved Structure:**
```
backend/src/
├── api/                    # API layer (HTTP concerns)
│   ├── controllers/        # Request/response handling only
│   ├── routes/
│   ├── middleware/
│   └── validators/         # Input validation schemas
├── domain/                 # Business logic (framework-agnostic)
│   ├── user/
│   │   ├── UserService.ts
│   │   ├── UserRepository.ts
│   │   └── User.entity.ts
│   ├── assessment/
│   ├── chat/
│   └── wellness-plan/
├── infrastructure/         # External services
│   ├── database/
│   ├── cache/
│   ├── ai-providers/
│   └── storage/
├── shared/                 # Shared utilities
│   ├── errors/
│   ├── types/
│   └── utils/
└── application/            # Use cases / business orchestration
    ├── use-cases/
    └── dto/
```

**Example Implementation:**

```typescript
// backend/src/domain/user/UserRepository.ts
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
}

// backend/src/infrastructure/database/PrismaUserRepository.ts
export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}
  
  async findById(id: string): Promise<User | null> {
    const dbUser = await this.prisma.user.findUnique({ where: { id } });
    return dbUser ? this.toDomain(dbUser) : null;
  }
  
  private toDomain(dbUser: PrismaUser): User {
    return new User({
      id: dbUser.id,
      email: dbUser.email,
      // ... map fields
    });
  }
}

// backend/src/domain/user/UserService.ts
export class UserService {
  constructor(
    private userRepo: UserRepository,
    private passwordHasher: PasswordHasher,
    private eventBus: EventBus
  ) {}
  
  async registerUser(data: RegisterUserDTO): Promise<User> {
    // Business logic here
    const existingUser = await this.userRepo.findByEmail(data.email);
    if (existingUser) {
      throw new UserAlreadyExistsError(data.email);
    }
    
    const hashedPassword = await this.passwordHasher.hash(data.password);
    const user = new User({
      email: data.email,
      password: hashedPassword,
      // ...
    });
    
    const savedUser = await this.userRepo.save(user);
    
    // Emit domain event
    this.eventBus.publish(new UserRegisteredEvent(savedUser));
    
    return savedUser;
  }
}

// backend/src/api/controllers/AuthController.ts
export class AuthController {
  constructor(private userService: UserService) {}
  
  async register(req: Request, res: Response) {
    try {
      const dto = await this.validateAndMap(req.body, RegisterUserSchema);
      const user = await this.userService.registerUser(dto);
      
      res.status(201).json({
        success: true,
        data: this.toResponse(user)
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }
}
```

#### B. Event-Driven Architecture

```typescript
// backend/src/shared/events/EventBus.ts
export interface DomainEvent {
  eventId: string;
  eventType: string;
  occurredAt: Date;
  aggregateId: string;
}

export class EventBus {
  private handlers: Map<string, Array<(event: DomainEvent) => Promise<void>>> = new Map();
  
  subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>) {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
  }
  
  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];
    
    // Execute handlers in parallel
    await Promise.all(handlers.map(handler => handler(event)));
    
    // Optionally, persist event for event sourcing
    await this.persistEvent(event);
  }
  
  private async persistEvent(event: DomainEvent): Promise<void> {
    await prisma.domainEvent.create({
      data: {
        eventId: event.eventId,
        eventType: event.eventType,
        occurredAt: event.occurredAt,
        aggregateId: event.aggregateId,
        payload: JSON.stringify(event)
      }
    });
  }
}

// Domain events
export class AssessmentCompletedEvent implements DomainEvent {
  eventId = randomUUID();
  eventType = 'AssessmentCompleted';
  occurredAt = new Date();
  
  constructor(
    public aggregateId: string,
    public userId: string,
    public assessmentType: string,
    public score: number
  ) {}
}

// Event handlers
export class SendAssessmentNotificationHandler {
  async handle(event: AssessmentCompletedEvent): Promise<void> {
    // Send email notification
    await emailService.send({
      to: user.email,
      subject: 'Assessment Completed',
      // ...
    });
  }
}

export class UpdateWellnessScoreHandler {
  async handle(event: AssessmentCompletedEvent): Promise<void> {
    // Recalculate wellness score
    await wellnessScoreService.recalculate(event.userId);
  }
}

// Register handlers
eventBus.subscribe('AssessmentCompleted', (e) => 
  new SendAssessmentNotificationHandler().handle(e as AssessmentCompletedEvent)
);
eventBus.subscribe('AssessmentCompleted', (e) => 
  new UpdateWellnessScoreHandler().handle(e as AssessmentCompletedEvent)
);
```

#### C. CQRS Pattern for Complex Queries

```typescript
// backend/src/application/queries/GetUserDashboardQuery.ts
export interface GetUserDashboardQuery {
  userId: string;
}

export interface UserDashboardDTO {
  user: UserSummary;
  recentAssessments: AssessmentSummary[];
  wellnessScore: number;
  moodTrend: MoodDataPoint[];
  upcomingTasks: TaskSummary[];
  recommendations: ContentRecommendation[];
}

export class GetUserDashboardQueryHandler {
  constructor(
    private prisma: PrismaClient,
    private cache: CacheService
  ) {}
  
  async execute(query: GetUserDashboardQuery): Promise<UserDashboardDTO> {
    // Check cache first
    const cached = await this.cache.get<UserDashboardDTO>(
      `dashboard:${query.userId}`
    );
    if (cached) return cached;
    
    // Execute optimized query
    const [user, assessments, moodEntries, tasks, insights] = await Promise.all([
      this.getUserSummary(query.userId),
      this.getRecentAssessments(query.userId),
      this.getMoodTrend(query.userId),
      this.getUpcomingTasks(query.userId),
      this.getAssessmentInsights(query.userId)
    ]);
    
    const result: UserDashboardDTO = {
      user,
      recentAssessments: assessments,
      wellnessScore: insights?.wellnessScore || 0,
      moodTrend: moodEntries,
      upcomingTasks: tasks,
      recommendations: await this.getRecommendations(query.userId, insights)
    };
    
    // Cache for 5 minutes
    await this.cache.set(`dashboard:${query.userId}`, result, 300);
    
    return result;
  }
}
```

### 2. Frontend Architecture Improvements

#### A. Feature-Based Module Structure

```
frontend/src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── index.ts
│   ├── assessment/
│   ├── chat/
│   └── dashboard/
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── types/
├── core/
│   ├── api/
│   ├── auth/
│   ├── routing/
│   └── state/
└── App.tsx
```

#### B. State Management with Zustand

```typescript
// frontend/src/core/state/stores/userStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User) => void;
  clearUser: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,
      
      setUser: (user) => set({ user, error: null }),
      
      clearUser: () => set({ user: null }),
      
      updateProfile: async (updates) => {
        set({ isLoading: true, error: null });
        try {
          const updated = await api.updateUser(get().user!.id, updates);
          set({ user: updated, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      }
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user }) // Only persist user
    }
  )
);

// Usage in components
function Profile() {
  const { user, updateProfile, isLoading } = useUserStore();
  
  const handleSave = async (data: Partial<User>) => {
    await updateProfile(data);
  };
  
  return <ProfileForm user={user} onSave={handleSave} loading={isLoading} />;
}
```

#### C. Custom Hooks for Business Logic

```typescript
// frontend/src/features/assessment/hooks/useAssessmentFlow.ts
export function useAssessmentFlow(assessmentId: string) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [startTime] = useState(Date.now());
  
  const { data: assessment } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => assessmentApi.getById(assessmentId)
  });
  
  const submitMutation = useMutation({
    mutationFn: (data: AssessmentSubmission) => 
      assessmentApi.submit(data),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries(['assessments']);
      queryClient.invalidateQueries(['dashboard']);
    }
  });
  
  const handleAnswer = useCallback((questionId: string, value: number) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  }, []);
  
  const handleNext = useCallback(() => {
    if (currentQuestionIndex < (assessment?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, assessment]);
  
  const handleBack = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);
  
  const handleSubmit = useCallback(async () => {
    const timeSpent = Date.now() - startTime;
    await submitMutation.mutateAsync({
      assessmentId,
      responses,
      timeSpent
    });
  }, [assessmentId, responses, startTime]);
  
  return {
    assessment,
    currentQuestion: assessment?.questions[currentQuestionIndex],
    currentQuestionIndex,
    totalQuestions: assessment?.questions.length || 0,
    responses,
    isComplete: Object.keys(responses).length === assessment?.questions.length,
    isSubmitting: submitMutation.isLoading,
    handleAnswer,
    handleNext,
    handleBack,
    handleSubmit
  };
}

// Usage
function AssessmentFlow({ assessmentId }: Props) {
  const {
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    responses,
    isComplete,
    handleAnswer,
    handleNext,
    handleBack,
    handleSubmit
  } = useAssessmentFlow(assessmentId);
  
  return (
    <div>
      <Progress value={(currentQuestionIndex + 1) / totalQuestions * 100} />
      <Question
        question={currentQuestion}
        value={responses[currentQuestion.id]}
        onChange={handleAnswer}
      />
      {/* Navigation buttons */}
    </div>
  );
}
```

### 3. Testing Improvements

#### A. Unit Testing Setup

```typescript
// backend/tests/unit/services/UserService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from '../../../src/domain/user/UserService';
import { MockUserRepository } from '../../mocks/MockUserRepository';

describe('UserService', () => {
  let userService: UserService;
  let mockRepo: MockUserRepository;
  
  beforeEach(() => {
    mockRepo = new MockUserRepository();
    userService = new UserService(mockRepo);
  });
  
  describe('registerUser', () => {
    it('should create a new user with hashed password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };
      
      const result = await userService.registerUser(userData);
      
      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(result.password).not.toBe(userData.password); // Should be hashed
    });
    
    it('should throw error if email already exists', async () => {
      const userData = { email: 'existing@example.com', password: '123456', name: 'Test' };
      
      await userService.registerUser(userData);
      
      await expect(userService.registerUser(userData))
        .rejects
        .toThrow('User already exists');
    });
  });
});
```

#### B. Integration Testing

```typescript
// backend/tests/integration/api/auth.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../../src/server';
import { setupTestDb, teardownTestDb } from '../../helpers/testDb';

describe('Auth API', () => {
  beforeAll(async () => {
    await setupTestDb();
  });
  
  afterAll(async () => {
    await teardownTestDb();
  });
  
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User'
        })
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();
    });
    
    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test'
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('email');
    });
  });
});
```

#### C. E2E Testing with Playwright

```typescript
// frontend/tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should allow user to register and login', async ({ page }) => {
    // Navigate to landing page
    await page.goto('/');
    
    // Click on register
    await page.click('text=Get Started');
    
    // Fill registration form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="name"]', 'Test User');
    await page.click('button[type="submit"]');
    
    // Should redirect to onboarding
    await expect(page).toHaveURL('/onboarding');
    
    // Complete onboarding
    await page.click('text=Western Approach');
    await page.click('text=Continue');
    
    // Should reach dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
  
  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });
});
```

### 4. Code Quality Tools

#### A. ESLint Configuration

```javascript
// .eslintrc.cjs
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'complexity': ['warn', 10],
    'max-lines-per-function': ['warn', { max: 50, skipComments: true }]
  }
};
```

#### B. Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

#### C. Husky Pre-commit Hooks

```json
// package.json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
npm run typecheck
npm test
```

### Implementation Priority

**Phase 1 (Week 1-2):**
- ✅ Set up testing infrastructure
- ✅ Implement unit tests for critical paths
- ✅ Add ESLint and Prettier
- ✅ Set up pre-commit hooks

**Phase 2 (Week 3-4):**
- ✅ Refactor to DDD structure
- ✅ Implement repository pattern
- ✅ Add integration tests
- ✅ State management with Zustand

**Phase 3 (Month 2):**
- ✅ Event-driven architecture
- ✅ CQRS for complex queries
- ✅ E2E tests with Playwright
- ✅ Performance testing
