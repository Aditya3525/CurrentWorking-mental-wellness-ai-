# Admin Panel Migration Plan
## Mental Wellbeing AI App - Detailed Implementation Strategy

## Overview
This document outlines the step-by-step migration plan for implementing admin panel functionality for Content Library and Practice management in the Mental Wellbeing AI App.

## Pre-Migration Checklist

### Environment Setup
- [ ] Create dedicated admin development branch
- [ ] Set up staging environment
- [ ] Configure feature flags system
- [ ] Establish database backup procedures
- [ ] Set up monitoring and logging

### Team Preparation
- [ ] Admin panel design system review
- [ ] Security requirements validation
- [ ] Performance benchmarks establishment
- [ ] Testing strategy definition

## Phase 1: Admin Infrastructure Foundation (Week 1-2)

### 1.1 Database Preparation

#### Admin Role Enhancement
```sql
-- Migration: Add admin role support to existing User model
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
ALTER TABLE users ADD COLUMN admin_permissions TEXT; -- JSON permissions
UPDATE users SET role = 'admin' WHERE email IN ('admin@example.com');
```

#### Admin Activity Logging Setup
```typescript
// Enhance existing AdminActivity model usage
export const logAdminActivity = async (
  adminId: string,
  action: string,
  resource?: string,
  details?: any
) => {
  await prisma.adminActivity.create({
    data: {
      adminId,
      action,
      resource,
      details: JSON.stringify(details),
      timestamp: new Date()
    }
  });
};
```

### 1.2 Backend Authentication

#### Create admin authentication middleware
```typescript
// backend/src/middleware/adminAuth.ts
import { AuthRequest } from './auth';
import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const adminUser = await prisma.adminUser.findUnique({
      where: { email: req.user.email },
      include: { sessions: true }
    });

    if (!adminUser || !adminUser.isActive) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.admin = adminUser;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication error' });
  }
};
```

#### Admin routes structure
```typescript
// backend/src/routes/admin.ts
import express from 'express';
import { requireAdmin } from '../middleware/adminAuth';
import * as adminController from '../controllers/adminController';

const router = express.Router();

// Apply admin authentication to all routes
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Content management
router.get('/content', adminController.listAllContent);
router.post('/content', adminController.createContent);
router.put('/content/:id', adminController.updateContent);
router.delete('/content/:id', adminController.deleteContent);
router.patch('/content/:id/publish', adminController.togglePublish);

// Practice management (Phase 2)
router.get('/practices', adminController.listAllPractices);
router.post('/practices', adminController.createPractice);
router.put('/practices/:id', adminController.updatePractice);
router.delete('/practices/:id', adminController.deletePractice);

export default router;
```

### 1.3 Frontend Admin Layout

#### Create admin shell component
```typescript
// frontend/src/components/admin/AdminLayout.tsx
import React from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage: string;
}

export function AdminLayout({ children, currentPage }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="flex">
        <AdminSidebar currentPage={currentPage} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

#### Admin routing setup
```typescript
// frontend/src/components/admin/AdminApp.tsx
import React, { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { ContentManagement } from './ContentManagement';
import { PracticeManagement } from './PracticeManagement';

export function AdminApp() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'content':
        return <ContentManagement />;
      case 'practices':
        return <PracticeManagement />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <AdminLayout currentPage={currentPage}>
      {renderPage()}
    </AdminLayout>
  );
}
```

### 1.4 Testing & Validation

#### Test scenarios
- [ ] Admin authentication flow
- [ ] Role-based access control
- [ ] Session management
- [ ] Basic routing navigation
- [ ] Error handling

## Phase 2: Practice Model & Data Migration (Week 3-4)

### 2.1 Database Schema Implementation

#### Create Practice model migration
```sql
-- Migration: 001_create_practice_model.sql
CREATE TABLE practices (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL, -- 'meditation', 'breathing', 'yoga', 'sleep'
    duration INTEGER NOT NULL, -- minutes
    difficulty TEXT NOT NULL, -- 'Beginner', 'Intermediate', 'Advanced'
    instructor TEXT NOT NULL,
    audio_url TEXT,
    image_url TEXT,
    tags TEXT, -- JSON array
    has_download BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    created_by TEXT,
    last_edited_by TEXT,
    admin_notes TEXT,
    view_count INTEGER DEFAULT 0,
    rating REAL,
    rating_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE practice_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    practice_id TEXT NOT NULL,
    duration INTEGER NOT NULL,
    completed BOOLEAN DEFAULT false,
    rating INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (practice_id) REFERENCES practices (id) ON DELETE CASCADE
);

CREATE TABLE practice_ratings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    practice_id TEXT NOT NULL,
    rating INTEGER NOT NULL,
    review TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (practice_id) REFERENCES practices (id) ON DELETE CASCADE,
    UNIQUE(user_id, practice_id)
);
```

### 2.2 Data Migration Script

#### Extract and migrate hardcoded practices
```typescript
// scripts/migratePractices.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const hardcodedPractices = [
  {
    title: '5-Minute Calm Breathing',
    description: 'Quick and effective breathing technique to reduce anxiety and center yourself.',
    type: 'breathing',
    duration: 5,
    difficulty: 'Beginner',
    instructor: 'Dr. Sarah Chen',
    imageUrl: 'https://images.unsplash.com/photo-1687180948607-9ba1dd045e10...',
    hasDownload: true,
    tags: JSON.stringify(['anxiety', 'quick', 'workplace'])
  },
  // ... other practices
];

async function migratePractices() {
  console.log('Starting practice data migration...');
  
  for (const practice of hardcodedPractices) {
    await prisma.practice.create({
      data: {
        ...practice,
        isPublished: true,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }
  
  console.log(`Migrated ${hardcodedPractices.length} practices`);
}

migratePractices()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### 2.3 Backend API Implementation

#### Practice controller
```typescript
// backend/src/controllers/practiceController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const listPractices = async (req: Request, res: Response) => {
  try {
    const { type, difficulty, duration } = req.query;
    const where: any = { isPublished: true };
    
    if (type) where.type = type;
    if (difficulty) where.difficulty = difficulty;
    if (duration) {
      // Handle duration filtering logic
      const durationInt = parseInt(duration as string);
      where.duration = { lte: durationInt };
    }

    const practices = await prisma.practice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { sessions: true, ratings: true }
        }
      }
    });

    res.json({ success: true, data: practices });
  } catch (error) {
    console.error('List practices error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Admin-only controllers
export const createPractice = async (req: AuthRequest, res: Response) => {
  try {
    const practiceData = req.body;
    const practice = await prisma.practice.create({
      data: {
        ...practiceData,
        createdBy: req.admin?.id
      }
    });

    // Log admin activity
    await logAdminActivity(req.admin!.id, 'create_practice', practice.id);

    res.json({ success: true, data: practice });
  } catch (error) {
    console.error('Create practice error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
```

### 2.4 Frontend API Integration

#### Update Practices component to use API
```typescript
// frontend/src/hooks/usePractices.ts
import { useState, useEffect } from 'react';
import { practiceService } from '../services/practiceService';

export interface Practice {
  id: string;
  title: string;
  description: string;
  type: 'meditation' | 'breathing' | 'yoga' | 'sleep';
  duration: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  instructor: string;
  imageUrl?: string;
  audioUrl?: string;
  hasDownload: boolean;
  tags: string[];
  rating?: number;
  ratingCount: number;
}

export function usePractices() {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPractices = async () => {
      try {
        const data = await practiceService.list();
        setPractices(data);
      } catch (err) {
        setError('Failed to load practices');
      } finally {
        setLoading(false);
      }
    };

    fetchPractices();
  }, []);

  return { practices, loading, error, refetch: fetchPractices };
}
```

### 2.5 Testing & Validation

#### Test scenarios
- [ ] Practice data migration verification
- [ ] API CRUD operations
- [ ] Frontend-backend integration
- [ ] Data consistency validation
- [ ] Performance testing

## Phase 3: Content Management Enhancement (Week 5-6)

### 3.1 Enhanced Content Controller

#### Complete CRUD implementation
```typescript
// backend/src/controllers/adminContentController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';

const prisma = new PrismaClient();

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/content/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

export const createContent = async (req: AuthRequest, res: Response) => {
  try {
    const contentData = req.body;
    const content = await prisma.content.create({
      data: {
        ...contentData,
        createdBy: req.admin?.id,
        isPublished: false // Default to unpublished
      }
    });

    await logAdminActivity(req.admin!.id, 'create_content', content.id, contentData);

    res.json({ success: true, data: content });
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const updateContent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const content = await prisma.content.update({
      where: { id },
      data: {
        ...updateData,
        lastEditedBy: req.admin?.id,
        updatedAt: new Date()
      }
    });

    await logAdminActivity(req.admin!.id, 'update_content', content.id, updateData);

    res.json({ success: true, data: content });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const deleteContent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.content.delete({ where: { id } });
    await logAdminActivity(req.admin!.id, 'delete_content', id);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const uploadContentFile = upload.single('file');
```

### 3.2 Admin Content Management UI

#### Content management dashboard
```typescript
// frontend/src/components/admin/ContentManagement.tsx
import React, { useState } from 'react';
import { useContent } from '../../hooks/useContent';
import { ContentTable } from './ContentTable';
import { ContentForm } from './ContentForm';
import { Button } from '../ui/button';
import { Plus, Upload, Filter } from 'lucide-react';

export function ContentManagement() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const { content, loading, refetch } = useContent({ includeUnpublished: true });

  const handleCreateContent = () => {
    setEditingContent(null);
    setShowCreateForm(true);
  };

  const handleEditContent = (item) => {
    setEditingContent(item);
    setShowCreateForm(true);
  };

  const handleFormClose = () => {
    setShowCreateForm(false);
    setEditingContent(null);
    refetch();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Content Management</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
          <Button onClick={handleCreateContent}>
            <Plus className="h-4 w-4 mr-2" />
            Create Content
          </Button>
        </div>
      </div>

      <ContentTable 
        content={content}
        onEdit={handleEditContent}
        onRefresh={refetch}
      />

      {showCreateForm && (
        <ContentForm
          content={editingContent}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
```

#### Content form component
```typescript
// frontend/src/components/admin/ContentForm.tsx
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select } from '../ui/select';
import { contentService } from '../../services/contentService';

interface ContentFormProps {
  content?: any;
  onClose: () => void;
}

export function ContentForm({ content, onClose }: ContentFormProps) {
  const [formData, setFormData] = useState({
    title: content?.title || '',
    description: content?.description || '',
    type: content?.type || 'article',
    category: content?.category || 'Mindfulness',
    approach: content?.approach || 'all',
    content: content?.content || '',
    difficulty: content?.difficulty || 'Beginner',
    tags: content?.tags || '',
    isPublished: content?.isPublished || false
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (content?.id) {
        await contentService.update(content.id, formData);
      } else {
        await contentService.create(formData);
      }
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {content ? 'Edit Content' : 'Create Content'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="article">Article</option>
                <option value="playlist">Playlist</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="Mindfulness">Mindfulness</option>
                <option value="Anxiety">Anxiety</option>
                <option value="Stress Management">Stress Management</option>
                <option value="Relaxation">Relaxation</option>
                <option value="Emotional Intelligence">Emotional Intelligence</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Content</label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              rows={6}
              placeholder="Content body, URL, or JSON data..."
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublished"
              checked={formData.isPublished}
              onChange={(e) => setFormData({...formData, isPublished: e.target.checked})}
              className="mr-2"
            />
            <label htmlFor="isPublished" className="text-sm font-medium">
              Publish immediately
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (content ? 'Update' : 'Create')}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### 3.3 Testing & Validation

#### Test scenarios
- [ ] Content CRUD operations
- [ ] File upload functionality
- [ ] Form validation
- [ ] Publishing workflow
- [ ] Admin activity logging

## Phase 4: Advanced Features (Week 7-8)

### 4.1 Bulk Operations

#### Bulk content management
```typescript
// backend/src/controllers/adminBulkController.ts
export const bulkUpdateContent = async (req: AuthRequest, res: Response) => {
  try {
    const { ids, updates } = req.body;
    
    const results = await Promise.all(
      ids.map(async (id: string) => {
        return await prisma.content.update({
          where: { id },
          data: {
            ...updates,
            lastEditedBy: req.admin?.id,
            updatedAt: new Date()
          }
        });
      })
    );

    await logAdminActivity(
      req.admin!.id, 
      'bulk_update_content', 
      `${ids.length} items`, 
      { ids, updates }
    );

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
```

### 4.2 Analytics Dashboard

#### Admin dashboard with metrics
```typescript
// frontend/src/components/admin/AdminDashboard.tsx
import React from 'react';
import { useAdminMetrics } from '../../hooks/useAdminMetrics';
import { MetricsCard } from './MetricsCard';
import { ContentChart } from './ContentChart';
import { RecentActivity } from './RecentActivity';

export function AdminDashboard() {
  const { metrics, loading } = useAdminMetrics();

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricsCard
          title="Total Content"
          value={metrics.totalContent}
          change={metrics.contentChange}
        />
        <MetricsCard
          title="Published Content"
          value={metrics.publishedContent}
          change={metrics.publishedChange}
        />
        <MetricsCard
          title="Total Practices"
          value={metrics.totalPractices}
          change={metrics.practicesChange}
        />
        <MetricsCard
          title="Active Users"
          value={metrics.activeUsers}
          change={metrics.usersChange}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContentChart data={metrics.contentByCategory} />
        <RecentActivity activities={metrics.recentActivities} />
      </div>
    </div>
  );
}
```

## Post-Migration Tasks

### Performance Optimization
- [ ] Database query optimization
- [ ] API response caching
- [ ] Image optimization pipeline
- [ ] CDN configuration

### Security Hardening
- [ ] Input validation enhancement
- [ ] Rate limiting implementation
- [ ] Admin session security
- [ ] Audit log retention policies

### Monitoring & Maintenance
- [ ] Performance monitoring setup
- [ ] Error tracking configuration
- [ ] Admin usage analytics
- [ ] Backup verification procedures

## Rollback Procedures

### Emergency Rollback
1. **Feature Flag Disable**: Immediately disable admin features
2. **Database Rollback**: Restore from pre-migration backup
3. **Code Rollback**: Revert to previous stable version
4. **Cache Clear**: Clear all cached admin data

### Partial Rollback
1. **Feature-specific disable**: Use feature flags to disable specific features
2. **Data consistency check**: Verify data integrity
3. **User notification**: Inform admins of temporary limitations

## Success Criteria

### Technical Metrics
- [ ] All admin CRUD operations functional
- [ ] <2 second page load times
- [ ] 99.9% API uptime
- [ ] Zero data loss during migration

### User Experience Metrics
- [ ] Admin task completion time reduced by 50%
- [ ] Content creation workflow streamlined
- [ ] Error rates <1%
- [ ] Admin satisfaction score >4.5/5

### Business Metrics
- [ ] Content management efficiency improved
- [ ] Time to publish new content reduced
- [ ] Content quality metrics improved
- [ ] Reduced manual administrative overhead

This migration plan provides a comprehensive roadmap for implementing admin panel functionality while minimizing risks and ensuring system reliability.