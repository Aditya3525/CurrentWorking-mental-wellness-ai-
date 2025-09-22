#!/usr/bin/env node
/**
 * Direct test of the approach router to verify it's no longer returning placeholder responses
 */

require('dotenv').config();

async function testApproachRouter() {
  console.log('🔧 Testing Approach Router Directly');
  console.log('===================================\n');

  try {
    // Import the approach router
    const { approachRouter } = require('./dist/services/langchainRouter.js');
    
    // Mock user context
    const userContext = {
      id: 'test-user-123',
      name: 'Test User',
      approach: 'western',
      preferences: {}
    };

    // Mock mental health state
    const mentalHealthState = {
      state: 'moderate',
      score: 60,
      topConcerns: ['anxiety', 'stress']
    };

    const userMessage = "I'm feeling really anxious today and can't focus on anything. Can you help me?";

    console.log(`📤 Testing message: "${userMessage}"`);
    console.log(`👤 User approach: ${userContext.approach}`);
    console.log(`🧠 Mental health state: ${mentalHealthState.state} (${mentalHealthState.score}/100)`);
    console.log(`😟 Top concerns: ${mentalHealthState.topConcerns.join(', ')}\n`);

    console.log('🤖 Generating response...');
    const startTime = Date.now();
    
    const response = await approachRouter.routeResponse(
      userMessage,
      userContext,
      mentalHealthState
    );
    
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`✅ Response generated in ${duration}ms\n`);
    console.log('📋 Response Details:');
    console.log('   Provider:', response.provider);
    console.log('   Approach:', response.approach);
    console.log('   Model:', response.model || 'unknown');
    console.log('   Should suggest professional:', response.shouldSuggestProfessional);
    console.log('   Content suggestions:', response.contentSuggestions?.join(', ') || 'none');
    console.log('\n💬 AI Response:');
    console.log('   "' + response.message + '"');

    // Check if it's still a placeholder
    if (response.message === 'Placeholder response') {
      console.log('\n❌ FAILURE: Still returning placeholder response!');
      console.log('The langchainRouter.ts fix did not work properly.');
      return false;
    } else {
      console.log('\n✅ SUCCESS: Real AI response generated!');
      console.log(`🎯 Response length: ${response.message.length} characters`);
      console.log(`⚡ Provider used: ${response.provider}`);
      return true;
    }

  } catch (error) {
    console.error('\n❌ Error testing approach router:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test
testApproachRouter().then(success => {
  process.exit(success ? 0 : 1);
});