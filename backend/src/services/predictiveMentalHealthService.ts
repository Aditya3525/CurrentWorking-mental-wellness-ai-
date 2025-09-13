import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PredictiveAnalysis {
  userId: string;
  currentScore: number;
  predictedScore: number;
  timeframe: number; // days
  confidence: number; // 0-1
  riskFactors: string[];
  protectiveFactors: string[];
  recommendations: string[];
}

export interface MentalHealthTrend {
  metric: string;
  trend: 'improving' | 'stable' | 'declining';
  confidence: number;
  dataPoints: number;
  timeSpan: number; // days
}

export class PredictiveMentalHealthService {
  /**
   * Analyze user's mental health trajectory and predict future state
   */
  static async generatePredictiveAnalysis(userId: string, assessmentType: string): Promise<PredictiveAnalysis> {
    try {
      // Get user's assessment history
      const assessments = await prisma.assessment.findMany({
        where: {
          userId,
          assessmentType,
        },
        orderBy: { completedAt: 'asc' },
        take: 10 // Last 10 assessments
      });

      if (assessments.length < 3) {
        throw new Error('Insufficient data for prediction (need at least 3 assessments)');
      }

      // Get user context
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          moodEntries: {
            orderBy: { createdAt: 'desc' },
            take: 30
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const currentScore = assessments[assessments.length - 1].score;
      const scores = assessments.map(a => a.score);
      const dates = assessments.map(a => new Date(a.completedAt));

      // Calculate trend using linear regression
      const trend = this.calculateLinearTrend(scores, dates);
      
      // Predict score in 30 days
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const predictedScore = Math.max(0, Math.min(100, 
        currentScore + (trend.slope * thirtyDaysMs / (24 * 60 * 60 * 1000))
      ));

      // Calculate confidence based on data consistency
      const confidence = this.calculatePredictionConfidence(scores, trend);

      // Identify risk and protective factors
      const riskFactors = this.identifyRiskFactors(assessments, user.moodEntries);
      const protectiveFactors = this.identifyProtectiveFactors(assessments, user);

      // Generate personalized recommendations
      const recommendations = this.generateRecommendations(
        currentScore,
        predictedScore,
        assessmentType,
        riskFactors,
        user.approach || 'hybrid'
      );

      return {
        userId,
        currentScore,
        predictedScore: Math.round(predictedScore * 10) / 10,
        timeframe: 30,
        confidence: Math.round(confidence * 100) / 100,
        riskFactors,
        protectiveFactors,
        recommendations
      };
    } catch (error) {
      console.error('Failed to generate predictive analysis:', error);
      throw error;
    }
  }

  /**
   * Calculate linear trend from score data
   */
  private static calculateLinearTrend(scores: number[], dates: Date[]): { slope: number; intercept: number; r2: number } {
    const n = scores.length;
    const x = dates.map(d => d.getTime());
    const y = scores;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const meanY = sumY / n;
    const ssRes = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);
    const r2 = 1 - (ssRes / ssTot);

    return { slope, intercept, r2: Math.max(0, r2) };
  }

  /**
   * Calculate confidence in prediction based on data quality
   */
  private static calculatePredictionConfidence(scores: number[], trend: { r2: number }): number {
    let confidence = 0.5; // Base confidence

    // R-squared contribution (how well trend fits data)
    confidence += trend.r2 * 0.3;

    // Data point count contribution
    const dataPointBonus = Math.min(scores.length / 10, 1) * 0.1;
    confidence += dataPointBonus;

    // Score stability contribution (less volatility = higher confidence)
    const volatility = this.calculateVolatility(scores);
    const stabilityBonus = Math.max(0, (20 - volatility) / 20) * 0.1;
    confidence += stabilityBonus;

    return Math.min(0.95, Math.max(0.1, confidence));
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
   * Identify risk factors from user data
   */
  private static identifyRiskFactors(assessments: any[], moodEntries: any[]): string[] {
    const riskFactors = [];

    // Recent assessment score trends
    if (assessments.length >= 3) {
      const recentScores = assessments.slice(-3).map(a => a.score);
      const isIncreasing = recentScores[2] > recentScores[0] + 10;
      if (isIncreasing) {
        riskFactors.push('worsening_assessment_scores');
      }
    }

    // Frequent negative moods
    const recentMoods = moodEntries.slice(0, 14); // Last 2 weeks
    const negativeMoods = recentMoods.filter(m => 
      ['Struggling', 'Anxious'].includes(m.mood)
    );
    
    if (negativeMoods.length > recentMoods.length * 0.5) {
      riskFactors.push('frequent_negative_moods');
    }

    // High variability in scores
    const allScores = assessments.map(a => a.score);
    const volatility = this.calculateVolatility(allScores);
    if (volatility > 15) {
      riskFactors.push('high_score_variability');
    }

    // Recent crisis patterns
    const hasRecentHighScores = assessments
      .slice(-3)
      .some(a => a.score > 70);
    
    if (hasRecentHighScores) {
      riskFactors.push('elevated_symptom_levels');
    }

    return riskFactors;
  }

  /**
   * Identify protective factors
   */
  private static identifyProtectiveFactors(assessments: any[], user: any): string[] {
    const protectiveFactors = [];

    // Consistent assessment taking
    if (assessments.length >= 5) {
      protectiveFactors.push('regular_self_monitoring');
    }

    // Improvement trend
    if (assessments.length >= 3) {
      const firstScore = assessments[0].score;
      const lastScore = assessments[assessments.length - 1].score;
      if (lastScore < firstScore - 5) {
        protectiveFactors.push('overall_improvement_trend');
      }
    }

    // Profile completeness
    if (user.isOnboarded && user.approach && user.birthday) {
      protectiveFactors.push('engaged_with_treatment');
    }

    // Low score volatility
    const allScores = assessments.map(a => a.score);
    const volatility = this.calculateVolatility(allScores);
    if (volatility < 10) {
      protectiveFactors.push('emotional_stability');
    }

    return protectiveFactors;
  }

  /**
   * Generate personalized recommendations
   */
  private static generateRecommendations(
    currentScore: number,
    predictedScore: number,
    assessmentType: string,
    riskFactors: string[],
    approach: string
  ): string[] {
    const recommendations = [];

    // Score-based recommendations
    if (predictedScore > currentScore + 10) {
      recommendations.push('Consider seeking professional support as indicators suggest potential worsening');
      recommendations.push('Increase frequency of self-monitoring and mood tracking');
    } else if (predictedScore < currentScore - 5) {
      recommendations.push('Continue with current strategies as they appear to be working well');
      recommendations.push('Consider gradually reducing intervention intensity while maintaining gains');
    }

    // Assessment-type specific recommendations
    if (assessmentType === 'anxiety') {
      if (approach === 'western') {
        recommendations.push('Practice cognitive behavioral techniques for anxiety management');
        recommendations.push('Consider structured exposure therapy for specific anxiety triggers');
      } else if (approach === 'eastern') {
        recommendations.push('Increase mindfulness meditation and breathing exercises');
        recommendations.push('Explore anxiety-reducing yoga practices and body awareness');
      } else {
        recommendations.push('Combine cognitive strategies with mindfulness practices');
      }
    } else if (assessmentType === 'stress') {
      recommendations.push('Implement stress reduction techniques in daily routine');
      recommendations.push('Focus on work-life balance and boundary setting');
    }

    // Risk factor based recommendations
    if (riskFactors.includes('frequent_negative_moods')) {
      recommendations.push('Consider mood-boosting activities and social connections');
    }
    
    if (riskFactors.includes('high_score_variability')) {
      recommendations.push('Focus on building emotional regulation skills and stability');
    }

    // General recommendations
    recommendations.push('Continue regular self-assessment to track progress');
    recommendations.push('Maintain healthy lifestyle habits: sleep, exercise, nutrition');

    return recommendations;
  }

  /**
   * Analyze overall mental health trends across all metrics
   */
  static async analyzeMentalHealthTrends(userId: string): Promise<MentalHealthTrend[]> {
    try {
      const trends: MentalHealthTrend[] = [];

      // Get all assessment types for user
      const assessmentTypes = await prisma.assessment.findMany({
        where: { userId },
        select: { assessmentType: true },
        distinct: ['assessmentType']
      });

      for (const { assessmentType } of assessmentTypes) {
        const assessments = await prisma.assessment.findMany({
          where: { userId, assessmentType },
          orderBy: { completedAt: 'asc' }
        });

        if (assessments.length >= 3) {
          const scores = assessments.map(a => a.score);
          const dates = assessments.map(a => new Date(a.completedAt));
          const trendData = this.calculateLinearTrend(scores, dates);
          
          let trendDirection: 'improving' | 'stable' | 'declining';
          if (Math.abs(trendData.slope) < 0.1) {
            trendDirection = 'stable';
          } else {
            trendDirection = trendData.slope < 0 ? 'improving' : 'declining';
          }

          const timeSpan = Math.floor(
            (dates[dates.length - 1].getTime() - dates[0].getTime()) / (24 * 60 * 60 * 1000)
          );

          trends.push({
            metric: assessmentType,
            trend: trendDirection,
            confidence: trendData.r2,
            dataPoints: assessments.length,
            timeSpan
          });
        }
      }

      return trends;
    } catch (error) {
      console.error('Failed to analyze mental health trends:', error);
      return [];
    }
  }

  /**
   * Generate crisis risk assessment
   */
  static async assessCrisisRisk(userId: string): Promise<{
    riskLevel: 'low' | 'moderate' | 'high' | 'critical';
    score: number;
    factors: string[];
    immediateActions: string[];
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          assessments: {
            orderBy: { completedAt: 'desc' },
            take: 5
          },
          moodEntries: {
            orderBy: { createdAt: 'desc' },
            take: 7
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      let riskScore = 0;
      const factors = [];

      // Recent high assessment scores
      const recentHighScores = user.assessments.filter(a => a.score > 80);
      if (recentHighScores.length > 0) {
        riskScore += 30;
        factors.push('severe_symptom_levels');
      }

      // Consistent negative moods
      const negativeCount = user.moodEntries.filter(m => 
        ['Struggling', 'Anxious'].includes(m.mood)
      ).length;
      
      if (negativeCount > 5) {
        riskScore += 25;
        factors.push('persistent_negative_moods');
      }

      // Rapid deterioration
      if (user.assessments.length >= 2) {
        const scoreDiff = user.assessments[0].score - user.assessments[1].score;
        if (scoreDiff > 20) {
          riskScore += 20;
          factors.push('rapid_deterioration');
        }
      }

      // Determine risk level
      let riskLevel: 'low' | 'moderate' | 'high' | 'critical';
      if (riskScore >= 70) riskLevel = 'critical';
      else if (riskScore >= 50) riskLevel = 'high';
      else if (riskScore >= 25) riskLevel = 'moderate';
      else riskLevel = 'low';

      // Generate immediate actions
      const immediateActions = [];
      if (riskLevel === 'critical') {
        immediateActions.push('Contact emergency services or crisis hotline immediately');
        immediateActions.push('Reach out to trusted friend, family member, or mental health professional');
      } else if (riskLevel === 'high') {
        immediateActions.push('Schedule appointment with mental health professional within 24-48 hours');
        immediateActions.push('Activate support network and avoid being alone');
      } else if (riskLevel === 'moderate') {
        immediateActions.push('Increase self-monitoring and mood tracking');
        immediateActions.push('Consider reaching out to mental health support');
      } else {
        immediateActions.push('Continue current self-care practices');
        immediateActions.push('Maintain regular assessment schedule');
      }

      return {
        riskLevel,
        score: riskScore,
        factors,
        immediateActions
      };
    } catch (error) {
      console.error('Failed to assess crisis risk:', error);
      return {
        riskLevel: 'low',
        score: 0,
        factors: ['assessment_error'],
        immediateActions: ['Contact mental health professional for proper evaluation']
      };
    }
  }
}
