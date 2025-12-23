import { advancedAnalyticsService } from '../services/advancedAnalyticsService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Test script to verify analytics tracking is working
 */
async function testAnalytics() {
  console.log('🧪 Testing Advanced Analytics System...\n');

  try {
    // Test 1: Track AI Usage
    console.log('Test 1: Tracking AI usage...');
    await advancedAnalyticsService.trackAIUsage({
      provider: 'gemini',
      model: 'gemini-pro',
      responseTime: 1250,
      totalTokens: 350,
      promptTokens: 150,
      completionTokens: 200,
      success: true
    });
    console.log('✅ AI usage tracked\n');

    // Test 2: Track Crisis Event
    console.log('Test 2: Tracking crisis event...');
    const testUser = await prisma.user.findFirst();
    if (testUser) {
      await advancedAnalyticsService.trackCrisisEvent({
        userId: testUser.id,
        crisisLevel: 'MODERATE',
        confidence: 0.75,
        indicators: ['Moderate distress language detected', 'Recent mood decline'],
        actionTaken: 'MONITORING'
      });
      console.log('✅ Crisis event tracked\n');
    } else {
      console.log('⚠️  No test user found, skipping crisis event\n');
    }

    // Test 3: Track System Metric
    console.log('Test 3: Tracking system metrics...');
    await advancedAnalyticsService.trackSystemMetric({
      metricType: 'api_response',
      value: 125,
      unit: 'ms',
      endpoint: 'GET /api/chat',
      tags: {
        statusCode: 200,
        method: 'GET'
      }
    });
    console.log('✅ System metric tracked\n');

    // Test 4: Get AI Analytics
    console.log('Test 4: Retrieving AI analytics...');
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = new Date();
    const aiAnalytics = await advancedAnalyticsService.getAIProviderAnalytics(startDate, endDate);
    console.log('✅ AI Analytics Retrieved:');
    console.log(JSON.stringify(aiAnalytics, null, 2));
    console.log();

    // Test 5: Get Crisis Analytics
    console.log('Test 5: Retrieving crisis analytics...');
    const crisisAnalytics = await advancedAnalyticsService.getCrisisAnalytics(startDate, endDate);
    console.log('✅ Crisis Analytics Retrieved:');
    console.log(JSON.stringify(crisisAnalytics, null, 2));
    console.log();

    // Test 6: Get System Health
    console.log('Test 6: Retrieving system health analytics...');
    const healthAnalytics = await advancedAnalyticsService.getSystemHealthAnalytics(startDate, endDate);
    console.log('✅ System Health Analytics Retrieved:');
    console.log(JSON.stringify(healthAnalytics, null, 2));
    console.log();

    console.log('🎉 All analytics tests passed!');
    console.log('\n📊 Analytics system is fully operational!');

  } catch (error) {
    console.error('❌ Analytics test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
testAnalytics()
  .then(() => {
    console.log('\n✨ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
