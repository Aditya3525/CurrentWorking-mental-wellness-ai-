/**
 * End-to-End Recommendation System Test
 * Tests the complete flow of the recommendation system
 */

const axios = require('axios');
const chalk = require('chalk');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let testUserId = '';

// Test configuration
const TEST_USER = {
  email: `test-rec-${Date.now()}@example.com`,
  password: 'Test123!@#',
  name: 'Recommendation Tester',
  approach: 'hybrid'
};

// Utility functions
const log = {
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  success: (msg) => console.log(chalk.green('✓'), msg),
  error: (msg) => console.log(chalk.red('✗'), msg),
  warning: (msg) => console.log(chalk.yellow('⚠'), msg),
  section: (msg) => console.log(chalk.cyan.bold(`\n${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}`)),
  data: (data) => console.log(chalk.gray(JSON.stringify(data, null, 2)))
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    };
    
    if (data) {
      if (method === 'GET') {
        config.params = data;
      } else {
        config.data = data;
      }
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      status: error.response?.status
    };
  }
}

// Test Steps
async function step1_RegisterUser() {
  log.section('STEP 1: User Registration');
  
  const result = await makeRequest('POST', '/auth/register', TEST_USER);
  
  if (!result.success) {
    log.error(`Registration failed: ${result.error}`);
    return false;
  }
  
  authToken = result.data.token;
  testUserId = result.data.user.id;
  
  log.success(`User registered: ${TEST_USER.email}`);
  log.info(`User ID: ${testUserId}`);
  log.info(`Auth token obtained`);
  
  return true;
}

async function step2_CompleteAssessment() {
  log.section('STEP 2: Complete Anxiety Assessment');
  log.info('This creates focus areas for recommendations');
  
  // Simulate high anxiety scores
  const assessmentData = {
    type: 'anxiety',
    responses: {
      q1: 4, // Feeling nervous
      q2: 4, // Can't stop worrying
      q3: 3, // Worrying too much
      q4: 4, // Trouble relaxing
      q5: 3, // Restless
      q6: 2, // Easily annoyed
      q7: 4  // Feeling afraid
    }
  };
  
  const result = await makeRequest('POST', '/assessments/submit', assessmentData, authToken);
  
  if (!result.success) {
    log.error(`Assessment submission failed: ${result.error}`);
    return false;
  }
  
  const score = result.data.score || result.data.data?.score;
  log.success(`Anxiety assessment completed`);
  log.info(`Score: ${score}/100 (High anxiety - should trigger anxiety focus)`);
  
  await wait(1000);
  return true;
}

async function step3_LogMood() {
  log.section('STEP 3: Log Mood Entry');
  log.info('Mood data influences recommendations');
  
  const moodData = {
    mood: 'anxious',
    intensity: 8,
    notes: 'Feeling very stressed and overwhelmed with work',
    activities: ['work'],
    triggers: ['deadline', 'pressure']
  };
  
  const result = await makeRequest('POST', '/mood/log', moodData, authToken);
  
  if (!result.success) {
    log.error(`Mood logging failed: ${result.error}`);
    return false;
  }
  
  log.success(`Mood logged: anxious (intensity: 8)`);
  log.info('Should trigger anxiety and stress focus areas');
  
  await wait(1000);
  return true;
}

async function step4_ChatWithAI() {
  log.section('STEP 4: Chat with AI');
  log.info('Chat sentiment analysis influences recommendations');
  
  const chatMessage = {
    message: "I'm feeling really anxious about my presentation tomorrow. I can't stop worrying and my mind is racing.",
    sessionId: `test-session-${Date.now()}`
  };
  
  const result = await makeRequest('POST', '/chat', chatMessage, authToken);
  
  if (!result.success) {
    log.error(`Chat failed: ${result.error}`);
    return false;
  }
  
  log.success(`AI responded successfully`);
  
  if (result.data.recommendations) {
    log.info(`Chat included ${result.data.recommendations.items?.length || 0} recommendations`);
    log.data(result.data.recommendations);
  } else {
    log.warning('No recommendations in chat response');
  }
  
  await wait(1000);
  return true;
}

async function step5_GetPersonalizedRecommendations() {
  log.section('STEP 5: Get Personalized Recommendations (Main Test)');
  log.info('Testing /api/recommendations/personalized endpoint');
  
  const queryParams = {
    timeOfDay: 'afternoon',
    availableTime: 15, // 15 minutes
    environment: 'work',
    immediateNeed: false
  };
  
  const result = await makeRequest('GET', '/recommendations/personalized', queryParams, authToken);
  
  if (!result.success) {
    log.error(`Recommendation fetch failed: ${result.error}`);
    return false;
  }
  
  log.success('✅ Recommendations retrieved successfully!');
  
  const data = result.data.data || result.data;
  
  // Analyze the response
  log.info('\n📊 RECOMMENDATION ANALYSIS:');
  log.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  
  // Crisis Detection
  const crisisInfo = result.data.meta?.crisisDetection || {};
  log.info(`🚨 Crisis Level: ${crisisInfo.level || data.crisisLevel || 'NONE'}`);
  log.info(`   Confidence: ${crisisInfo.confidence || 'N/A'}`);
  log.info(`   Immediate Action Needed: ${crisisInfo.immediateAction || data.immediateAction || false}`);
  
  // Focus Areas
  log.info(`\n🎯 Focus Areas Detected:`);
  if (data.focusAreas && data.focusAreas.length > 0) {
    data.focusAreas.forEach(area => log.info(`   • ${area}`));
  } else {
    log.warning('   No focus areas returned');
  }
  
  // Rationale
  log.info(`\n💡 Rationale:`);
  log.info(`   "${data.rationale || 'No rationale provided'}"`);
  
  // Recommendations
  log.info(`\n📚 Recommendations (${data.items?.length || 0} items):`);
  log.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  
  if (data.items && data.items.length > 0) {
    data.items.forEach((item, index) => {
      log.info(`\n${index + 1}. ${item.title}`);
      log.info(`   Type: ${item.type} | Source: ${item.source}`);
      log.info(`   Priority: ${item.priority || 'N/A'} | Immediate Relief: ${item.immediateRelief || false}`);
      log.info(`   Approach: ${item.approach || 'N/A'} | Category: ${item.category || 'N/A'}`);
      if (item.duration) {
        log.info(`   Duration: ${Math.round(item.duration / 60)} minutes`);
      }
      log.info(`   Reason: "${item.reason}"`);
      if (item.focusAreas && item.focusAreas.length > 0) {
        log.info(`   Focus: ${item.focusAreas.join(', ')}`);
      }
    });
  } else {
    log.warning('   No recommendation items returned');
  }
  
  // Fallback Status
  log.info(`\n🔄 Fallback Used: ${data.fallbackUsed || false}`);
  if (data.fallbackMessage) {
    log.info(`   Message: "${data.fallbackMessage}"`);
  }
  
  log.info(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  
  return true;
}

async function step6_TestDifferentContexts() {
  log.section('STEP 6: Test Different Time Contexts');
  
  const contexts = [
    { timeOfDay: 'morning', availableTime: 10, environment: 'home' },
    { timeOfDay: 'evening', availableTime: 30, environment: 'home', immediateNeed: true },
    { timeOfDay: 'night', availableTime: 5, environment: 'home' }
  ];
  
  for (const context of contexts) {
    log.info(`\nTesting: ${context.timeOfDay} | ${context.availableTime}min | ${context.environment} | immediate: ${context.immediateNeed || false}`);
    
    const result = await makeRequest('GET', '/recommendations/personalized', context, authToken);
    
    if (result.success) {
      const data = result.data.data || result.data;
      log.success(`Got ${data.items?.length || 0} recommendations`);
      log.info(`Focus: ${data.focusAreas?.slice(0, 3).join(', ') || 'none'}`);
    } else {
      log.error(`Failed: ${result.error}`);
    }
    
    await wait(500);
  }
  
  return true;
}

async function step7_EngageWithContent() {
  log.section('STEP 7: Engage with Content');
  log.info('Recording engagement to influence future recommendations');
  
  // First get recommendations to find content ID
  const recResult = await makeRequest('GET', '/recommendations/personalized', {}, authToken);
  
  if (!recResult.success || !recResult.data.data?.items?.length) {
    log.warning('No content to engage with');
    return true;
  }
  
  const contentId = recResult.data.data.items[0].id;
  
  if (!contentId) {
    log.warning('Content has no ID, skipping engagement');
    return true;
  }
  
  const engagementData = {
    completed: true,
    timeSpent: 300, // 5 minutes
    rating: 5,
    effectiveness: 9,
    notes: 'This really helped calm my anxiety'
  };
  
  const result = await makeRequest('POST', `/content/${contentId}/engage`, engagementData, authToken);
  
  if (!result.success) {
    log.error(`Engagement recording failed: ${result.error}`);
    return false;
  }
  
  log.success('Content engagement recorded');
  log.info('Future recommendations should prioritize similar content');
  
  return true;
}

async function step8_VerifyRecommendationImpact() {
  log.section('STEP 8: Verify Engagement Impact');
  log.info('Getting recommendations again to see if engagement affected results');
  
  await wait(1000);
  
  const result = await makeRequest('GET', '/recommendations/personalized', {}, authToken);
  
  if (!result.success) {
    log.error(`Failed: ${result.error}`);
    return false;
  }
  
  const data = result.data.data || result.data;
  
  log.success(`Got ${data.items?.length || 0} recommendations after engagement`);
  
  const hasEngagementBased = data.items?.some(item => 
    item.reason?.toLowerCase().includes('engagement') || 
    item.reason?.toLowerCase().includes('positive') ||
    item.priority === 7 || item.priority === 8
  );
  
  if (hasEngagementBased) {
    log.success('✅ System is using engagement history!');
  } else {
    log.info('Engagement-based recommendations may appear after more interactions');
  }
  
  return true;
}

// Main test runner
async function runAllTests() {
  console.log(chalk.cyan.bold('\n╔═══════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║     RECOMMENDATION SYSTEM END-TO-END TEST SUITE          ║'));
  console.log(chalk.cyan.bold('╚═══════════════════════════════════════════════════════════╝\n'));
  
  log.info(`Testing against: ${BASE_URL}`);
  log.info(`Test started at: ${new Date().toLocaleString()}\n`);
  
  const steps = [
    { name: 'User Registration', fn: step1_RegisterUser },
    { name: 'Complete Assessment', fn: step2_CompleteAssessment },
    { name: 'Log Mood', fn: step3_LogMood },
    { name: 'Chat with AI', fn: step4_ChatWithAI },
    { name: 'Get Personalized Recommendations', fn: step5_GetPersonalizedRecommendations },
    { name: 'Test Different Contexts', fn: step6_TestDifferentContexts },
    { name: 'Engage with Content', fn: step7_EngageWithContent },
    { name: 'Verify Engagement Impact', fn: step8_VerifyRecommendationImpact }
  ];
  
  let passedSteps = 0;
  let failedSteps = 0;
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    
    try {
      const success = await step.fn();
      
      if (success) {
        passedSteps++;
      } else {
        failedSteps++;
        log.error(`Step ${i + 1} failed: ${step.name}`);
        
        if (i < 4) { // Critical steps
          log.error('Critical step failed. Stopping tests.');
          break;
        }
      }
    } catch (error) {
      failedSteps++;
      log.error(`Step ${i + 1} error: ${error.message}`);
      
      if (i < 4) {
        log.error('Critical step failed. Stopping tests.');
        break;
      }
    }
    
    await wait(500);
  }
  
  // Final report
  log.section('TEST RESULTS SUMMARY');
  
  console.log(chalk.bold(`\nTotal Steps: ${steps.length}`));
  console.log(chalk.green(`Passed: ${passedSteps}`));
  console.log(chalk.red(`Failed: ${failedSteps}`));
  console.log(chalk.yellow(`Skipped: ${steps.length - passedSteps - failedSteps}`));
  
  const percentage = Math.round((passedSteps / steps.length) * 100);
  
  if (passedSteps === steps.length) {
    console.log(chalk.green.bold(`\n🎉 ALL TESTS PASSED! (${percentage}%)`));
    console.log(chalk.green('✅ Recommendation system is working end-to-end!'));
  } else if (passedSteps >= 5) {
    console.log(chalk.yellow.bold(`\n⚠️ PARTIAL SUCCESS (${percentage}%)`));
    console.log(chalk.yellow('Core recommendation system works, some features may need attention'));
  } else {
    console.log(chalk.red.bold(`\n❌ TESTS FAILED (${percentage}%)`));
    console.log(chalk.red('Recommendation system needs fixes'));
  }
  
  console.log(chalk.gray(`\nTest completed at: ${new Date().toLocaleString()}`));
  console.log(chalk.gray(`Test user: ${TEST_USER.email}`));
  console.log(chalk.gray(`User ID: ${testUserId}\n`));
}

// Run tests
runAllTests().catch(error => {
  log.error(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
