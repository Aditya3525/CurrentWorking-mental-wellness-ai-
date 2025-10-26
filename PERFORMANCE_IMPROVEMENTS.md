# ⚡ Performance Improvements Guide

## Critical Performance Enhancements

### 1. Database Optimization

#### A. Add Missing Indexes

**Current Issue**: Slow queries on frequently accessed fields

```prisma
// backend/prisma/schema.prisma - Add these indexes

model User {
  // ... existing fields
  
  @@index([email])
  @@index([googleId])
  @@index([isOnboarded])
  @@index([createdAt])
}

model ChatMessage {
  // ... existing fields
  
  @@index([userId, createdAt])
  @@index([type])
  @@index([createdAt])
}

model AssessmentResult {
  // ... existing fields
  
  @@index([userId, assessmentType])
  @@index([userId, completedAt])
  @@index([sessionId])
  @@index([completedAt])
}

model MoodEntry {
  // ... existing fields
  
  @@index([userId, createdAt])
  @@index([mood])
}

model UserPlanModule {
  // ... existing fields
  
  @@index([userId, completed])
  @@index([scheduledFor])
}

model ConversationMemory {
  // ... existing fields
  
  @@index([updatedAt])
}

model ProgressTracking {
  // ... existing fields
  
  @@index([userId, metric, date])
  @@index([date])
}
```

#### B. Implement Database Connection Pooling

```typescript
// backend/src/config/database.ts
import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Connection pool configuration for production
if (process.env.DATABASE_URL?.includes('postgresql')) {
  // Add to DATABASE_URL: ?connection_limit=10&pool_timeout=20
}
```

#### C. Implement Query Optimization

```typescript
// backend/src/services/optimizedQueries.ts

// BAD: N+1 query problem
async function getUsersWithAssessments() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    user.assessments = await prisma.assessmentResult.findMany({
      where: { userId: user.id }
    });
  }
  return users;
}

// GOOD: Single query with includes
async function getUsersWithAssessmentsOptimized() {
  return await prisma.user.findMany({
    include: {
      assessments: {
        orderBy: { completedAt: 'desc' },
        take: 10
      }
    }
  });
}

// Implement pagination for large datasets
async function getPaginatedResults(page: number = 1, pageSize: number = 20) {
  const skip = (page - 1) * pageSize;
  
  const [data, total] = await Promise.all([
    prisma.assessmentResult.findMany({
      skip,
      take: pageSize,
      orderBy: { completedAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    }),
    prisma.assessmentResult.count()
  ]);
  
  return {
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  };
}
```

#### D. Implement Caching Layer

```typescript
// backend/src/services/cacheService.ts
import Redis from 'ioredis';

export class CacheService {
  private redis: Redis;
  private readonly DEFAULT_TTL = 300; // 5 minutes
  
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000)
    });
  }
  
  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
  
  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
  
  async memoize<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) return cached;
    
    const fresh = await fetcher();
    await this.set(key, fresh, ttl);
    return fresh;
  }
}

export const cache = new CacheService();

// Usage example
export async function getCachedUserProfile(userId: string) {
  return await cache.memoize(
    `user:profile:${userId}`,
    async () => {
      return await prisma.user.findUnique({
        where: { id: userId },
        include: {
          assessments: { take: 5, orderBy: { completedAt: 'desc' } },
          moodEntries: { take: 10, orderBy: { createdAt: 'desc' } }
        }
      });
    },
    600 // 10 minutes
  );
}
```

### 2. Frontend Performance

#### A. Code Splitting & Lazy Loading

```typescript
// frontend/src/App.tsx - Implement lazy loading
import React, { lazy, Suspense } from 'react';

// Lazy load heavy components
const Dashboard = lazy(() => import('./components/features/dashboard/Dashboard'));
const Chatbot = lazy(() => import('./components/features/chat/Chatbot'));
const AssessmentFlow = lazy(() => import('./components/features/assessment/AssessmentFlow'));
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));
const PersonalizedPlan = lazy(() => import('./components/features/plans/PersonalizedPlan'));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Wrap routes with Suspense
function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chatbot" element={<Chatbot />} />
        {/* ... other routes */}
      </Routes>
    </Suspense>
  );
}
```

#### B. React Query for Data Fetching

```typescript
// frontend/src/hooks/useAssessments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assessmentsApi } from '../services/api';

export function useAssessments() {
  return useQuery({
    queryKey: ['assessments'],
    queryFn: () => assessmentsApi.getAssessmentTemplates(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useAssessmentHistory(userId: string) {
  return useQuery({
    queryKey: ['assessments', 'history', userId],
    queryFn: () => assessmentsApi.getHistory(),
    enabled: !!userId,
  });
}

export function useSubmitAssessment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => assessmentsApi.submitAssessment(data),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
  });
}

// Usage in component
function AssessmentList() {
  const { data, isLoading, error } = useAssessments();
  const submitMutation = useSubmitAssessment();
  
  if (isLoading) return <Spinner />;
  if (error) return <Error />;
  
  return <div>{/* render data */}</div>;
}
```

#### C. Virtual Scrolling for Long Lists

```typescript
// frontend/src/components/common/VirtualList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

export function VirtualChatHistory({ messages }: { messages: Message[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated row height
    overscan: 5,
  });
  
  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <MessageItem message={messages[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### D. Image Optimization

```typescript
// frontend/src/components/common/OptimizedImage.tsx
import { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  lowQualitySrc?: string;
}

export function OptimizedImage({ src, alt, className, lowQualitySrc }: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(lowQualitySrc || src);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };
  }, [src]);
  
  return (
    <img
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoading ? 'blur-sm' : 'blur-0'} transition-all duration-300`}
      loading="lazy"
    />
  );
}

// Use WebP with fallback
export function ResponsiveImage({ src, alt }: { src: string; alt: string }) {
  return (
    <picture>
      <source srcSet={`${src}.webp`} type="image/webp" />
      <source srcSet={`${src}.jpg`} type="image/jpeg" />
      <img src={`${src}.jpg`} alt={alt} loading="lazy" />
    </picture>
  );
}
```

### 3. API Performance

#### A. Response Compression

```typescript
// backend/src/server.ts - Already has compression, but optimize it
import compression from 'compression';

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Balance between speed and compression ratio
  threshold: 1024, // Only compress responses > 1KB
}));
```

#### B. Implement Response Caching

```typescript
// backend/src/middleware/cacheMiddleware.ts
import { cache } from '../services/cacheService';

export function cacheResponse(duration: number = 300) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `response:${req.method}:${req.originalUrl}`;
    
    const cached = await cache.get(key);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }
    
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method
    res.json = function(body: any) {
      cache.set(key, body, duration).catch(console.error);
      res.set('X-Cache', 'MISS');
      return originalJson(body);
    };
    
    next();
  };
}

// Usage
app.get('/api/content', cacheResponse(600), listContent);
app.get('/api/practices', cacheResponse(600), listPractices);
```

#### C. Batch API Requests

```typescript
// frontend/src/services/batchApi.ts
export class BatchApiClient {
  private queue: Array<{
    id: string;
    endpoint: string;
    resolve: (data: any) => void;
    reject: (error: any) => void;
  }> = [];
  
  private timeout: NodeJS.Timeout | null = null;
  
  async request(endpoint: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        id: Math.random().toString(36),
        endpoint,
        resolve,
        reject
      });
      
      this.scheduleFlush();
    });
  }
  
  private scheduleFlush() {
    if (this.timeout) return;
    
    this.timeout = setTimeout(() => {
      this.flush();
    }, 50); // 50ms debounce
  }
  
  private async flush() {
    if (this.queue.length === 0) return;
    
    const batch = [...this.queue];
    this.queue = [];
    this.timeout = null;
    
    try {
      const response = await fetch('/api/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: batch.map(req => ({
            id: req.id,
            endpoint: req.endpoint
          }))
        })
      });
      
      const results = await response.json();
      
      batch.forEach(req => {
        const result = results.find((r: any) => r.id === req.id);
        if (result.success) {
          req.resolve(result.data);
        } else {
          req.reject(new Error(result.error));
        }
      });
    } catch (error) {
      batch.forEach(req => req.reject(error));
    }
  }
}
```

### 4. Asset Optimization

#### A. Implement CDN for Static Assets

```typescript
// frontend/vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', '@radix-ui/react-dialog'],
          'chart-vendor': ['recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  // Use CDN in production
  base: process.env.VITE_CDN_URL || '/',
});
```

#### B. Service Worker for Offline Support

```typescript
// frontend/public/service-worker.js
const CACHE_NAME = 'mental-wellness-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/main.css',
  '/assets/main.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        });
      })
  );
});
```

### 5. Real-time Performance Monitoring

```typescript
// backend/src/middleware/performanceMonitoring.ts
import { performance } from 'perf_hooks';

export const performanceMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const startTime = performance.now();
  
  res.on('finish', () => {
    const duration = performance.now() - startTime;
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    
    // Log slow requests
    if (duration > 1000) {
      logger.warn({
        endpoint,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode
      }, 'Slow request detected');
    }
    
    // Send to monitoring service (e.g., DataDog, New Relic)
    if (process.env.NODE_ENV === 'production') {
      metrics.timing('api.response_time', duration, {
        endpoint,
        status: res.statusCode.toString()
      });
    }
  });
  
  next();
};
```

### 6. Database Query Performance Monitoring

```typescript
// backend/src/middleware/queryMonitoring.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
  ],
});

prisma.$on('query', (e) => {
  if (e.duration > 1000) { // Queries taking > 1 second
    logger.warn({
      query: e.query,
      duration: `${e.duration}ms`,
      params: e.params
    }, 'Slow database query');
  }
});
```

### Implementation Checklist

**Week 1:**
- ✅ Add database indexes
- ✅ Implement connection pooling
- ✅ Add response compression
- ✅ Implement basic caching

**Week 2:**
- ✅ Implement React Query
- ✅ Add code splitting
- ✅ Optimize images
- ✅ Virtual scrolling for lists

**Week 3:**
- ✅ Redis caching layer
- ✅ API batch requests
- ✅ CDN integration
- ✅ Performance monitoring

**Week 4:**
- ✅ Service worker
- ✅ Query optimization
- ✅ Load testing
- ✅ Performance audit

### Performance Targets

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| First Contentful Paint | ~2.5s | <1.5s | 🔴 |
| Time to Interactive | ~4s | <2.5s | 🔴 |
| API Response Time (p95) | ~500ms | <200ms | 🟡 |
| Database Query Time | ~100ms | <50ms | 🟡 |
| Bundle Size | ~1.2MB | <500KB | 🔴 |
| Lighthouse Score | 65 | >90 | 🔴 |
