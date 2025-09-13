/**
 * Test script for the mental health agent
 */

import { mentalHealthAgent, MentalHealthAgentConfig } from '../src/services/langchainAgent';

async function testAgent() {
  console.log('🧪 Testing Mental Health Agent...\n');

  const config: MentalHealthAgentConfig = {
    userId: 'test-user-123',
    sessionId: 'test-session-' + Date.now(),
    approach: 'hybrid',
    enableEscalation: true
  };

  // Test 1: Normal conversation
  console.log('Test 1: Normal conversation');
  try {
    const response1 = await mentalHealthAgent.generateResponse(
      "I've been feeling a bit stressed at work lately",
      config
    );
    console.log('✅ Agent Response:', response1.response.substring(0, 100) + '...');
    console.log('📊 Mental Health Score:', response1.mentalHealthScore);
    console.log('🎯 Approach:', response1.approach);
    console.log('📋 Content Suggestions:', response1.contentSuggestions);
    console.log('⚠️  Should Escalate:', response1.shouldEscalate);
    console.log('🔥 Escalation Level:', response1.escalationLevel);
    console.log();
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
  }

  // Test 2: Crisis language
  console.log('Test 2: Crisis detection');
  try {
    const response2 = await mentalHealthAgent.generateResponse(
      "I feel hopeless and don't want to go on anymore",
      config
    );
    console.log('✅ Crisis Response:', response2.response.substring(0, 100) + '...');
    console.log('📊 Mental Health Score:', response2.mentalHealthScore);
    console.log('⚠️  Should Escalate:', response2.shouldEscalate);
    console.log('🚨 Escalation Level:', response2.escalationLevel);
    console.log();
  } catch (error) {
    console.error('❌ Test 2 failed:', error);
  }

  // Test 3: Test functionality
  console.log('Test 3: Agent test method');
  try {
    const testResult = await mentalHealthAgent.testAgent();
    console.log('🧪 Agent Test Result:', testResult);
    console.log();
  } catch (error) {
    console.error('❌ Test 3 failed:', error);
  }

  console.log('✅ Mental Health Agent Testing Complete!');
}

testAgent().catch(console.error);
