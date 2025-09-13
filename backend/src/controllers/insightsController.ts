import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { llmService } from '../services/llmProvider';

const prisma = new PrismaClient();

/**
 * Generate AI insights for a specific assessment
 */
export const generateAssessmentInsights = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { assessmentType, score, responses } = req.body;

    // Get user basic data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        birthday: true,
        gender: true,
        approach: true,
        region: true
      }
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Calculate age
    let age = null;
    let ageGroup = null;
    if (user.birthday) {
      const birthDate = new Date(user.birthday);
      age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      
      if (age < 18) ageGroup = 'teen';
      else if (age < 25) ageGroup = 'young-adult';
      else if (age < 45) ageGroup = 'adult';
      else if (age < 65) ageGroup = 'middle-aged';
      else ageGroup = 'senior';
    }

    // Create insight generation prompt
    const insightPrompt = `Generate personalized mental health insights for this assessment:

User Profile:
- Name: ${user.firstName || user.name || 'User'}
- Age: ${age || 'Not specified'}
- Gender: ${user.gender || 'Not specified'}
- Region: ${user.region || 'Not specified'}
- Therapeutic Approach: ${user.approach || 'Not specified'}

Assessment Details:
- Type: ${assessmentType}
- Score: ${score}
- Responses: ${JSON.stringify(responses)}

Please provide:
1. A personalized interpretation of their results (2-3 sentences)
2. Key strengths identified (1-2 points)
3. Areas for growth (1-2 points)  
4. Specific recommendations (2-3 actionable items)
5. Encouragement and next steps (1-2 sentences)

Keep the tone supportive, non-clinical, and age-appropriate. Focus on empowerment and growth.`;

    // Generate insights using AI
    const aiResponse = await llmService.generateResponse(
      [{ role: 'user', content: insightPrompt }],
      { maxTokens: 400, temperature: 0.7 }
    );

    // Store the insights
    const insightRecord = await prisma.assessment.updateMany({
      where: {
        userId,
        assessmentType,
        completedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      data: {
        aiInsights: aiResponse.content
      }
    });

    res.json({
      success: true,
      data: {
        insights: aiResponse.content,
        provider: aiResponse.provider,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Generate assessment insights error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * Get overall mental health summary based on all assessments
 */
export const getMentalHealthSummary = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    // Get user with all assessments
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        assessments: {
          orderBy: { completedAt: 'desc' },
          take: 10
        }
      }
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    if (user.assessments.length === 0) {
      res.json({
        success: true,
        data: {
          summary: "I don't have any assessment data to analyze yet. Complete some assessments to get a personalized mental health summary!",
          recommendations: ["Take your first assessment to get started", "Start with the anxiety or stress assessment"],
          hasData: false
        }
      });
      return;
    }

    // Calculate age
    let age = null;
    if (user.birthday) {
      const birthDate = new Date(user.birthday);
      age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    }

    // Prepare assessment summary
    const assessmentSummary = user.assessments.map(assessment => {
      let responses = {};
      try {
        responses = JSON.parse(assessment.responses);
      } catch (e) {
        // If parsing fails, keep empty object
      }
      
      return {
        type: assessment.assessmentType,
        score: assessment.score,
        completedAt: assessment.completedAt,
        responses: responses
      };
    });

    // Create comprehensive summary prompt
    const summaryPrompt = `Provide a comprehensive mental health summary based on this user's assessment data:

User Profile:
- Name: ${user.firstName || user.name || 'User'}
- Age: ${age || 'Not specified'}
- Therapeutic Approach: ${user.approach || 'Not specified'}

Assessment History:
${assessmentSummary.map(a => `- ${a.type}: Score ${a.score} (completed ${a.completedAt.toLocaleDateString()})`).join('\n')}

Detailed Assessment Data:
${JSON.stringify(assessmentSummary, null, 2)}

Please provide a comprehensive but conversational summary including:

1. **Overall Mental Health Picture** (3-4 sentences about their current state)

2. **Key Strengths** (2-3 specific strengths based on their data)

3. **Areas of Concern** (1-2 areas that need attention, if any)

4. **Progress & Patterns** (any trends or improvements over time)

5. **Personalized Recommendations** (3-4 specific, actionable suggestions)

6. **Encouragement & Next Steps** (supportive closing with clear next actions)

Keep the tone warm, supportive, and empowering. Avoid clinical jargon. Focus on their agency and potential for growth.`;

    // Generate comprehensive summary using AI
    const aiResponse = await llmService.generateResponse(
      [{ role: 'user', content: summaryPrompt }],
      { maxTokens: 600, temperature: 0.7 }
    );

    res.json({
      success: true,
      data: {
        summary: aiResponse.content,
        assessmentCount: user.assessments.length,
        latestAssessment: user.assessments[0]?.completedAt,
        hasData: true,
        provider: aiResponse.provider,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get mental health summary error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
