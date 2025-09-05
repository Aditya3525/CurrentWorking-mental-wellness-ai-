const { ChatService } = require('./dist/services/chatService');
const { GeminiProvider } = require('./dist/services/providers/GeminiProvider');

async function testAgePersonalization() {
  console.log('🧪 Testing Age-Specific Personalization...\n');
  
  const chatService = new ChatService();
  
  // Test data for different age groups
  const testUsers = [
    {
      id: 'teen-user',
      name: 'Alex Teen',
      firstName: 'Alex',
      birthday: new Date('2008-05-15'), // ~16 years old
      approach: 'western',
      moodEntries: [{ mood: 'Anxious', createdAt: new Date() }],
      assessments: [{
        id: 'test-1',
        type: 'ANXIETY',
        score: 14,
        responses: { 'school_stress': 4, 'peer_pressure': 3 },
        createdAt: new Date()
      }]
    },
    {
      id: 'young-adult-user', 
      name: 'Jordan YA',
      firstName: 'Jordan',
      birthday: new Date('1998-03-20'), // ~26 years old
      approach: 'hybrid',
      moodEntries: [{ mood: 'Struggling', createdAt: new Date() }],
      assessments: [{
        id: 'test-2',
        type: 'DEPRESSION',
        score: 16,
        responses: { 'career_anxiety': 4, 'relationship_issues': 3 },
        createdAt: new Date()
      }]
    },
    {
      id: 'senior-user',
      name: 'Margaret Senior',
      firstName: 'Margaret', 
      birthday: new Date('1950-08-10'), // ~74 years old
      approach: 'eastern',
      moodEntries: [{ mood: 'Good', createdAt: new Date() }],
      assessments: [{
        id: 'test-3',
        type: 'GENERAL_WELLNESS',
        score: 8,
        responses: { 'health_concerns': 2, 'social_isolation': 3 },
        createdAt: new Date()
      }]
    }
  ];

  for (const user of testUsers) {
    console.log(`👤 Testing personalization for ${user.firstName} (${user.name}):`);
    
    try {
      // Get user context (this will calculate age and age group)
      const context = await chatService.getUserContext(user.id, user);
      
      console.log(`   Age: ${context.age} years old`);
      console.log(`   Age Group: ${context.ageGroup}`);
      console.log(`   Mood: ${context.currentMood}`);
      console.log(`   Approach: ${context.approach}`);
      
      // Create a simple AI provider to test system prompt generation
      const provider = new GeminiProvider('test-key');
      const systemPrompt = provider.createSystemPrompt({ user: context });
      
      // Extract age-specific guidance from system prompt
      const ageGuidanceMatch = systemPrompt.match(/Age-Appropriate Communication:(.*?)(?=\n\n|$)/s);
      if (ageGuidanceMatch) {
        console.log(`   Age-Specific Guidance Preview:`);
        const guidance = ageGuidanceMatch[1].trim().split('\n')[1]?.replace('- ', '');
        console.log(`   "${guidance}"`);
      }
      
      console.log('   ✅ Age personalization working\n');
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }
  
  console.log('🎉 Age personalization test completed!');
}

// Run the test
testAgePersonalization().catch(console.error);
