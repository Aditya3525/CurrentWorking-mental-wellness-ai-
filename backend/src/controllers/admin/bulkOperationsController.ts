import { Request, Response } from 'express';

import prisma from '../../config/database';
import { logActivity } from './activityLogController';

/**
 * Bulk publish/unpublish assessments
 * POST /api/admin/bulk/assessments/publish
 * Body: { assessmentIds: string[], published: boolean }
 */
export const bulkUpdateAssessmentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assessmentIds, published } = req.body;

    // Validate input
    if (!Array.isArray(assessmentIds) || assessmentIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'assessmentIds must be a non-empty array'
      });
      return;
    }

    if (typeof published !== 'boolean') {
      res.status(400).json({
        success: false,
        error: 'published must be a boolean'
      });
      return;
    }

    // Update assessments
    const result = await prisma.assessmentDefinition.updateMany({
      where: {
        id: { in: assessmentIds }
      },
      data: {
        isActive: published
      }
    });

    // Log activity
    const adminEmail = (req as any).admin?.email || 'unknown';
    await logActivity(
      adminEmail,
      published ? 'BULK_PUBLISH' : 'BULK_UNPUBLISH',
      'ASSESSMENT',
      undefined,
      undefined,
      { count: result.count, assessmentIds },
      req
    );

    res.json({
      success: true,
      data: {
        updatedCount: result.count,
        action: published ? 'published' : 'unpublished'
      },
      message: `Successfully ${published ? 'published' : 'unpublished'} ${result.count} assessment(s)`
    });
  } catch (error) {
    console.error('Error in bulkUpdateAssessmentStatus:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update assessments'
    });
  }
};

/**
 * Bulk delete assessments
 * DELETE /api/admin/bulk/assessments
 * Body: { assessmentIds: string[] }
 */
export const bulkDeleteAssessments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assessmentIds } = req.body;

    // Validate input
    if (!Array.isArray(assessmentIds) || assessmentIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'assessmentIds must be a non-empty array'
      });
      return;
    }

    // Delete assessments (questions and options will cascade delete)
    const result = await prisma.assessmentDefinition.deleteMany({
      where: {
        id: { in: assessmentIds }
      }
    });

    // Log activity
    const adminEmail = (req as any).admin?.email || 'unknown';
    await logActivity(
      adminEmail,
      'BULK_DELETE',
      'ASSESSMENT',
      undefined,
      undefined,
      { count: result.count, assessmentIds },
      req
    );

    res.json({
      success: true,
      data: {
        deletedCount: result.count
      },
      message: `Successfully deleted ${result.count} assessment(s)`
    });
  } catch (error) {
    console.error('Error in bulkDeleteAssessments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete assessments'
    });
  }
};

/**
 * Bulk publish/unpublish practices
 * POST /api/admin/bulk/practices/publish
 * Body: { practiceIds: string[], published: boolean }
 */
export const bulkUpdatePracticeStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { practiceIds, published } = req.body;

    // Validate input
    if (!Array.isArray(practiceIds) || practiceIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'practiceIds must be a non-empty array'
      });
      return;
    }

    if (typeof published !== 'boolean') {
      res.status(400).json({
        success: false,
        error: 'published must be a boolean'
      });
      return;
    }

    // Update practices
    const result = await prisma.practice.updateMany({
      where: {
        id: { in: practiceIds }
      },
      data: {
        isPublished: published
      }
    });

    // Log activity
    const adminEmail = (req as any).admin?.email || 'unknown';
    await logActivity(
      adminEmail,
      published ? 'BULK_PUBLISH' : 'BULK_UNPUBLISH',
      'PRACTICE',
      undefined,
      undefined,
      { count: result.count, practiceIds },
      req
    );

    res.json({
      success: true,
      data: {
        updatedCount: result.count,
        action: published ? 'published' : 'unpublished'
      },
      message: `Successfully ${published ? 'published' : 'unpublished'} ${result.count} practice(s)`
    });
  } catch (error) {
    console.error('Error in bulkUpdatePracticeStatus:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update practices'
    });
  }
};

/**
 * Bulk delete practices
 * DELETE /api/admin/bulk/practices
 * Body: { practiceIds: string[] }
 */
export const bulkDeletePractices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { practiceIds } = req.body;

    // Validate input
    if (!Array.isArray(practiceIds) || practiceIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'practiceIds must be a non-empty array'
      });
      return;
    }

    // Delete practices
    const result = await prisma.practice.deleteMany({
      where: {
        id: { in: practiceIds }
      }
    });

    // Log activity
    const adminEmail = (req as any).admin?.email || 'unknown';
    await logActivity(
      adminEmail,
      'BULK_DELETE',
      'PRACTICE',
      undefined,
      undefined,
      { count: result.count, practiceIds },
      req
    );

    res.json({
      success: true,
      data: {
        deletedCount: result.count
      },
      message: `Successfully deleted ${result.count} practice(s)`
    });
  } catch (error) {
    console.error('Error in bulkDeletePractices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete practices'
    });
  }
};

/**
 * Bulk publish/unpublish content
 * POST /api/admin/bulk/content/publish
 * Body: { contentIds: string[], published: boolean }
 */
export const bulkUpdateContentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentIds, published } = req.body;

    // Validate input
    if (!Array.isArray(contentIds) || contentIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'contentIds must be a non-empty array'
      });
      return;
    }

    if (typeof published !== 'boolean') {
      res.status(400).json({
        success: false,
        error: 'published must be a boolean'
      });
      return;
    }

    // Update content
    const result = await prisma.content.updateMany({
      where: {
        id: { in: contentIds }
      },
      data: {
        isPublished: published
      }
    });

    // Log activity
    const adminEmail = (req as any).admin?.email || 'unknown';
    await logActivity(
      adminEmail,
      published ? 'BULK_PUBLISH' : 'BULK_UNPUBLISH',
      'CONTENT',
      undefined,
      undefined,
      { count: result.count, contentIds },
      req
    );

    res.json({
      success: true,
      data: {
        updatedCount: result.count,
        action: published ? 'published' : 'unpublished'
      },
      message: `Successfully ${published ? 'published' : 'unpublished'} ${result.count} content item(s)`
    });
  } catch (error) {
    console.error('Error in bulkUpdateContentStatus:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update content'
    });
  }
};

/**
 * Bulk delete content
 * DELETE /api/admin/bulk/content
 * Body: { contentIds: string[] }
 */
export const bulkDeleteContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentIds } = req.body;

    // Validate input
    if (!Array.isArray(contentIds) || contentIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'contentIds must be a non-empty array'
      });
      return;
    }

    // Delete content
    const result = await prisma.content.deleteMany({
      where: {
        id: { in: contentIds }
      }
    });

    // Log activity
    const adminEmail = (req as any).admin?.email || 'unknown';
    await logActivity(
      adminEmail,
      'BULK_DELETE',
      'CONTENT',
      undefined,
      undefined,
      { count: result.count, contentIds },
      req
    );

    res.json({
      success: true,
      data: {
        deletedCount: result.count
      },
      message: `Successfully deleted ${result.count} content item(s)`
    });
  } catch (error) {
    console.error('Error in bulkDeleteContent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete content'
    });
  }
};

/**
 * Bulk update tags for assessments
 * POST /api/admin/bulk/assessments/tags
 * Body: { assessmentIds: string[], tags: string[], action: 'add' | 'remove' | 'replace' }
 */
export const bulkUpdateAssessmentTags = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assessmentIds, tags, action } = req.body;

    // Validate input
    if (!Array.isArray(assessmentIds) || assessmentIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'assessmentIds must be a non-empty array'
      });
      return;
    }

    if (!Array.isArray(tags) || tags.length === 0) {
      res.status(400).json({
        success: false,
        error: 'tags must be a non-empty array'
      });
      return;
    }

    if (!['add', 'remove', 'replace'].includes(action)) {
      res.status(400).json({
        success: false,
        error: 'action must be one of: add, remove, replace'
      });
      return;
    }

    let updatedCount = 0;

    if (action === 'replace') {
      // Replace tags entirely (tags are stored as comma-separated string)
      const result = await prisma.assessmentDefinition.updateMany({
        where: {
          id: { in: assessmentIds }
        },
        data: {
          tags: tags.join(',')
        }
      });
      updatedCount = result.count;
    } else {
      // For add/remove, we need to update individually
      const assessments = await prisma.assessmentDefinition.findMany({
        where: { id: { in: assessmentIds } },
        select: { id: true, tags: true }
      });

      for (const assessment of assessments) {
        const currentTags = assessment.tags ? assessment.tags.split(',').map(t => t.trim()) : [];
        let newTags: string[];

        if (action === 'add') {
          // Add new tags (avoid duplicates)
          newTags = [...new Set([...currentTags, ...tags])];
        } else {
          // Remove tags
          newTags = currentTags.filter((tag: string) => !tags.includes(tag));
        }

        await prisma.assessmentDefinition.update({
          where: { id: assessment.id },
          data: { tags: newTags.join(',') }
        });
        updatedCount++;
      }
    }

    res.json({
      success: true,
      data: {
        updatedCount,
        action,
        tags
      },
      message: `Successfully ${action === 'add' ? 'added tags to' : action === 'remove' ? 'removed tags from' : 'replaced tags for'} ${updatedCount} assessment(s)`
    });
  } catch (error) {
    console.error('Error in bulkUpdateAssessmentTags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update assessment tags'
    });
  }
};

/**
 * Bulk update approach for practices
 * POST /api/admin/bulk/practices/approach
 * Body: { practiceIds: string[], approach: string }
 */
export const bulkUpdatePracticeApproach = async (req: Request, res: Response): Promise<void> => {
  try {
    const { practiceIds, approach } = req.body;

    // Validate input
    if (!Array.isArray(practiceIds) || practiceIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'practiceIds must be a non-empty array'
      });
      return;
    }

    if (!approach || typeof approach !== 'string') {
      res.status(400).json({
        success: false,
        error: 'approach must be a non-empty string'
      });
      return;
    }

    // Validate approach value
    const validApproaches = ['cbt', 'dbt', 'act', 'mindfulness', 'psychodynamic', 'humanistic'];
    if (!validApproaches.includes(approach.toLowerCase())) {
      res.status(400).json({
        success: false,
        error: `approach must be one of: ${validApproaches.join(', ')}`
      });
      return;
    }

    // Update practices
    const result = await prisma.practice.updateMany({
      where: {
        id: { in: practiceIds }
      },
      data: {
        approach: approach.toLowerCase()
      }
    });

    res.json({
      success: true,
      data: {
        updatedCount: result.count,
        approach
      },
      message: `Successfully updated approach for ${result.count} practice(s)`
    });
  } catch (error) {
    console.error('Error in bulkUpdatePracticeApproach:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update practice approach'
    });
  }
};

/**
 * Bulk update content type
 * POST /api/admin/bulk/content/type
 * Body: { contentIds: string[], contentType: string }
 */
export const bulkUpdateContentType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentIds, contentType } = req.body;

    // Validate input
    if (!Array.isArray(contentIds) || contentIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'contentIds must be a non-empty array'
      });
      return;
    }

    if (!contentType || typeof contentType !== 'string') {
      res.status(400).json({
        success: false,
        error: 'contentType must be a non-empty string'
      });
      return;
    }

    // Validate content type
    const validTypes = ['article', 'video', 'audio', 'guided-meditation', 'worksheet'];
    if (!validTypes.includes(contentType.toLowerCase())) {
      res.status(400).json({
        success: false,
        error: `contentType must be one of: ${validTypes.join(', ')}`
      });
      return;
    }

    // Update content
    const result = await prisma.content.updateMany({
      where: {
        id: { in: contentIds }
      },
      data: {
        type: contentType.toLowerCase()
      }
    });

    res.json({
      success: true,
      data: {
        updatedCount: result.count,
        contentType
      },
      message: `Successfully updated type for ${result.count} content item(s)`
    });
  } catch (error) {
    console.error('Error in bulkUpdateContentType:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update content type'
    });
  }
};
