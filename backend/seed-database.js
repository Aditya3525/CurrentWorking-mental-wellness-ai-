/**
 * Sample data seeder for Mental Health AI Assistant
 * This will populate the database with realistic test data
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedDatabase() {
  console.log('🌱 Seeding database with sample data...');

  try {
    // Clear existing data first (in correct order due to foreign key constraints)
    console.log('🧹 Clearing existing data...');
    await prisma.escalationReport.deleteMany({});
    await prisma.contentRecommendation.deleteMany({});
    await prisma.content.deleteMany({});
    await prisma.userActivity.deleteMany({});
    await prisma.aIContext.deleteMany({});
    await prisma.chatMessage.deleteMany({});
    await prisma.moodEntry.deleteMany({});
    await prisma.assessmentMedia.deleteMany({});
    await prisma.assessmentVersion.deleteMany({});
    await prisma.assessment.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('✅ Existing data cleared');

    // 1. Create sample users
    console.log('👥 Creating sample users...');
    
    const user1 = await prisma.user.create({
      data: {
        email: 'alice@example.com',
        name: 'Alice Johnson',
        firstName: 'Alice',
        lastName: 'Johnson',
        isOnboarded: true,
        approach: 'western',
        birthday: new Date('1992-05-15'),
        gender: 'female',
        region: 'North America',
        language: 'en',
        emergencyContact: 'John Johnson',
        emergencyPhone: '+1-555-0123',
        dataConsent: true,
        clinicianSharing: false
      }
    });

    const user2 = await prisma.user.create({
      data: {
        email: 'bob@example.com',
        name: 'Bob Chen',
        firstName: 'Bob',
        lastName: 'Chen',
        isOnboarded: true,
        approach: 'eastern',
        birthday: new Date('1988-11-20'),
        gender: 'male',
        region: 'Asia',
        language: 'en',
        emergencyContact: 'Lisa Chen',
        emergencyPhone: '+1-555-0456',
        dataConsent: true,
        clinicianSharing: true
      }
    });

    const user3 = await prisma.user.create({
      data: {
        email: 'emma@example.com',
        name: 'Emma Rodriguez',
        firstName: 'Emma',
        lastName: 'Rodriguez',
        isOnboarded: true,
        approach: 'hybrid',
        birthday: new Date('1995-03-08'),
        gender: 'female',
        region: 'South America',
        language: 'en',
        emergencyContact: 'Maria Rodriguez',
        emergencyPhone: '+1-555-0789',
        dataConsent: true,
        clinicianSharing: false
      }
    });

    console.log('✅ Created 3 sample users');

    // 2. Create sample assessments
    console.log('📝 Creating sample assessments...');
    
    const assessment1 = await prisma.assessment.create({
      data: {
        userId: user1.id,
        assessmentType: 'PHQ-9',
        responses: JSON.stringify({
          "q1": 2, "q2": 1, "q3": 2, "q4": 1, "q5": 0,
          "q6": 1, "q7": 2, "q8": 1, "q9": 0
        }),
        score: 68,
        aiInsights: JSON.stringify({
          classification: 'managing',
          primaryConcerns: ['work stress', 'sleep issues'],
          strengthsIdentified: ['good social support', 'self-awareness'],
          recommendedInterventions: ['CBT techniques', 'sleep hygiene'],
          riskFactors: ['work pressure'],
          protectiveFactors: ['strong relationships', 'exercise routine']
        }),
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        isLatest: true
      }
    });

    const assessment2 = await prisma.assessment.create({
      data: {
        userId: user2.id,
        assessmentType: 'GAD-7',
        responses: JSON.stringify({
          "q1": 1, "q2": 2, "q3": 1, "q4": 0, "q5": 1, "q6": 2, "q7": 1
        }),
        score: 72,
        aiInsights: JSON.stringify({
          classification: 'thriving',
          primaryConcerns: ['mild anxiety'],
          strengthsIdentified: ['mindfulness practice', 'emotional regulation'],
          recommendedInterventions: ['meditation', 'breathing exercises'],
          riskFactors: ['perfectionism'],
          protectiveFactors: ['regular meditation', 'balanced lifestyle']
        }),
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        isLatest: true
      }
    });

    const assessment3 = await prisma.assessment.create({
      data: {
        userId: user3.id,
        assessmentType: 'DASS-21',
        responses: JSON.stringify({
          "depression": [1, 0, 2, 1, 1, 0, 1],
          "anxiety": [2, 1, 2, 1, 0, 2, 1],
          "stress": [2, 2, 1, 2, 1, 1, 2]
        }),
        score: 65,
        aiInsights: JSON.stringify({
          classification: 'managing',
          primaryConcerns: ['stress management', 'work-life balance'],
          strengthsIdentified: ['adaptability', 'problem-solving'],
          recommendedInterventions: ['stress reduction techniques', 'boundary setting'],
          riskFactors: ['high workload', 'perfectionist tendencies'],
          protectiveFactors: ['creative outlets', 'supportive family']
        }),
        completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        isLatest: true
      }
    });

    console.log('✅ Created 3 sample assessments');

    // 3. Create sample mood entries
    console.log('😊 Creating sample mood entries...');
    
    const moodEntries = [];
    for (let i = 0; i < 7; i++) {
      // Alice's mood entries - showing improvement over week
      moodEntries.push(
        await prisma.moodEntry.create({
          data: {
            userId: user1.id,
            mood: ['Anxious', 'Okay', 'Good', 'Great', 'Great', 'Good', 'Great'][i],
            notes: [
              'Feeling overwhelmed with work',
              'Had a good conversation with friend',
              'Exercised today, feeling better',
              'Great therapy session',
              'Accomplished a lot today',
              'Tired but content',
              'Weekend relaxation helped'
            ][i],
            createdAt: new Date(Date.now() - (6-i) * 24 * 60 * 60 * 1000)
          }
        })
      );

      // Bob's mood entries - consistently good with eastern practices
      if (i < 5) {
        moodEntries.push(
          await prisma.moodEntry.create({
            data: {
              userId: user2.id,
              mood: ['Good', 'Great', 'Great', 'Good', 'Great'][i],
              notes: [
                'Morning meditation was peaceful',
                'Mindfulness practice helped with stress',
                'Feeling balanced and centered',
                'Good day for reflection',
                'Grateful for small moments'
              ][i],
              createdAt: new Date(Date.now() - (4-i) * 24 * 60 * 60 * 1000)
            }
          })
        );
      }
    }

    console.log('✅ Created mood entries for past week');

    // 4. Create sample chat messages
    console.log('💬 Creating sample chat conversations...');
    
    // Alice's conversation - showing progression
    const aliceMessages = [
      {
        type: 'user',
        content: "I've been feeling really overwhelmed at work lately. I can't seem to manage my stress levels.",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
      },
      {
        type: 'bot',
        content: "I understand that work stress can feel overwhelming. It sounds like you're dealing with a lot right now. Let's explore some cognitive behavioral techniques that might help you manage these feelings. Can you tell me what specific aspects of work are causing you the most stress?",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000 + 30000)
      },
      {
        type: 'user',
        content: "It's mostly the deadlines and the pressure to perform perfectly. I feel like I'm never doing enough.",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000)
      },
      {
        type: 'bot',
        content: "Those perfectionist thoughts can be really challenging. In CBT, we call these 'all-or-nothing' thinking patterns. Let's work on reframing this: instead of 'I'm never doing enough,' what if we tried 'I'm doing my best with the resources and time I have'? What comes up for you when you hear that alternative thought?",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000 + 45000)
      },
      {
        type: 'user',
        content: "That actually feels a bit more manageable. Maybe I have been too hard on myself.",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      }
    ];

    for (const msg of aliceMessages) {
      await prisma.chatMessage.create({
        data: {
          userId: user1.id,
          type: msg.type,
          content: msg.content,
          createdAt: msg.timestamp,
          sessionId: 'session-alice-001'
        }
      });
    }

    // Bob's conversation - eastern approach
    const bobMessages = [
      {
        type: 'user',
        content: "I want to deepen my mindfulness practice. Sometimes I feel like I'm just going through the motions.",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        type: 'bot',
        content: "It's beautiful that you're seeking to deepen your practice. This awareness itself is a sign of growth. In mindfulness, we often talk about 'beginner's mind' - approaching each moment with fresh curiosity. What draws you to want a deeper connection with your practice?",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30000)
      },
      {
        type: 'user',
        content: "I want to feel more present in my daily life, not just during meditation.",
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000)
      },
      {
        type: 'bot',
        content: "That's a profound intention. Consider this: mindfulness isn't limited to sitting practice. Try bringing mindful awareness to one routine activity today - perhaps drinking your morning tea or walking. Notice the sensations, the breath, the present moment. How does this resonate with you?",
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000 + 45000)
      }
    ];

    for (const msg of bobMessages) {
      await prisma.chatMessage.create({
        data: {
          userId: user2.id,
          type: msg.type,
          content: msg.content,
          createdAt: msg.timestamp,
          sessionId: 'session-bob-001'
        }
      });
    }

    console.log('✅ Created sample chat conversations');

    // 5. Create sample AI context data
    console.log('🤖 Creating AI context data...');
    
    await prisma.aIContext.create({
      data: {
        userId: user1.id,
        sessionId: 'session-alice-001',
        contextType: 'conversation',
        contextData: JSON.stringify({
          approach: 'western',
          topics: ['work stress', 'perfectionism', 'CBT techniques'],
          sentiment: 'improving',
          lastMentalHealthScore: 68,
          keyInsights: ['responds well to cognitive reframing', 'perfectionist tendencies']
        }),
        tokenCount: 450,
        priority: 1
      }
    });

    await prisma.aIContext.create({
      data: {
        userId: user2.id,
        sessionId: 'session-bob-001',
        contextType: 'conversation',
        contextData: JSON.stringify({
          approach: 'eastern',
          topics: ['mindfulness', 'meditation', 'presence'],
          sentiment: 'stable',
          lastMentalHealthScore: 72,
          keyInsights: ['dedicated practitioner', 'seeks deeper connection']
        }),
        tokenCount: 320,
        priority: 1
      }
    });

    console.log('✅ Created AI context data');

    // 6. Create sample content first
    console.log('📚 Creating sample content...');
    
    const content1 = await prisma.content.create({
      data: {
        id: 'cbt-stress-001',
        title: 'CBT Techniques for Work Stress',
        type: 'article',
        category: 'stress-management',
        approach: 'western',
        content: JSON.stringify({
          sections: [
            { title: 'Understanding Work Stress', content: 'Work stress is a common experience that affects millions of people. Learning to identify triggers and responses is the first step toward managing it effectively.' },
            { title: 'Cognitive Reframing', content: 'Learn to identify and challenge negative thought patterns that contribute to work stress. Practice replacing catastrophic thoughts with more balanced perspectives.' }
          ]
        }),
        difficulty: 'Beginner',
        duration: '15 minutes',
        tags: 'stress,CBT,workplace,techniques',
        isPublished: true
      }
    });

    const content2 = await prisma.content.create({
      data: {
        id: 'perfectionism-guide',
        title: 'Overcoming Perfectionism: A Practical Guide',
        type: 'guide',
        category: 'cognitive-patterns',
        approach: 'western',
        content: JSON.stringify({
          sections: [
            { title: 'What is Perfectionism?', content: 'Perfectionism is more than just having high standards. It involves setting unrealistically high expectations and being overly critical of mistakes.' },
            { title: 'The Cost of Perfectionism', content: 'Understanding how perfectionism can lead to anxiety, procrastination, and decreased performance.' }
          ]
        }),
        difficulty: 'Intermediate',
        duration: '25 minutes',
        tags: 'perfectionism,CBT,self-improvement',
        isPublished: true
      }
    });

    const content3 = await prisma.content.create({
      data: {
        id: 'mindful-living-002',
        title: 'Bringing Mindfulness to Daily Activities',
        type: 'meditation',
        category: 'mindfulness',
        approach: 'eastern',
        content: JSON.stringify({
          exercises: [
            { name: 'Mindful Walking', duration: '10 minutes', instructions: 'Focus on each step, feeling your feet connect with the ground.' },
            { name: 'Mindful Eating', duration: '15 minutes', instructions: 'Eat slowly, savoring each bite and noticing textures and flavors.' }
          ]
        }),
        difficulty: 'Beginner',
        duration: '20 minutes',
        tags: 'mindfulness,daily-life,meditation',
        isPublished: true
      }
    });

    console.log('✅ Created sample content');

    // 7. Create sample content recommendations
    console.log('🎯 Creating content recommendations...');
    
    await prisma.contentRecommendation.create({
      data: {
        userId: user1.id,
        contentId: content1.id,
        contentType: 'article',
        reason: 'Recommended based on your recent assessment and conversation topics',
        relevanceScore: 0.92,
        priority: 1,
        category: 'stress-management',
        personalizedTitle: 'CBT Techniques for Your Work Stress',
        estimatedBenefit: 0.85,
        viewed: false
      }
    });

    await prisma.contentRecommendation.create({
      data: {
        userId: user1.id,
        contentId: content2.id,
        contentType: 'guide',
        reason: 'Matches your identified thinking patterns',
        relevanceScore: 0.88,
        priority: 2,
        category: 'cognitive-patterns',
        personalizedTitle: 'Your Guide to Overcoming Perfectionism',
        estimatedBenefit: 0.82,
        viewed: false
      }
    });

    await prisma.contentRecommendation.create({
      data: {
        userId: user2.id,
        contentId: content3.id,
        contentType: 'meditation',
        reason: 'Supports your goal of deepening mindfulness practice',
        relevanceScore: 0.95,
        priority: 1,
        category: 'mindfulness',
        personalizedTitle: 'Deepen Your Mindful Living Practice',
        estimatedBenefit: 0.90,
        viewed: false
      }
    });

    console.log('✅ Created content recommendations');

    // 7. Create sample user activities (audit log)
    console.log('📊 Creating user activity logs...');
    
    const activities = [
      {
        userId: user1.id,
        action: 'assessment_completed',
        details: JSON.stringify({ type: 'PHQ-9', score: 68 }),
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        userId: user1.id,
        action: 'chat_message_sent',
        details: JSON.stringify({ approach: 'western', topic: 'work stress' }),
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
      },
      {
        userId: user2.id,
        action: 'assessment_completed',
        details: JSON.stringify({ type: 'GAD-7', score: 72 }),
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        userId: user2.id,
        action: 'mood_entry_created',
        details: JSON.stringify({ mood: 'great', score: 82 }),
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      }
    ];

    for (const activity of activities) {
      await prisma.userActivity.create({
        data: {
          userId: activity.userId,
          action: activity.action,
          details: activity.details,
          timestamp: activity.timestamp
        }
      });
    }

    console.log('✅ Created user activity logs');

    // 8. Create a sample escalation report (for testing crisis detection)
    console.log('🚨 Creating sample escalation report...');
    
    await prisma.escalationReport.create({
      data: {
        userId: user3.id,
        sessionId: 'session-emma-crisis-001',
        escalationLevel: 'concern',
        triggerReasons: JSON.stringify(['mentions of hopelessness', 'concerning language patterns']),
        userMessage: 'Sometimes I feel like giving up on everything. Nothing seems to matter anymore.',
        agentResponse: 'I hear that you\'re going through a really difficult time right now. Your feelings are valid, and I want you to know that you\'re not alone. Let\'s talk about some ways to get you additional support.',
        mentalHealthState: JSON.stringify({
          score: 45,
          classification: 'struggling',
          riskFactors: ['hopelessness', 'low mood']
        }),
        recommendedActions: JSON.stringify([
          'Schedule check-in within 24 hours',
          'Provide crisis resources',
          'Monitor conversation patterns closely',
          'Consider referral to mental health professional'
        ]),
        status: 'pending',
        followUpRequired: true,
        notificationSent: true
      }
    });

    console.log('✅ Created sample escalation report');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary of created data:');
    console.log('- 3 Users (Alice, Bob, Emma)');
    console.log('- 3 Mental Health Assessments');
    console.log('- 12 Mood Entries (7 days for Alice, 5 days for Bob)');
    console.log('- 2 Chat Conversations with AI assistant');
    console.log('- 2 AI Context records');
    console.log('- 3 Content Recommendations');
    console.log('- 4 User Activity logs');
    console.log('- 1 Crisis Escalation Report');
    console.log('\n✨ You can now test the chatbot and explore the data in Prisma Studio!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();
