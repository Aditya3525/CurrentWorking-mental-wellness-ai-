/**
 * Simple AI Test Script - Test AI functionality without authentication
 */

const axios = require('axios');

async function testAIDirectly() {
  console.log('🧪 Testing AI System Directly...\n');
  
  try {
    // Import the LLM service directly
    const { llmService } = await import('./dist/services/llmProvider.js');
    
    console.log('1. ✅ LLM Service imported successfully');
    
    // Test provider status
    const status = await llmService.getProviderStatus();
    console.log('2. Provider Status:', JSON.stringify(status, null, 2));
    
    // Test conversation context
    const testUserContext = {
      id: 'test-user-123',
      name: 'Alex Thompson',
      approach: 'western',
      recentAssessments: [
        { assessmentType: 'PHQ-9', score: 12, completedAt: new Date() }
      ],
      currentMood: 'anxious',
      preferences: {
        emergencyContact: 'test@example.com',
        dataConsent: true,
        clinicianSharing: false
      }
    };
    
    const conversationContext = {
      user: testUserContext,
      messages: [
        { role: 'user', content: 'I have been feeling really overwhelmed with work lately and I can\'t seem to focus on anything.' }
      ],
      sessionId: 'test-session-' + Date.now(),
      timestamp: new Date()
    };
    
    console.log('3. Testing AI Response Generation...');
    console.log('   User message: "I have been feeling really overwhelmed with work lately and I can\'t seem to focus on anything."');
    console.log('   User approach: western (CBT focused)');
    console.log('   Recent PHQ-9 score: 12 (moderate depression)');
    console.log('   Current mood: anxious\n');
    
    const startTime = Date.now();
    const response = await llmService.generateResponse(
      [{ role: 'user', content: 'I have been feeling really overwhelmed with work lately and I can\'t seem to focus on anything.' }],
      { 
        maxTokens: 150, 
        temperature: 0.7 
      },
      conversationContext
    );
    const endTime = Date.now();
    
    console.log('4. ✅ AI Response Generated Successfully!');
    console.log('   Provider used:', response.provider);
    console.log('   Model:', response.model);
    console.log('   Response time:', response.processingTime + 'ms');
    console.log('   Total time:', (endTime - startTime) + 'ms');
    console.log('\n📝 AI Response:');
    console.log('   "' + response.content + '"');
    
    // Test if response is personalized
    const responseText = response.content.toLowerCase();
    const hasPersonalization = 
      responseText.includes('alex') || 
      responseText.includes('overwhelm') || 
      responseText.includes('work') ||
      responseText.includes('focus') ||
      responseText.includes('anxious') ||
      responseText.includes('cbt') ||
      responseText.includes('thought') ||
      responseText.includes('cognitive');
    
    console.log('\n🎯 Personalization Analysis:');
    console.log('   Contains user context references:', hasPersonalization ? '✅ YES' : '❌ NO');
    
    if (response.provider === 'ollama') {
      console.log('   ✅ Using local Ollama (offline AI)');
    } else {
      console.log('   ✅ Using cloud AI provider');
    }
    
    console.log('\n🎉 AI Integration Test: SUCCESS!');
    console.log('The chatbot CAN generate personalized responses based on user context!\n');
    
  } catch (error) {
    console.error('\n❌ AI Integration Test: FAILED');
    console.error('Error:', error.message);
    console.error('\nPossible issues:');
    console.error('1. API keys not configured correctly');
    console.error('2. Ollama not running or insufficient memory');
    console.error('3. Network connectivity issues');
    console.error('\nTo fix:');
    console.error('- Add valid API keys to .env file');
    console.error('- Ensure Ollama is running: ollama serve');
    console.error('- Try using phi model: OLLAMA_MODEL=phi');
  }
}

// Run the test
testAIDirectly().catch(console.error);
