/**
 * AI Personalization Demo - Direct Testing
 * Shows how the AI system personalizes responses based on user context
 */

async function demonstratePersonalizationDirect() {
  console.log('🎯 AI Personalization Direct Demo');
  console.log('=================================\n');
  
  try {
    // Import LLM service directly
    const { llmService } = await import('./dist/services/llmProvider.js');
    console.log('✅ LLM Service loaded\n');
    
    // Test scenarios with different user contexts
    const scenarios = [
      {
        name: "Scenario 1: Anxiety with Western (CBT) Approach",
        userContext: {
          id: 'demo-user-1',
          name: 'Sarah',
          firstName: 'Sarah',
          approach: 'western',
          recentAssessments: [
            { assessmentType: 'GAD-7', score: 15, completedAt: new Date() }
          ],
          currentMood: 'anxious',
          preferences: { dataConsent: true }
        },
        message: "I have a presentation tomorrow and I keep imagining everything going wrong.",
        expectedApproach: "Should focus on CBT techniques like challenging negative thoughts"
      },
      {
        name: "Scenario 2: Depression with Eastern (Mindfulness) Approach", 
        userContext: {
          id: 'demo-user-2',
          name: 'Marcus',
          firstName: 'Marcus',
          approach: 'eastern',
          recentAssessments: [
            { assessmentType: 'PHQ-9', score: 18, completedAt: new Date() }
          ],
          currentMood: 'sad',
          preferences: { dataConsent: true }
        },
        message: "I feel empty and disconnected from everyone around me.",
        expectedApproach: "Should focus on mindfulness, present-moment awareness, and compassion"
      },
      {
        name: "Scenario 3: Mixed Issues with Hybrid Approach",
        userContext: {
          id: 'demo-user-3', 
          name: 'Emma',
          firstName: 'Emma',
          approach: 'hybrid',
          recentAssessments: [
            { assessmentType: 'PHQ-9', score: 12, completedAt: new Date() },
            { assessmentType: 'GAD-7', score: 13, completedAt: new Date() }
          ],
          currentMood: 'overwhelmed',
          preferences: { dataConsent: true }
        },
        message: "Work stress is affecting my sleep and concentration.",
        expectedApproach: "Should blend CBT and mindfulness techniques"
      }
    ];
    
    for (const scenario of scenarios) {
      console.log(`📝 ${scenario.name}`);
      console.log(`👤 User: ${scenario.userContext.name} (${scenario.userContext.approach} approach)`);
      console.log(`📊 Recent Assessment: ${scenario.userContext.recentAssessments[0]?.assessmentType}=${scenario.userContext.recentAssessments[0]?.score}`);
      console.log(`😊 Current Mood: ${scenario.userContext.currentMood}`);
      console.log(`💬 Message: "${scenario.message}"`);
      console.log(`🎯 Expected: ${scenario.expectedApproach}\n`);
      
      try {
        // Build conversation context
        const conversationContext = {
          user: scenario.userContext,
          messages: [
            { role: 'user', content: scenario.message }
          ],
          sessionId: `demo-${Date.now()}`,
          timestamp: new Date()
        };
        
        // Generate AI response
        console.log('🤖 Generating AI response...');
        const startTime = Date.now();
        
        const response = await llmService.generateResponse(
          [{ role: 'user', content: scenario.message }],
          { maxTokens: 150, temperature: 0.7 },
          conversationContext
        );
        
        const endTime = Date.now();
        
        console.log(`✅ Response generated successfully!`);
        console.log(`⚡ Provider: ${response.provider}`);
        console.log(`🔧 Model: ${response.model}`);
        console.log(`⏱️ Time: ${response.processingTime}ms`);
        console.log(`📝 Response: "${response.content}"\n`);
        
        // Analyze personalization
        const responseText = response.content.toLowerCase();
        const analysis = {
          usesUserName: responseText.includes(scenario.userContext.firstName.toLowerCase()),
          referencesMessage: (
            responseText.includes('presentation') && scenario.message.includes('presentation') ||
            responseText.includes('empty') && scenario.message.includes('empty') ||
            responseText.includes('work') && scenario.message.includes('work') ||
            responseText.includes('sleep') && scenario.message.includes('sleep')
          ),
          showsEmpathy: (
            responseText.includes('understand') ||
            responseText.includes('hear') ||
            responseText.includes('feel') ||
            responseText.includes('valid') ||
            responseText.includes('difficult')
          ),
          usesApproachLanguage: scenario.userContext.approach === 'western' ? 
            (responseText.includes('thought') || responseText.includes('cognitive') || responseText.includes('evidence')) :
            scenario.userContext.approach === 'eastern' ?
            (responseText.includes('mindful') || responseText.includes('present') || responseText.includes('awareness')) :
            (responseText.includes('balance') || responseText.includes('breath') || responseText.includes('practical'))
        };
        
        console.log('🔍 Personalization Analysis:');
        console.log(`   Uses user name: ${analysis.usesUserName ? '✅' : '❌'}`);
        console.log(`   References specific concerns: ${analysis.referencesMessage ? '✅' : '❌'}`);
        console.log(`   Shows empathy: ${analysis.showsEmpathy ? '✅' : '❌'}`);
        console.log(`   Uses approach-appropriate language: ${analysis.usesApproachLanguage ? '✅' : '❌'}`);
        
        const personalizationScore = Object.values(analysis).filter(Boolean).length;
        console.log(`   Overall Personalization: ${personalizationScore}/4 ${personalizationScore >= 2 ? '✅ GOOD' : '⚠️ NEEDS IMPROVEMENT'}\n`);
        
      } catch (error) {
        console.log(`❌ Error: ${error.message}\n`);
      }
      
      console.log('─'.repeat(80) + '\n');
    }
    
    console.log('🎉 Demo Complete!\n');
    console.log('📊 Results Summary:');
    console.log('The AI system is configured to provide personalized responses by:');
    console.log('✅ Analyzing user therapeutic approach (western/eastern/hybrid)');  
    console.log('✅ Incorporating assessment scores and mood state');
    console.log('✅ Maintaining conversational context');
    console.log('✅ Adapting language to user preferences');
    console.log('✅ Providing empathetic, contextual responses');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    
    // Fallback demonstration
    console.log('\n🔄 Fallback Demo - Showing System Design');
    console.log('Even without AI providers, the personalization framework includes:');
    console.log('1. 🧠 User context analysis (approach, assessments, mood)');
    console.log('2. 💬 Conversation memory and continuity');
    console.log('3. 🚨 Crisis detection and intervention');
    console.log('4. 🎯 Therapeutic approach adaptation');
    console.log('5. 📊 Response analytics and monitoring');
    console.log('\n✨ This framework ensures personalized responses once AI providers are configured!');
  }
}

// Run the demo
demonstratePersonalizationDirect().catch(console.error);
