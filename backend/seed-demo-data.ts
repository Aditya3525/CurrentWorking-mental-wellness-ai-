import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_USER_EMAIL = 'demo.1760879584465@mentalwellness.app';

async function main() {
  console.log('🌱 Seeding demo user data...\n');
  
  // Find the demo user
  const user = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL }
  });
  
  if (!user) {
    console.log('❌ Demo user not found!');
    return;
  }
  
  console.log(`✅ Found demo user: ${user.name} (${user.id})\n`);
  
  // 1. Update user profile with complete information
  console.log('👤 Updating user profile...');
  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: 'Alex',
      lastName: 'Taylor',
      approach: 'hybrid',
      region: 'North America',
      isOnboarded: true,
      dataConsent: true
    }
  });
  console.log('✅ User profile updated\n');
  
  // 2. Add assessment results
  console.log('📊 Adding assessment results...');
  const assessments = [
    {
      userId: user.id,
      assessmentType: 'anxiety',
      score: 65,
      normalizedScore: 65,
      rawScore: 13,
      maxScore: 20,
      responses: JSON.stringify([
        { question: 'feeling_nervous', answer: 2 },
        { question: 'cant_stop_worrying', answer: 3 },
        { question: 'worrying_too_much', answer: 2 },
        { question: 'trouble_relaxing', answer: 3 },
        { question: 'restless', answer: 1 }
      ]),
      categoryScores: {
        physical: 60,
        cognitive: 70,
        emotional: 65
      },
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    },
    {
      userId: user.id,
      assessmentType: 'stress',
      score: 58,
      normalizedScore: 58,
      rawScore: 11,
      maxScore: 20,
      responses: JSON.stringify([
        { question: 'feeling_overwhelmed', answer: 2 },
        { question: 'difficulty_concentrating', answer: 2 },
        { question: 'irritable', answer: 3 },
        { question: 'sleep_issues', answer: 2 },
        { question: 'physical_tension', answer: 2 }
      ]),
      categoryScores: {
        work: 62,
        personal: 55,
        health: 57
      },
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    },
    {
      userId: user.id,
      assessmentType: 'emotionalIntelligence',
      score: 72,
      normalizedScore: 72,
      rawScore: 14,
      maxScore: 20,
      responses: JSON.stringify([
        { question: 'self_awareness', answer: 4 },
        { question: 'empathy', answer: 3 },
        { question: 'emotional_regulation', answer: 3 },
        { question: 'social_skills', answer: 4 }
      ]),
      categoryScores: {
        selfAwareness: 75,
        empathy: 70,
        regulation: 68,
        social: 75
      },
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    }
  ];
  
  for (const assessment of assessments) {
    await prisma.assessmentResult.create({ data: assessment });
  }
  console.log(`✅ Created ${assessments.length} assessment results\n`);
  
  // 3. Add mood entries for the past week
  console.log('😊 Adding mood entries...');
  const moods = [
    { mood: 'Great', notes: 'Had a great start to the week!', daysAgo: 6 },
    { mood: 'Anxious', notes: 'Work deadline approaching', daysAgo: 5 },
    { mood: 'Good', notes: 'Meditation helped today', daysAgo: 4 },
    { mood: 'Struggling', notes: 'Too much on my plate', daysAgo: 3 },
    { mood: 'Good', notes: 'Finished big project!', daysAgo: 2 },
    { mood: 'Okay', notes: 'Regular day', daysAgo: 1 },
    { mood: 'Great', notes: 'Feeling hopeful about the future', daysAgo: 0 }
  ];
  
  for (const moodData of moods) {
    const createdAt = new Date(Date.now() - moodData.daysAgo * 24 * 60 * 60 * 1000);
    await prisma.moodEntry.create({
      data: {
        userId: user.id,
        mood: moodData.mood,
        notes: moodData.notes,
        createdAt
      }
    });
  }
  console.log(`✅ Created ${moods.length} mood entries\n`);
  
  // 4. Add progress tracking entries
  console.log('📈 Adding progress tracking data...');
  const progressEntries = [
    { metric: 'anxiety', value: 70, daysAgo: 6 },
    { metric: 'anxiety', value: 68, daysAgo: 5 },
    { metric: 'anxiety', value: 65, daysAgo: 4 },
    { metric: 'anxiety', value: 63, daysAgo: 3 },
    { metric: 'anxiety', value: 65, daysAgo: 2 },
    { metric: 'anxiety', value: 62, daysAgo: 1 },
    { metric: 'anxiety', value: 60, daysAgo: 0 },
    { metric: 'stress', value: 65, daysAgo: 6 },
    { metric: 'stress', value: 62, daysAgo: 5 },
    { metric: 'stress', value: 60, daysAgo: 4 },
    { metric: 'stress', value: 58, daysAgo: 3 },
    { metric: 'stress', value: 55, daysAgo: 2 },
    { metric: 'stress', value: 58, daysAgo: 1 },
    { metric: 'stress', value: 56, daysAgo: 0 }
  ];
  
  for (const entry of progressEntries) {
    const date = new Date(Date.now() - entry.daysAgo * 24 * 60 * 60 * 1000);
    await prisma.progressTracking.create({
      data: {
        userId: user.id,
        metric: entry.metric,
        value: entry.value,
        date
      }
    });
  }
  console.log(`✅ Created ${progressEntries.length} progress tracking entries\n`);
  
  console.log('🎉 Demo data seeding complete!\n');
  console.log('Summary:');
  console.log('  ✅ User profile updated with complete information');
  console.log(`  ✅ ${assessments.length} assessment results`);
  console.log(`  ✅ ${moods.length} mood entries (past week)`);
  console.log(`  ✅ ${progressEntries.length} progress tracking points`);
  console.log('\n💡 Run the dashboard test again to see the improvements!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding demo data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
