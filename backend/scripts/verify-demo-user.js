const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyDemoUser() {
  console.log('🔍 Verifying demo user data...\n');

  const user = await prisma.user.findUnique({
    where: { email: 'demo@mentalwellness.app' },
    include: {
      assessments: true,
      moodEntries: true,
      chatMessages: true,
      conversationMemory: true,
      progressTracking: true,
    }
  });

  if (!user) {
    console.log('❌ Demo user not found!');
    return;
  }

  console.log('✅ Demo User Found!\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('👤 USER PROFILE');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Name: ${user.name}`);
  console.log(`Email: ${user.email}`);
  console.log(`First Name: ${user.firstName}`);
  console.log(`Last Name: ${user.lastName}`);
  console.log(`Age: ${new Date().getFullYear() - new Date(user.birthday).getFullYear()} years`);
  console.log(`Gender: ${user.gender}`);
  console.log(`Region: ${user.region}`);
  console.log(`Approach: ${user.approach}`);
  console.log(`Onboarded: ${user.isOnboarded ? '✅' : '❌'}`);
  console.log(`Emergency Contact: ${user.emergencyContact} (${user.emergencyPhone})`);
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 DATA SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Assessments: ${user.assessments.length}`);
  console.log(`Mood Entries: ${user.moodEntries.length}`);
  console.log(`Chat Messages: ${user.chatMessages.length}`);
  console.log(`Progress Tracking: ${user.progressTracking.length}`);
  console.log(`Conversation Memory: ${user.conversationMemory ? '✅' : '❌'}`);
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📋 ASSESSMENT BREAKDOWN');
  console.log('═══════════════════════════════════════════════════════');
  
  const assessmentTypes = {};
  user.assessments.forEach(a => {
    if (!assessmentTypes[a.assessmentType]) {
      assessmentTypes[a.assessmentType] = [];
    }
    assessmentTypes[a.assessmentType].push(a.score);
  });
  
  Object.entries(assessmentTypes).forEach(([type, scores]) => {
    const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
    const trend = scores.length > 1 ? 
      (scores[scores.length - 1] < scores[0] ? '📉 Improving' : '📈 Increasing') : 
      '—';
    console.log(`${type}: ${scores.length}x completions, avg: ${avg}%, ${trend}`);
  });
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('😊 MOOD PROGRESSION');
  console.log('═══════════════════════════════════════════════════════');
  
  const moodCounts = {};
  user.moodEntries.forEach(m => {
    moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
  });
  
  Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).forEach(([mood, count]) => {
    const percentage = ((count / user.moodEntries.length) * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(count / 2));
    console.log(`${mood.padEnd(12)} ${count.toString().padStart(2)}x (${percentage.padStart(5)}%) ${bar}`);
  });
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('💬 CHAT ACTIVITY');
  console.log('═══════════════════════════════════════════════════════');
  
  const userMessages = user.chatMessages.filter(m => m.type === 'user').length;
  const assistantMessages = user.chatMessages.filter(m => m.type === 'assistant').length;
  
  console.log(`User messages: ${userMessages}`);
  console.log(`Assistant messages: ${assistantMessages}`);
  console.log(`Total: ${user.chatMessages.length}`);
  console.log(`First message: ${new Date(user.chatMessages[0]?.createdAt).toLocaleDateString()}`);
  console.log(`Last message: ${new Date(user.chatMessages[user.chatMessages.length - 1]?.createdAt).toLocaleDateString()}`);
  
  if (user.conversationMemory) {
    const topics = JSON.parse(user.conversationMemory.topics || '{}');
    const patterns = JSON.parse(user.conversationMemory.emotionalPatterns || '{}');
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🧠 CONVERSATION MEMORY');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Topics tracked: ${Object.keys(topics).length}`);
    console.log(`Primary emotions: ${patterns.primaryEmotions?.join(', ') || 'N/A'}`);
    console.log(`Coping strategies: ${patterns.copingStrategies?.length || 0}`);
    console.log(`Triggers identified: ${patterns.triggers?.length || 0}`);
  }
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📈 PROGRESS METRICS');
  console.log('═══════════════════════════════════════════════════════');
  
  const metrics = {};
  user.progressTracking.forEach(p => {
    if (!metrics[p.metric]) {
      metrics[p.metric] = { count: 0, avg: 0, values: [] };
    }
    metrics[p.metric].count++;
    metrics[p.metric].values.push(p.value);
  });
  
  Object.entries(metrics).forEach(([metric, data]) => {
    const avg = (data.values.reduce((a, b) => a + b, 0) / data.count).toFixed(2);
    const first = data.values[0];
    const last = data.values[data.values.length - 1];
    const trend = last > first ? '📈' : last < first ? '📉' : '—';
    console.log(`${metric.padEnd(20)} ${data.count.toString().padStart(3)} entries, avg: ${avg}, ${trend}`);
  });
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✨ VERIFICATION COMPLETE');
  console.log('═══════════════════════════════════════════════════════\n');
  
  await prisma.$disconnect();
}

verifyDemoUser().catch(console.error);
