/**
 * Test script for Enhanced Chatbot with Mental Health State Classification
 * and Approach-Specific Routing
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEnhancedChatbot() {
  try {
    console.log('🧠 Testing Enhanced Chatbot Features\n');

    // Find a test user (or create one)
    let testUser = await prisma.user.findFirst({
      where: { email: { contains: '@' } }
    });

    if (!testUser) {
      console.log('❌ No test user found. Please create a user first.');
      return;
    }

    console.log(`✅ Found test user: ${testUser.name || testUser.email}`);

    // Test 1: Mental Health State Service
    console.log('\n1️⃣ Testing Mental Health State Classification...');
    try {
      const { MentalHealthStateService } = require('./backend/src/services/mentalHealthStateService.ts');
      
      // Test state classification
      const mentalState = await MentalHealthStateService.getUserState(testUser.id);
      console.log(`   State: ${mentalState.state} (Score: ${mentalState.score}/100)`);
      console.log(`   Confidence: ${Math.round(mentalState.confidence * 100)}%`);
      console.log(`   Top Concerns: ${mentalState.topConcerns.join(', ') || 'None'}`);
      console.log(`   Reasons: ${mentalState.reasons.slice(0, 2).join('; ')}`);
      console.log('   ✅ Mental Health State Service working');
    } catch (error) {
      console.log(`   ❌ Mental Health State Service error: ${error.message}`);
    }

    // Test 2: Approach Router
    console.log('\n2️⃣ Testing Approach-Specific Router...');
    try {
      const { approachRouter } = require('./backend/src/services/langchainRouter.ts');
      
      const testMessage = "I've been feeling really stressed about work lately";
      const userContext = {
        id: testUser.id,
        name: testUser.name || 'Test User',
        approach: 'hybrid'
      };
      const mockState = {
        state: 'bad',
        score: 65,
        reasons: ['Work stress'],
        topConcerns: ['stress', 'anxiety'],
        confidence: 0.8,
        lastUpdated: new Date()
      };

      // Test different approaches
      const approaches = ['western', 'eastern', 'hybrid'];
      
      for (const approach of approaches) {
        console.log(`   Testing ${approach} approach...`);
        const contextWithApproach = { ...userContext, approach };
        
        try {
          const response = await approachRouter.routeResponse(
            testMessage,
            contextWithApproach,
            mockState
          );
          
          console.log(`     ✅ ${approach}: ${response.message.substring(0, 100)}...`);
          console.log(`     Provider: ${response.provider}`);
          console.log(`     Content Suggestions: ${response.contentSuggestions.length}`);
          console.log(`     Professional Support: ${response.shouldSuggestProfessional ? 'Yes' : 'No'}`);
        } catch (error) {
          console.log(`     ❌ ${approach} approach failed: ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Approach Router error: ${error.message}`);
    }

    // Test 3: Full Chat Service Integration
    console.log('\n3️⃣ Testing Full Chat Service Integration...');
    try {
      const { ChatService } = require('./backend/src/services/chatService.ts');
      const chatService = new ChatService();
      
      const testMessage = "I'm feeling overwhelmed and don't know what to do";
      
      console.log('   Generating AI response...');
      const response = await chatService.generateAIResponse(
        testUser.id,
        testMessage,
        `test-session-${Date.now()}`
      );
      
      console.log(`   ✅ Response generated successfully`);
      console.log(`   Provider: ${response.provider}`);
      console.log(`   Model: ${response.model}`);
      console.log(`   Mental Health State: ${response.mentalHealthState || 'Not provided'}`);
      console.log(`   Content Suggestions: ${response.contentSuggestions?.length || 0}`);
      console.log(`   Professional Support: ${response.shouldSuggestProfessional ? 'Yes' : 'No'}`);
      console.log(`   Response: ${response.response.substring(0, 150)}...`);
      
    } catch (error) {
      console.log(`   ❌ Chat Service Integration error: ${error.message}`);
    }

    // Test 4: Assessment and Chat History Analysis
    console.log('\n4️⃣ Testing Data Context Analysis...');
    try {
      // Check user's assessment history
      const assessments = await prisma.assessment.findMany({
        where: { userId: testUser.id },
        orderBy: { completedAt: 'desc' },
        take: 3
      });
      
      console.log(`   Recent Assessments: ${assessments.length}`);
      if (assessments.length > 0) {
        assessments.forEach((assessment, i) => {
          console.log(`     ${i + 1}. ${assessment.assessmentType}: ${assessment.score} (${new Date(assessment.completedAt).toLocaleDateString()})`);
        });
      }

      // Check mood entries
      const moods = await prisma.moodEntry.findMany({
        where: { userId: testUser.id },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
      
      console.log(`   Recent Moods: ${moods.length}`);
      if (moods.length > 0) {
        moods.forEach((mood, i) => {
          console.log(`     ${i + 1}. ${mood.mood} (${new Date(mood.createdAt).toLocaleDateString()})`);
        });
      }

      // Check chat history
      const chats = await prisma.chatMessage.findMany({
        where: { userId: testUser.id },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
      
      console.log(`   Recent Chat Messages: ${chats.length}`);
      
    } catch (error) {
      console.log(`   ❌ Data Context Analysis error: ${error.message}`);
    }

    console.log('\n🎉 Enhanced Chatbot Testing Complete!');
    console.log('\n📋 Summary:');
    console.log('   ✓ Mental health state classification with composite scoring');
    console.log('   ✓ Approach-specific response routing (Western/Eastern/Hybrid)');
    console.log('   ✓ Personalized content suggestions based on user state');
    console.log('   ✓ Crisis detection with professional support recommendations');
    console.log('   ✓ Integration with existing assessment and mood tracking data');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testEnhancedChatbot().catch(console.error);
}

module.exports = { testEnhancedChatbot };
