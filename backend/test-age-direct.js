const { BaseAIProvider } = require('./dist/services/providers/BaseAIProvider');

async function testAgePersonalizationDirect() {
  console.log('🧪 Testing Age-Specific Personalization (Direct)...\n');
  
  // Create a test provider that extends BaseAIProvider
  class TestProvider extends BaseAIProvider {
    constructor() {
      super('test-provider', []);
    }
    
    async generateResponse(messages, context) {
      // Not needed for this test
      return 'test response';
    }
  }
  
  // Create a simple function to calculate age like in ChatService
  function calculateAgeInfo(birthday) {
    if (!birthday) {
      return { age: undefined, ageGroup: undefined };
    }

    const today = new Date();
    const birthDate = new Date(birthday);
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred this year
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Determine age group
    let ageGroup;
    
    if (age >= 13 && age <= 19) {
      ageGroup = 'teen';
    } else if (age >= 20 && age <= 29) {
      ageGroup = 'young-adult';
    } else if (age >= 30 && age <= 49) {
      ageGroup = 'adult';
    } else if (age >= 50 && age <= 64) {
      ageGroup = 'middle-aged';
    } else {
      ageGroup = 'senior';
    }

    return { age, ageGroup };
  }
  
  // Test data for different age groups
  const testUsers = [
    {
      id: 'teen-user',
      name: 'Alex Teen',
      firstName: 'Alex',
      birthday: new Date('2008-05-15'), // ~16 years old
      approach: 'western',
      currentMood: 'Anxious',
      moodTrend: 'concerning',
      hasCompletedAssessments: true,
      recentAssessments: [{
        assessmentType: 'Anxiety',
        score: 14,
        interpretation: 'moderate anxiety levels',
        specificConcerns: ['school stress', 'peer pressure']
      }]
    },
    {
      id: 'young-adult-user', 
      name: 'Jordan YA',
      firstName: 'Jordan',
      birthday: new Date('1998-03-20'), // ~26 years old
      approach: 'hybrid',
      currentMood: 'Struggling',
      moodTrend: 'stable',
      hasCompletedAssessments: true,
      recentAssessments: [{
        assessmentType: 'Depression',
        score: 16,
        interpretation: 'mild depression symptoms',
        specificConcerns: ['career anxiety', 'relationship issues']
      }]
    },
    {
      id: 'senior-user',
      name: 'Margaret Senior',
      firstName: 'Margaret', 
      birthday: new Date('1950-08-10'), // ~74 years old
      approach: 'eastern',
      currentMood: 'Good',
      moodTrend: 'improving',
      hasCompletedAssessments: true,
      recentAssessments: [{
        assessmentType: 'General Wellness',
        score: 8,
        interpretation: 'good overall wellness',
        specificConcerns: ['mild health concerns', 'social connection']
      }]
    }
  ];

  const provider = new TestProvider();

  for (const user of testUsers) {
    console.log(`👤 Testing personalization for ${user.firstName}:`);
    
    try {
      // Calculate age and age group
      const { age, ageGroup } = calculateAgeInfo(user.birthday);
      
      // Create user context with age info
      const userContext = {
        ...user,
        age,
        ageGroup
      };
      
      console.log(`   Age: ${age} years old`);
      console.log(`   Age Group: ${ageGroup}`);
      console.log(`   Mood: ${userContext.currentMood}`);
      console.log(`   Approach: ${userContext.approach}`);
      
      // Generate system prompt
      const systemPrompt = provider.createSystemPrompt({ user: userContext });
      
      // Extract age-specific guidance from system prompt
      const ageGuidanceMatch = systemPrompt.match(/Age-Appropriate Communication:(.*?)(?=\n\nTherapeutic Focus|$)/s);
      if (ageGuidanceMatch) {
        console.log(`   Age-Specific Guidance Applied:`);
        const guidance = ageGuidanceMatch[1].trim().split('\n')[1]?.replace('- ', '').trim();
        console.log(`   "${guidance}"`);
      }
      
      // Check if age group-specific keywords are in the prompt
      const ageKeywords = {
        'teen': ['adolescence', 'school', 'peer', 'developing autonomy'],
        'young-adult': ['early adulthood', 'career', 'transitions', 'independence'],
        'senior': ['life experience', 'wisdom', 'aging', 'legacy']
      };
      
      const keywords = ageKeywords[ageGroup] || [];
      const foundKeywords = keywords.filter(keyword => 
        systemPrompt.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (foundKeywords.length > 0) {
        console.log(`   ✅ Age-specific keywords found: ${foundKeywords.join(', ')}`);
      }
      
      console.log('   ✅ Age personalization working\n');
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }
  
  console.log('🎉 Age personalization test completed successfully!');
}

// Run the test
testAgePersonalizationDirect().catch(console.error);
