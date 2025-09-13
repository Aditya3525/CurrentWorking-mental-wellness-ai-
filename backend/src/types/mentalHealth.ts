/**
 * Mental Health State types and interfaces
 */
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
  
  // Expected by other services (backward compatibility)
  topConcerns?: string[];
  reasons?: string[];
  
  // Backward compatibility fields (required)
  state: string;
  score: number;
  confidence?: number;
  lastUpdated?: Date;
  lastAssessment?: Date;
  trend?: 'improving' | 'stable' | 'declining';
  riskFactors?: string[];
  recommendations?: string[];
}
