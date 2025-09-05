import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample content if empty
  const contentCount = await prisma.content.count();
  if (contentCount === 0) {
    await prisma.content.createMany({
      data: [
        {
          title: '5-Minute Grounding Meditation',
          type: 'audio',
          category: 'mindfulness',
          approach: 'eastern',
          content: 'https://example.com/audio/grounding.mp3',
          duration: '5m',
          difficulty: 'Beginner',
          tags: 'meditation,grounding,mindfulness',
          isPublished: true
        },
        {
          title: 'CBT Thought Reframing Basics',
            type: 'article',
            category: 'anxiety',
            approach: 'western',
            content: 'Cognitive Behavioral Therapy (CBT) helps you identify and challenge unhelpful thought patterns...',
            duration: '7m',
            difficulty: 'Beginner',
            tags: 'cbt,thoughts,anxiety',
            isPublished: true
        },
        {
          title: 'Hybrid Daily Balance Practice',
          type: 'exercise',
          category: 'wellbeing',
          approach: 'hybrid',
          content: '{"steps":["2m breath focus","3m gentle stretch","2m gratitude jot"]}',
          duration: '10m',
          difficulty: 'Beginner',
          tags: 'balance,hybrid,daily',
          isPublished: true
        }
      ]
    });
    console.log('✅ Seeded content');
  }

  // Create plan modules if empty
  const moduleCount = await prisma.planModule.count();
  if (moduleCount === 0) {
    await prisma.planModule.createMany({
      data: [
        {
          title: 'Intro CBT Reflection',
          type: 'therapy',
          duration: '10m',
          difficulty: 'Beginner',
          description: 'Identify automatic thoughts and reframe one.',
          content: '{"exercise":"Write a recent triggering thought and reframe it"}',
          approach: 'western',
          order: 1
        },
        {
          title: 'Calm Breathing Practice',
          type: 'meditation',
          duration: '8m',
          difficulty: 'Beginner',
          description: 'Guided diaphragmatic breathing to reduce stress.',
          content: '{"audio":"https://example.com/audio/calm-breathing.mp3"}',
          approach: 'eastern',
          order: 1
        },
        {
          title: 'Hybrid Morning Centering',
          type: 'therapy',
          duration: '12m',
          difficulty: 'Beginner',
          description: 'Combine two CBT reframes with short mindfulness.',
          content: '{"sequence":["2m breath","CBT thought log","2m gratitude"]}',
          approach: 'hybrid',
          order: 1
        }
      ]
    });
    console.log('✅ Seeded plan modules');
  }

  console.log('🌱 Seed complete');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
