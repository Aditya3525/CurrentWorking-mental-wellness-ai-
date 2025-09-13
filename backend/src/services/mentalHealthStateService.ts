import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface MentalHealthState {
  // New psychological analysis fields
  classification?: 'flourishing' | 'thriving' | 'managing' | 'struggling' | 'distressed' | 'crisis';
  psychologicalTerminology?: string;
  overallWellbeingScore?: number;
  clinicalIndicators?: {
    anxietyLevel: 'minimal' | 'mild' | 'moderate' | 'severe';
    stressLevel: 'low' | 'moderate' | 'high' | 'severe';
    depressionRisk: 'minimal' | 'mild' | 'moderate' | 'severe';
    emotionalRegulation: 'excellent' | 'good' | 'fair' | 'poor';
    copingCapacity: 'adaptive' | 'mixed' | 'maladaptive';
    socialFunctioning: 'optimal' | 'good' | 'impaired' | 'severely_impaired';
  };
  assessmentInsights?: {
    primaryConcerns: string[];
    strengthsIdentified: string[];
    recommendedInterventions: string[];
    riskFactors: string[];
    protectiveFactors: string[];
  };
  requiresImmediate?: boolean;
  recommendsProfessional?: boolean;
  
  // Backward compatibility fields (required)
  state: string;
  score: number;
  topConcerns?: string[];
  reasons?: string[];
  confidence?: number;
  lastUpdated?: Date;
}

export class MentalHealthStateService {
  static async getUserState(userId: string): Promise<MentalHealthState> {
    try {
      // Fetch user data with assessments and AI insights
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          assessments: {
            where: { isLatest: true },
            orderBy: { completedAt: 'desc' },
            take: 10,
            select: {
              id: true,
              assessmentType: true,
              score: true,
              responses: true,
              aiInsights: true,
              completedAt: true,
              confidence: true,
              tags: true
            }
          },
          moodEntries: {
            orderBy: { createdAt: 'desc' },
            take: 14
          },
          chatMessages: {
            where: { type: 'user' },
            orderBy: { createdAt: 'desc' },
            take: 20
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Analyze assessments using AI insights and psychological frameworks
      const assessmentAnalysis = this.analyzeAssessments(user.assessments);
      
      // Calculate clinical indicators from AI insights
      const clinicalIndicators = this.calculateClinicalIndicators(assessmentAnalysis, user);
      
      // Determine psychological classification
      const classification = this.determineClassification(clinicalIndicators);
      
      // Generate scientific psychological terminology
      const psychologicalTerminology = this.generatePsychologicalTerminology(clinicalIndicators, assessmentAnalysis);
      
      // Calculate overall wellbeing score
      const overallWellbeingScore = this.calculateWellbeingScore(clinicalIndicators);
      
      // Extract insights from AI analysis
      const assessmentInsights = this.extractAssessmentInsights(assessmentAnalysis, user);
      
      // Determine intervention needs
      const requiresImmediate = this.assessCrisisRisk(clinicalIndicators);
      const recommendsProfessional = this.assessProfessionalSupportNeed(clinicalIndicators);
      
      // Calculate confidence based on data quality
      const confidence = this.calculateAnalysisConfidence(user, assessmentAnalysis);

      return {
        // New psychological analysis
        classification,
        psychologicalTerminology,
        overallWellbeingScore,
        clinicalIndicators,
        assessmentInsights,
        requiresImmediate,
        recommendsProfessional,
        confidence,
        lastUpdated: new Date(),
        
        // Backward compatibility
        state: classification || 'managing',
        score: overallWellbeingScore || 60,
        topConcerns: assessmentInsights?.primaryConcerns || ['General wellbeing'],
        reasons: assessmentInsights?.riskFactors || ['Baseline assessment']
      };

    } catch (error) {
      console.error('Failed to analyze mental health state:', error);
      return this.getSafeDefaultState();
    }
  }

  private static getSafeDefaultState(): MentalHealthState {
    const assessmentInsights = {
      primaryConcerns: ['Data collection needed for accurate assessment'],
      strengthsIdentified: ['Engagement with mental health resources'],
      recommendedInterventions: ['Complete comprehensive psychological assessments'],
      riskFactors: ['Insufficient assessment data'],
      protectiveFactors: ['Proactive help-seeking behavior']
    };
    
    return {
      classification: 'managing',
      psychologicalTerminology: 'Baseline Functioning - Insufficient Data for Comprehensive Assessment',
      overallWellbeingScore: 60,
      clinicalIndicators: {
        anxietyLevel: 'mild',
        stressLevel: 'moderate',
        depressionRisk: 'minimal',
        emotionalRegulation: 'fair',
        copingCapacity: 'mixed',
        socialFunctioning: 'good'
      },
      assessmentInsights,
      confidence: 0.3,
      lastUpdated: new Date(),
      requiresImmediate: false,
      recommendsProfessional: false,
      
      // Backward compatibility
      state: 'managing',
      score: 60,
      topConcerns: assessmentInsights.primaryConcerns,
      reasons: assessmentInsights.riskFactors
    };
  }

  /**
   * Analyze assessments using AI insights and psychological frameworks
   */
  private static analyzeAssessments(assessments: any[]): {
    hasData: boolean;
    insights: Array<{ type: string; insight: any; score: number }>;
    scores: Record<string, number>;
  } {
    if (assessments.length === 0) {
      return { hasData: false, insights: [], scores: {} };
    }

    const analysis = {
      hasData: true,
      insights: [] as Array<{ type: string; insight: any; score: number }>,
      scores: {} as Record<string, number>
    };

    // Parse AI insights from each assessment
    for (const assessment of assessments) {
      analysis.scores[assessment.assessmentType] = assessment.score;
      
      if (assessment.aiInsights) {
        try {
          const insight = typeof assessment.aiInsights === 'string' 
            ? JSON.parse(assessment.aiInsights) 
            : assessment.aiInsights;
          analysis.insights.push({
            type: assessment.assessmentType,
            insight,
            score: assessment.score
          });
        } catch (error) {
          // If JSON parsing fails, treat as text
          analysis.insights.push({
            type: assessment.assessmentType,
            insight: { textInsight: assessment.aiInsights },
            score: assessment.score
          });
        }
      }
    }

    return analysis;
  }

  /**
   * Calculate clinical indicators based on AI insights and assessment scores
   */
  private static calculateClinicalIndicators(analysis: any, user: any): MentalHealthState['clinicalIndicators'] {
    const { scores, insights } = analysis;

    return {
      anxietyLevel: this.determineAnxietyLevel(scores, insights),
      stressLevel: this.determineStressLevel(scores, insights, user),
      depressionRisk: this.determineDepressionRisk(scores, insights, user),
      emotionalRegulation: this.determineEmotionalRegulation(scores, insights),
      copingCapacity: this.determineCopingCapacity(scores, insights),
      socialFunctioning: this.determineSocialFunctioning(scores)
    };
  }

  private static determineAnxietyLevel(scores: Record<string, number>, insights: any[]): 'minimal' | 'mild' | 'moderate' | 'severe' {
    const anxietyScore = scores.anxiety || 0;
    const traumaScore = scores['trauma-fear'] || 0;
    
    // Check AI insights for anxiety indicators
    const hasAnxietyInsights = insights.some(insight => 
      JSON.stringify(insight).toLowerCase().includes('anxiety') ||
      JSON.stringify(insight).toLowerCase().includes('worry')
    );

    if (anxietyScore >= 80 || traumaScore >= 85 || hasAnxietyInsights) return 'severe';
    if (anxietyScore >= 65 || traumaScore >= 70) return 'moderate';
    if (anxietyScore >= 40 || traumaScore >= 50) return 'mild';
    return 'minimal';
  }

  private static determineStressLevel(scores: Record<string, number>, insights: any[], user: any): 'low' | 'moderate' | 'high' | 'severe' {
    const stressScore = scores.stress || 0;
    const overthinkingScore = scores.overthinking || 0;
    
    // Factor in mood entries
    const recentMoods = user.moodEntries?.slice(0, 7) || [];
    const stressfulMoods = recentMoods.filter((m: any) => m.mood === 'Anxious' || m.mood === 'Struggling').length;
    const moodStressFactor = recentMoods.length > 0 ? (stressfulMoods / recentMoods.length) * 20 : 0;

    const combinedStressScore = stressScore + overthinkingScore * 0.3 + moodStressFactor;

    if (combinedStressScore >= 85) return 'severe';
    if (combinedStressScore >= 65) return 'high';
    if (combinedStressScore >= 40) return 'moderate';
    return 'low';
  }

  private static determineDepressionRisk(scores: Record<string, number>, insights: any[], user: any): 'minimal' | 'mild' | 'moderate' | 'severe' {
    const stressScore = scores.stress || 0;
    const emotionalScore = scores.emotionalIntelligence || 100;
    
    // Analyze mood patterns
    const recentMoods = user.moodEntries?.slice(0, 14) || [];
    const depressiveMoods = recentMoods.filter((m: any) => m.mood === 'Struggling').length;
    const moodRisk = recentMoods.length > 0 ? (depressiveMoods / recentMoods.length) * 30 : 0;

    // Check insights for depressive language
    const hasDepressiveInsights = insights.some(insight => {
      const text = JSON.stringify(insight).toLowerCase();
      return text.includes('hopeless') || text.includes('sad') || text.includes('worthless');
    });

    const riskScore = stressScore * 0.4 + (100 - emotionalScore) * 0.3 + moodRisk + (hasDepressiveInsights ? 20 : 0);

    if (riskScore >= 70) return 'severe';
    if (riskScore >= 50) return 'moderate';
    if (riskScore >= 30) return 'mild';
    return 'minimal';
  }

  private static determineEmotionalRegulation(scores: Record<string, number>, insights: any[]): 'excellent' | 'good' | 'fair' | 'poor' {
    const emotionalScore = scores.emotionalIntelligence || 50;
    const stressScore = scores.stress || 0;
    const anxietyScore = scores.anxiety || 0;

    const regulationScore = emotionalScore - (stressScore * 0.3) - (anxietyScore * 0.3);

    if (regulationScore >= 70) return 'excellent';
    if (regulationScore >= 50) return 'good';
    if (regulationScore >= 30) return 'fair';
    return 'poor';
  }

  private static determineCopingCapacity(scores: Record<string, number>, insights: any[]): 'adaptive' | 'mixed' | 'maladaptive' {
    const emotionalScore = scores.emotionalIntelligence || 50;
    const stressScore = scores.stress || 0;
    
    const copingScore = emotionalScore - stressScore * 0.5;

    if (copingScore >= 60) return 'adaptive';
    if (copingScore >= 35) return 'mixed';
    return 'maladaptive';
  }

  private static determineSocialFunctioning(scores: Record<string, number>): 'optimal' | 'good' | 'impaired' | 'severely_impaired' {
    const emotionalScore = scores.emotionalIntelligence || 50;
    const personalityScore = scores.personality || 50;
    const anxietyScore = scores.anxiety || 0;

    const socialScore = (emotionalScore + personalityScore) / 2 - anxietyScore * 0.4;

    if (socialScore >= 70) return 'optimal';
    if (socialScore >= 50) return 'good';
    if (socialScore >= 30) return 'impaired';
    return 'severely_impaired';
  }

  /**
   * Determine psychological classification based on clinical indicators
   */
  private static determineClassification(indicators: any): MentalHealthState['classification'] {
    let severeCount = 0;
    let moderateCount = 0;
    
    if (indicators.anxietyLevel === 'severe') severeCount++;
    else if (indicators.anxietyLevel === 'moderate') moderateCount++;
    
    if (indicators.stressLevel === 'severe') severeCount++;
    else if (indicators.stressLevel === 'high') moderateCount++;
    
    if (indicators.depressionRisk === 'severe') severeCount++;
    else if (indicators.depressionRisk === 'moderate') moderateCount++;
    
    if (indicators.emotionalRegulation === 'poor') severeCount++;
    if (indicators.copingCapacity === 'maladaptive') severeCount++;
    if (indicators.socialFunctioning === 'severely_impaired') severeCount++;

    if (severeCount >= 3) return 'crisis';
    if (severeCount >= 2) return 'distressed';
    if (severeCount >= 1 || moderateCount >= 3) return 'struggling';
    if (moderateCount >= 1) return 'managing';
    if (moderateCount === 0 && severeCount === 0) return 'thriving';
    return 'flourishing';
  }

  /**
   * Generate psychological terminology using scientific language
   */
  private static generatePsychologicalTerminology(indicators: any, analysis: any): string {
    const terms: string[] = [];

    if (indicators.anxietyLevel === 'severe') terms.push('Severe Anxiety Symptoms');
    else if (indicators.anxietyLevel === 'moderate') terms.push('Moderate Anxiety Presentation');

    if (indicators.stressLevel === 'severe') terms.push('Acute Stress Response');
    else if (indicators.stressLevel === 'high') terms.push('Elevated Stress Reactivity');

    if (indicators.depressionRisk === 'severe') terms.push('High Depressive Risk Factors');
    else if (indicators.depressionRisk === 'moderate') terms.push('Subclinical Depressive Features');

    if (indicators.emotionalRegulation === 'poor') terms.push('Emotional Dysregulation');
    if (indicators.copingCapacity === 'maladaptive') terms.push('Maladaptive Coping Patterns');

    return terms.length > 0 ? terms.join(' with ') : 'Baseline Psychological Functioning';
  }

  /**
   * Calculate overall wellbeing score based on clinical indicators
   */
  private static calculateWellbeingScore(indicators: any): number {
    let score = 100;

    const penalties: Record<string, number> = {
      severe: 40, moderate: 25, mild: 10, minimal: 0,
      poor: 35, fair: 20, good: 5, excellent: 0,
      maladaptive: 30, mixed: 15, adaptive: 0,
      severely_impaired: 35, impaired: 20, optimal: 0,
      high: 30, low: 0
    };

    Object.values(indicators).forEach((level: any) => {
      score -= penalties[level] || 0;
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Extract insights from AI assessment analysis
   */
  private static extractAssessmentInsights(analysis: any, user: any): MentalHealthState['assessmentInsights'] {
    const insights: MentalHealthState['assessmentInsights'] = {
      primaryConcerns: [],
      strengthsIdentified: [],
      recommendedInterventions: [],
      riskFactors: [],
      protectiveFactors: []
    };

    if (!analysis.hasData) {
      return {
        primaryConcerns: ['Insufficient assessment data for detailed analysis'],
        strengthsIdentified: ['Engagement with mental health platform'],
        recommendedInterventions: ['Complete comprehensive psychological assessments'],
        riskFactors: ['Limited self-awareness due to incomplete assessment'],
        protectiveFactors: ['Proactive help-seeking behavior']
      };
    }

    // Extract from AI insights
    analysis.insights.forEach((item: any) => {
      const insightText = JSON.stringify(item.insight).toLowerCase();
      
      if (insightText.includes('anxiety') || item.type === 'anxiety') {
        insights.primaryConcerns!.push('Anxiety-related symptoms and triggers');
      }
      if (insightText.includes('stress') || item.type === 'stress') {
        insights.primaryConcerns!.push('Chronic stress and overwhelm');
      }
      if (item.type === 'trauma-fear') {
        insights.primaryConcerns!.push('Trauma-related distress and fear responses');
      }
      if (item.type === 'overthinking') {
        insights.primaryConcerns!.push('Ruminative thinking patterns');
      }

      if (item.score < 40) {
        insights.strengthsIdentified!.push(`Strong ${item.type.replace('-', ' ')} management skills`);
      }
    });

    // Recommended interventions
    if (analysis.scores.anxiety > 60) {
      insights.recommendedInterventions!.push('Cognitive-behavioral therapy for anxiety management');
      insights.recommendedInterventions!.push('Mindfulness-based stress reduction techniques');
    }
    
    if (analysis.scores.stress > 60) {
      insights.recommendedInterventions!.push('Stress management and relaxation training');
    }

    return insights;
  }

  private static assessCrisisRisk(indicators: any): boolean {
    const severeCount = [
      indicators.anxietyLevel === 'severe',
      indicators.stressLevel === 'severe',
      indicators.depressionRisk === 'severe',
      indicators.copingCapacity === 'maladaptive',
      indicators.socialFunctioning === 'severely_impaired'
    ].filter(Boolean).length;

    return severeCount >= 3;
  }

  private static assessProfessionalSupportNeed(indicators: any): boolean {
    const concernCount = [
      ['moderate', 'severe'].includes(indicators.anxietyLevel),
      ['high', 'severe'].includes(indicators.stressLevel),
      ['moderate', 'severe'].includes(indicators.depressionRisk),
      indicators.emotionalRegulation === 'poor',
      indicators.copingCapacity === 'maladaptive'
    ].filter(Boolean).length;

    return concernCount >= 2;
  }

  private static calculateAnalysisConfidence(user: any, analysis: any): number {
    let confidence = 0.3;

    const assessmentCount = user.assessments?.length || 0;
    if (assessmentCount >= 3) confidence += 0.3;
    else if (assessmentCount >= 2) confidence += 0.2;
    else if (assessmentCount >= 1) confidence += 0.1;

    if (user.moodEntries?.length >= 7) confidence += 0.15;
    if (user.chatMessages?.length >= 5) confidence += 0.1;
    if (analysis.insights.length > 0) confidence += 0.15;

    return Math.min(1, confidence);
  }

  static checkNeedsProfessionalSupport(state: MentalHealthState): boolean {
    return state.requiresImmediate || state.recommendsProfessional || false;
  }
}