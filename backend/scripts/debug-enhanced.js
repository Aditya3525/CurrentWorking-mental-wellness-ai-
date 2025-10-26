require('ts-node/register');

const { PrismaClient } = require('@prisma/client');
const { enhancedRecommendationService } = require('../src/services/enhancedRecommendationService');
const { crisisDetectionService } = require('../src/services/crisisDetectionService');

async function main() {
  const userId = process.argv[2];
  if (!userId) {
    console.error('Usage: node scripts/debug-enhanced.js <userId>');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        chatMessages: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!user) {
      console.error('User not found', userId);
      return;
    }

    const engagementHistory = await prisma.contentEngagement.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const assessmentResults = await prisma.assessmentResult.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      take: 10
    });

    const moodEntries = await prisma.moodEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    const chatMessages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const crisisDetection = await crisisDetectionService.detectCrisisLevel(userId, {
      assessments: assessmentResults,
      recentMessages: chatMessages,
      moodHistory: moodEntries,
      engagementHistory: engagementHistory.map(e => ({
        completed: e.completed,
        effectiveness: e.effectiveness,
        timeSpent: e.timeSpent
      }))
    });

    const context = {
      user: {
        id: userId,
        approach: user.approach || 'hybrid',
        wellnessScore: 50,
        recentMood: moodEntries[0]?.mood,
        assessmentResults: assessmentResults.map(a => ({
          type: a.assessmentType,
          score: a.score,
          normalizedScore: a.normalizedScore || undefined
        })),
        completedContent: engagementHistory.filter(e => e.completed).map(e => e.contentId),
        engagementHistory: engagementHistory.map(e => ({
          contentId: e.contentId,
          completed: e.completed,
          rating: e.rating,
          effectiveness: e.effectiveness,
          timeSpent: e.timeSpent
        }))
      },
      currentState: {
        timeOfDay: 'evening',
        availableTime: 20,
        environment: 'home',
        crisisLevel: crisisDetection.level,
        immediateNeed: false
      }
    };

    try {
      const recommendations = await enhancedRecommendationService.getPersonalizedRecommendations(context, 6);
      console.log('Recommendations generated:', JSON.stringify(recommendations, null, 2));
    } catch (error) {
      console.error('Error during recommendation generation:', error);
    }
  } catch (err) {
    console.error('Debug script failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
