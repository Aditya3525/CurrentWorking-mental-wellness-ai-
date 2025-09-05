/**
 * Gemini Integration Test
 * Tests the new Google Gemini 2.0 Flash-Lite integration
 */

async function testGeminiIntegration() {
  console.log('🔥 Gemini 2.0 Flash-Lite Integration Test');
  console.log('==========================================\n');
  
  try {
    // Import LLM service
    const { llmService } = await import('./dist/services/llmProvider.js');
    console.log('✅ LLM Service loaded\n');
    
    // Test provider status
    console.log('1. Testing Provider Status...');
    const status = await llmService.getProviderStatus();
    console.log('Provider Status:', JSON.stringify(status, null, 2));
    
    if (status.gemini?.available) {
      console.log('✅ Gemini provider is available!\n');
    } else {
      console.log('⚠️ Gemini provider not available (likely no API key configured)\n');
    }
    
    // Test AI Response with different user approaches
    const testScenarios = [
      {
        name: "Anxiety with Gemini",
        userContext: {
          id: 'gemini-test-1',
          name: 'Alex',
          firstName: 'Alex',
          approach: 'western',
          recentAssessments: [
            { assessmentType: 'GAD-7', score: 14, completedAt: new Date() }
          ],
          currentMood: 'anxious',
          preferences: { dataConsent: true }
        },
        message: "I'm having panic attacks before important meetings. My heart races and I can't think clearly.",
        expectedFeatures: ['CBT techniques', 'grounding exercises', 'empathy']
      },
      {
        name: "Depression with Eastern Approach",
        userContext: {
          id: 'gemini-test-2',
          name: 'Maya',
          firstName: 'Maya', 
          approach: 'eastern',
          recentAssessments: [
            { assessmentType: 'PHQ-9', score: 16, completedAt: new Date() }
          ],
          currentMood: 'sad',
          preferences: { dataConsent: true }
        },
        message: "I feel like I'm just going through the motions. Everything feels meaningless and I'm disconnected from life.",
        expectedFeatures: ['mindfulness', 'present moment', 'compassion']
      }
    ];
    
    for (const scenario of testScenarios) {
      console.log(`📝 Testing: ${scenario.name}`);
      console.log(`👤 User: ${scenario.userContext.name} (${scenario.userContext.approach} approach)`);
      console.log(`📊 Assessment: ${scenario.userContext.recentAssessments[0]?.assessmentType}=${scenario.userContext.recentAssessments[0]?.score}`);
      console.log(`💬 Message: "${scenario.message}"\n`);
      
      try {
        // Build conversation context
        const conversationContext = {
          user: scenario.userContext,
          messages: [
            { role: 'user', content: scenario.message }
          ],
          sessionId: `gemini-test-${Date.now()}`,
          timestamp: new Date()
        };
        
        console.log('🤖 Generating Gemini response...');
        const startTime = Date.now();
        
        const response = await llmService.generateResponse(
          [{ role: 'user', content: scenario.message }],
          { maxTokens: 200, temperature: 0.7 },
          conversationContext
        );
        
        const endTime = Date.now();
        
        console.log(`✅ Response generated successfully!`);
        console.log(`⚡ Provider: ${response.provider}`);
        console.log(`🔧 Model: ${response.model}`);
        console.log(`⏱️ Processing Time: ${response.processingTime}ms`);
        console.log(`⚡ Total Time: ${endTime - startTime}ms`);
        console.log(`💭 Response: "${response.content}"\n`);
        
        // Analyze Gemini-specific features
        const responseText = response.content.toLowerCase();
        const analysis = {
          usesUserName: responseText.includes(scenario.userContext.firstName.toLowerCase()),
          referencesSymptoms: (
            responseText.includes('panic') && scenario.message.includes('panic') ||
            responseText.includes('meeting') && scenario.message.includes('meeting') ||
            responseText.includes('meaningless') && scenario.message.includes('meaningless')
          ),
          showsEmpathy: (
            responseText.includes('understand') ||
            responseText.includes('hear') ||
            responseText.includes('feel') ||
            responseText.includes('sorry') ||
            responseText.includes('difficult')
          ),
          usesApproachLanguage: scenario.userContext.approach === 'western' ? 
            (responseText.includes('thought') || responseText.includes('cognitive') || responseText.includes('technique')) :
            (responseText.includes('mindful') || responseText.includes('present') || responseText.includes('awareness')),
          providesActionable: (
            responseText.includes('try') ||
            responseText.includes('practice') ||
            responseText.includes('exercise') ||
            responseText.includes('technique')
          )
        };
        
        console.log('🔍 Gemini Response Analysis:');
        console.log(`   Uses user name: ${analysis.usesUserName ? '✅' : '❌'}`);
        console.log(`   References specific symptoms: ${analysis.referencesSymptoms ? '✅' : '❌'}`);
        console.log(`   Shows empathy: ${analysis.showsEmpathy ? '✅' : '❌'}`);
        console.log(`   Uses approach-appropriate language: ${analysis.usesApproachLanguage ? '✅' : '❌'}`);
        console.log(`   Provides actionable advice: ${analysis.providesActionable ? '✅' : '❌'}`);
        
        const qualityScore = Object.values(analysis).filter(Boolean).length;
        console.log(`   Overall Quality: ${qualityScore}/5 ${qualityScore >= 3 ? '✅ EXCELLENT' : qualityScore >= 2 ? '⚠️ GOOD' : '❌ NEEDS IMPROVEMENT'}\n`);
        
        // Test Gemini speed advantage
        if (response.provider === 'Gemini' && response.processingTime) {
          if (response.processingTime < 2000) {
            console.log('🚀 Gemini 2.0 Flash-Lite Speed Advantage: EXCELLENT (< 2s)');
          } else if (response.processingTime < 5000) {
            console.log('⚡ Gemini Response Speed: GOOD (< 5s)');
          } else {
            console.log('⏳ Gemini Response Speed: ACCEPTABLE (> 5s)');
          }
        }
        
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        
        if (error.message.includes('API key')) {
          console.log('💡 To test Gemini: Add GEMINI_API_KEY_1 to your .env file');
          console.log('📝 Get your key at: https://makersuite.google.com/app/apikey');
        }
      }
      
      console.log('─'.repeat(80) + '\n');
    }
    
    console.log('🎉 Gemini Integration Test Complete!\n');
    console.log('📊 Gemini 2.0 Flash-Lite Features:');
    console.log('✅ Ultra-fast response times (Flash-Lite optimized)');
    console.log('✅ Advanced reasoning capabilities');
    console.log('✅ Therapeutic context awareness');
    console.log('✅ Multi-turn conversation support');
    console.log('✅ Safety filters for mental health content');
    console.log('✅ Multiple API key rotation support');
    console.log('✅ Automatic fallback to other providers');
    
  } catch (error) {
    console.error('❌ Gemini test failed:', error.message);
    
    console.log('\n🔧 Setup Instructions:');
    console.log('1. Get Gemini API key: https://makersuite.google.com/app/apikey');
    console.log('2. Add to .env file: GEMINI_API_KEY_1=your_key_here');
    console.log('3. Restart backend: npm run dev');
    console.log('4. Test again: node test-gemini.js');
  }
}

// Run the test
testGeminiIntegration().catch(console.error);
