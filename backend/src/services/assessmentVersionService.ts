import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AssessmentVersionData {
  assessmentId: string;
  userId: string;
  version: number;
  assessmentType: string;
  score: number;
  responses: any;
  aiInsights?: string;
  changes?: any;
  reason?: string;
  modifiedBy?: string;
}

export class AssessmentVersionService {
  /**
   * Create a new version of an assessment
   */
  static async createVersion(data: AssessmentVersionData): Promise<any> {
    try {
      // For now, we'll work with basic assessment versioning
      const version = await prisma.assessment.create({
        data: {
          userId: data.userId,
          assessmentType: data.assessmentType,
          score: data.score,
          responses: JSON.stringify(data.responses),
          aiInsights: data.aiInsights,
          // Store version info in a metadata field for now
          // metadata: JSON.stringify({
          //   version: data.version,
          //   parentId: data.assessmentId,
          //   changes: data.changes,
          //   reason: data.reason,
          //   modifiedBy: data.modifiedBy
          // })
        },
      });

      return version;
    } catch (error) {
      console.error('Failed to create assessment version:', error);
      throw error;
    }
  }

  /**
   * Get version history for an assessment
   */
  static async getVersionHistory(assessmentId: string): Promise<any[]> {
    try {
      // For now, get all assessments of the same type for the user
      const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId },
        include: { user: true }
      });

      if (!assessment) {
        return [];
      }

      const versions = await prisma.assessment.findMany({
        where: {
          userId: assessment.userId,
          assessmentType: assessment.assessmentType,
        },
        orderBy: { completedAt: 'desc' },
      });

      return versions.map((version, index) => ({
        ...version,
        version: versions.length - index,
        responses: version.responses ? JSON.parse(version.responses) : {},
      }));
    } catch (error) {
      console.error('Failed to get version history:', error);
      return [];
    }
  }

  /**
   * Compare two assessment versions
   */
  static async compareVersions(assessmentId1: string, assessmentId2: string): Promise<any> {
    try {
      const [assessment1, assessment2] = await Promise.all([
        prisma.assessment.findUnique({ where: { id: assessmentId1 } }),
        prisma.assessment.findUnique({ where: { id: assessmentId2 } }),
      ]);

      if (!assessment1 || !assessment2) {
        throw new Error('One or both assessments not found');
      }

      const responses1 = assessment1.responses ? JSON.parse(assessment1.responses) : {};
      const responses2 = assessment2.responses ? JSON.parse(assessment2.responses) : {};

      const comparison = {
        scoreChange: assessment2.score - assessment1.score,
        timeDifference: new Date(assessment2.completedAt).getTime() - new Date(assessment1.completedAt).getTime(),
        responseChanges: this.calculateResponseChanges(responses1, responses2),
        insights: {
          improvement: assessment2.score > assessment1.score,
          significantChange: Math.abs(assessment2.score - assessment1.score) > 10,
          timeSpan: Math.floor((new Date(assessment2.completedAt).getTime() - new Date(assessment1.completedAt).getTime()) / (1000 * 60 * 60 * 24)) // days
        }
      };

      return comparison;
    } catch (error) {
      console.error('Failed to compare versions:', error);
      throw error;
    }
  }

  /**
   * Calculate changes between two response sets
   */
  private static calculateResponseChanges(responses1: any, responses2: any): any {
    const changes = {
      added: {} as any,
      removed: {} as any,
      modified: {} as any
    };

    // Find added responses
    for (const key in responses2) {
      if (!(key in responses1)) {
        changes.added[key] = responses2[key];
      }
    }

    // Find removed responses
    for (const key in responses1) {
      if (!(key in responses2)) {
        changes.removed[key] = responses1[key];
      }
    }

    // Find modified responses
    for (const key in responses1) {
      if (key in responses2 && responses1[key] !== responses2[key]) {
        changes.modified[key] = {
          from: responses1[key],
          to: responses2[key]
        };
      }
    }

    return changes;
  }

  /**
   * Get latest version of each assessment type for a user
   */
  static async getLatestVersions(userId: string): Promise<any[]> {
    try {
      const assessments = await prisma.assessment.findMany({
        where: { userId },
        orderBy: { completedAt: 'desc' },
      });

      // Group by assessment type and get the latest
      const latestVersions = new Map();
      assessments.forEach(assessment => {
        if (!latestVersions.has(assessment.assessmentType)) {
          latestVersions.set(assessment.assessmentType, {
            ...assessment,
            responses: assessment.responses ? JSON.parse(assessment.responses) : {}
          });
        }
      });

      return Array.from(latestVersions.values());
    } catch (error) {
      console.error('Failed to get latest versions:', error);
      return [];
    }
  }

  /**
   * Calculate assessment progression over time
   */
  static async getProgressionAnalysis(userId: string, assessmentType: string): Promise<any> {
    try {
      const assessments = await prisma.assessment.findMany({
        where: {
          userId,
          assessmentType,
        },
        orderBy: { completedAt: 'asc' },
      });

      if (assessments.length < 2) {
        return {
          message: 'Need at least 2 assessments for progression analysis',
          assessmentCount: assessments.length
        };
      }

      const scores = assessments.map(a => a.score);
      const dates = assessments.map(a => new Date(a.completedAt));
      
      const analysis = {
        totalAssessments: assessments.length,
        firstScore: scores[0],
        latestScore: scores[scores.length - 1],
        averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
        improvement: scores[scores.length - 1] - scores[0],
        trend: this.calculateTrend(scores),
        timeSpan: Math.floor((dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24)), // days
        volatility: this.calculateVolatility(scores),
        milestones: this.identifyMilestones(assessments)
      };

      return analysis;
    } catch (error) {
      console.error('Failed to get progression analysis:', error);
      throw error;
    }
  }

  /**
   * Calculate trend direction
   */
  private static calculateTrend(scores: number[]): string {
    if (scores.length < 2) return 'insufficient_data';
    
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    
    if (Math.abs(difference) < 2) return 'stable';
    return difference > 0 ? 'improving' : 'declining';
  }

  /**
   * Calculate score volatility
   */
  private static calculateVolatility(scores: number[]): number {
    if (scores.length < 2) return 0;
    
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Identify significant milestones in assessment history
   */
  private static identifyMilestones(assessments: any[]): any[] {
    const milestones = [];
    
    // Find significant improvements (>15 point increase)
    for (let i = 1; i < assessments.length; i++) {
      const improvement = assessments[i].score - assessments[i - 1].score;
      if (improvement >= 15) {
        milestones.push({
          type: 'significant_improvement',
          date: assessments[i].completedAt,
          improvement: improvement,
          fromScore: assessments[i - 1].score,
          toScore: assessments[i].score
        });
      } else if (improvement <= -15) {
        milestones.push({
          type: 'significant_decline',
          date: assessments[i].completedAt,
          decline: Math.abs(improvement),
          fromScore: assessments[i - 1].score,
          toScore: assessments[i].score
        });
      }
    }

    // Find personal bests
    let bestScore = Math.max(...assessments.map(a => a.score));
    const bestAssessment = assessments.find(a => a.score === bestScore);
    if (bestAssessment) {
      milestones.push({
        type: 'personal_best',
        date: bestAssessment.completedAt,
        score: bestScore
      });
    }

    return milestones;
  }
}
