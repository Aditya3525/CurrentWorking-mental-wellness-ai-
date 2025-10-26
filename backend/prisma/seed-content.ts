import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');
  
  // Seed public content
  console.log('📄 Seeding public content...');
  try {
    const contentItems = await prisma.content.createMany({
      data: [
        {
          title: "Understanding Anxiety Basics",
          type: "article",
          category: "anxiety",
          approach: "hybrid",
          description: "Core concepts about anxiety and how to approach it.",
          content: "Anxiety is a natural response to stress. Learn to recognize it and manage it effectively. This article covers breathing techniques, cognitive reframing, and when to seek professional help.",
          tags: "anxiety,basics,education",
          isPublished: true
        },
        {
          title: "Guided Body Scan Meditation",
          type: "audio",
          category: "relaxation",
          approach: "hybrid",
          description: "Full-body awareness practice for grounding and calm.",
          content: "/audio/body-scan.mp3",
          duration: 900, // 15 minutes in seconds
          tags: "meditation,relaxation,body-scan",
          isPublished: true
        },
        {
          title: "Mindful Minute Video",
          type: "video",
          category: "mindfulness",
          approach: "eastern",
          description: "A one-minute reset to center your thoughts.",
          content: "https://youtube.com/watch?v=mindful-minute",
          youtubeUrl: "https://youtube.com/watch?v=mindful-minute",
          duration: 60, // 1 minute in seconds
          tags: "mindfulness,quick,video",
          isPublished: true
        },
        {
          title: "CBT Thought Tracking Worksheet",
          type: "article",
          category: "cbt",
          approach: "western",
          description: "Learn to identify and challenge cognitive distortions.",
          content: "Cognitive Behavioral Therapy teaches us to recognize automatic thoughts and challenge them. Use this worksheet to track your thoughts, identify patterns, and develop healthier thinking habits.",
          tags: "cbt,worksheet,cognitive",
          isPublished: true
        },
        {
          title: "Sleep Hygiene Guide",
          type: "article",
          category: "sleep",
          approach: "western",
          description: "Practical tips for better sleep quality.",
          content: "Good sleep hygiene involves consistent routines, comfortable environment, and relaxation techniques. Learn about optimal sleep temperature, light exposure, and pre-bed rituals.",
          tags: "sleep,hygiene,tips",
          isPublished: true
        }
      ]
    });
    console.log(`✅ Created ${contentItems.count} content items\n`);
  } catch (error) {
    console.error('⚠️  Error seeding content (may already exist):', error instanceof Error ? error.message : error);
  }
  
  // Seed practices
  console.log('🧘 Seeding practices...');
  try {
    const practices = await prisma.practice.createMany({
      data: [
        {
          title: "Calm Breathing Intro",
          description: "4-7-8 breathing technique for instant calm",
          duration: 5,
          type: "breathing",
          category: "BREATHING",
          difficulty: "beginner",
          approach: "hybrid",
          format: "Audio",
          isPublished: true
        },
        {
          title: "Evening Sleep Preparation",
          description: "Wind down ritual for better sleep",
          duration: 10,
          type: "sleep",
          category: "SLEEP_HYGIENE",
          difficulty: "beginner",
          approach: "western",
          format: "Audio",
          isPublished: true
        },
        {
          title: "Morning Yoga Flow",
          description: "Energizing gentle yoga sequence",
          duration: 15,
          type: "yoga",
          category: "MOVEMENT",
          difficulty: "intermediate",
          approach: "eastern",
          format: "Video",
          isPublished: true
        },
        {
          title: "Mindful Walking",
          description: "Walking meditation practice",
          duration: 20,
          type: "meditation",
          category: "MINDFULNESS",
          difficulty: "beginner",
          approach: "eastern",
          format: "Audio",
          isPublished: true
        },
        {
          title: "Loving-Kindness Meditation",
          description: "Cultivate compassion for self and others",
          duration: 12,
          type: "meditation",
          category: "MEDITATION",
          difficulty: "intermediate",
          approach: "eastern",
          format: "Audio",
          isPublished: true
        }
      ]
    });
    console.log(`✅ Created ${practices.count} practices\n`);
  } catch (error) {
    console.error('⚠️  Error seeding practices (may already exist):', error instanceof Error ? error.message : error);
  }
  
  console.log('🎉 Database seeding complete!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
