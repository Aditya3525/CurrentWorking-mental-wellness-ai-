import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedContent() {
  console.log('🌱 Seeding content...');

  const sampleContent = [
    {
      title: "5-Minute Morning Meditation",
      type: "audio",
      category: "Mindfulness",
      approach: "eastern",
      content: "A gentle morning meditation to start your day with clarity and peace.",
      description: "This guided meditation helps you center yourself and set positive intentions for the day ahead. Perfect for beginners who want to establish a morning routine.",
      duration: "5 min",
      difficulty: "Beginner",
      tags: "meditation,morning,mindfulness,breathing",
      isPublished: true,
      viewCount: 145,
      rating: 4.5,
      ratingCount: 23,
      thumbnailUrl: "https://via.placeholder.com/300x200?text=Morning+Meditation",
      fileUrl: "https://example.com/audio/morning-meditation.mp3"
    },
    {
      title: "Understanding Anxiety: A Comprehensive Guide",
      type: "article",
      category: "Anxiety",
      approach: "western",
      content: "Learn about the nature of anxiety, its symptoms, and evidence-based strategies for management. This comprehensive guide covers cognitive-behavioral techniques, breathing exercises, and when to seek professional help.",
      description: "A detailed article explaining anxiety from a clinical perspective, with practical tools and strategies for managing anxious thoughts and feelings.",
      difficulty: "Beginner",
      tags: "anxiety,CBT,psychology,education",
      isPublished: true,
      viewCount: 89,
      rating: 4.2,
      ratingCount: 15,
      thumbnailUrl: "https://via.placeholder.com/300x200?text=Understanding+Anxiety"
    },
    {
      title: "Progressive Muscle Relaxation",
      type: "video",
      category: "Stress Management",
      approach: "hybrid",
      content: "A 15-minute guided session combining Western progressive muscle relaxation with Eastern mindfulness principles.",
      description: "Learn to systematically tense and relax different muscle groups while maintaining mindful awareness. This technique is effective for reducing physical tension and mental stress.",
      duration: "15 min",
      difficulty: "Intermediate",
      tags: "relaxation,stress,muscle,body awareness",
      isPublished: true,
      viewCount: 267,
      rating: 4.7,
      ratingCount: 41,
      thumbnailUrl: "https://via.placeholder.com/300x200?text=Progressive+Muscle+Relaxation",
      externalUrl: "https://youtube.com/watch?v=example"
    },
    {
      title: "Breathing Techniques for Panic Attacks",
      type: "audio",
      category: "Anxiety",
      approach: "hybrid",
      content: "Quick and effective breathing techniques to help manage panic attacks and acute anxiety episodes.",
      description: "Learn the 4-7-8 breathing technique, box breathing, and other evidence-based methods for immediate anxiety relief.",
      duration: "8 min",
      difficulty: "Beginner",
      tags: "breathing,panic,anxiety,emergency",
      isPublished: true,
      viewCount: 198,
      rating: 4.8,
      ratingCount: 34,
      thumbnailUrl: "https://via.placeholder.com/300x200?text=Breathing+Techniques"
    },
    {
      title: "Building Emotional Intelligence",
      type: "article",
      category: "Emotional Intelligence",
      approach: "western",
      content: "Develop your emotional awareness, regulation skills, and empathy through practical exercises and self-reflection techniques.",
      description: "A comprehensive guide to understanding and developing emotional intelligence, with actionable strategies for personal and professional growth.",
      difficulty: "Intermediate",
      tags: "emotional intelligence,self-awareness,empathy,relationships",
      isPublished: true,
      viewCount: 76,
      rating: 4.3,
      ratingCount: 12,
      thumbnailUrl: "https://via.placeholder.com/300x200?text=Emotional+Intelligence"
    },
    {
      title: "Mindful Walking Meditation",
      type: "video",
      category: "Mindfulness",
      approach: "eastern",
      content: "Transform your daily walk into a moving meditation practice. Learn to cultivate awareness and presence through mindful movement.",
      description: "Discover how to practice meditation while walking, bringing mindfulness to everyday activities and connecting with nature.",
      duration: "12 min",
      difficulty: "Beginner",
      tags: "walking,meditation,mindfulness,nature,movement",
      isPublished: true,
      viewCount: 134,
      rating: 4.4,
      ratingCount: 18,
      thumbnailUrl: "https://via.placeholder.com/300x200?text=Walking+Meditation"
    },
    {
      title: "Sleep Hygiene and Relaxation",
      type: "audio",
      category: "Relaxation",
      approach: "hybrid",
      content: "A soothing bedtime routine combining sleep science with relaxation techniques to improve sleep quality.",
      description: "Learn evidence-based sleep hygiene practices combined with gentle relaxation exercises to help you fall asleep faster and sleep more deeply.",
      duration: "20 min",
      difficulty: "Beginner",
      tags: "sleep,relaxation,bedtime,hygiene",
      isPublished: true,
      viewCount: 312,
      rating: 4.6,
      ratingCount: 52,
      thumbnailUrl: "https://via.placeholder.com/300x200?text=Sleep+Relaxation"
    },
    {
      title: "Cognitive Restructuring for Negative Thoughts",
      type: "article",
      category: "Stress Management",
      approach: "western",
      content: "Master the art of identifying and challenging negative thought patterns using cognitive-behavioral therapy techniques.",
      description: "Learn how to recognize cognitive distortions and develop healthier thinking patterns through structured CBT exercises.",
      difficulty: "Advanced",
      tags: "CBT,negative thoughts,cognitive restructuring,therapy",
      isPublished: true,
      viewCount: 94,
      rating: 4.1,
      ratingCount: 16,
      thumbnailUrl: "https://via.placeholder.com/300x200?text=Cognitive+Restructuring"
    }
  ];

  try {
    for (const content of sampleContent) {
      await prisma.content.create({
        data: content
      });
      console.log(`✅ Created: ${content.title}`);
    }

    console.log('🎉 Content seeding completed successfully!');
    console.log(`📚 Added ${sampleContent.length} pieces of content`);
  } catch (error) {
    console.error('❌ Error seeding content:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedContent();
}

export { seedContent };