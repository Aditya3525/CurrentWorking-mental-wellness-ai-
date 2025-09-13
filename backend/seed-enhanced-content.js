import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding enhanced content management system...');

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123456', 12);
  
  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@mentalwellbeing.ai' },
    update: {},
    create: {
      email: 'admin@mentalwellbeing.ai',
      name: 'System Administrator',
      password: hashedPassword,
      role: 'super_admin',
      permissions: JSON.stringify([
        'content:create',
        'content:edit',
        'content:delete',
        'playlist:create',
        'playlist:edit',
        'playlist:delete',
        'analytics:view',
        'users:view'
      ]),
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create sample content
  const sampleContent = [
    {
      title: '10-Minute Morning Mindfulness Meditation',
      type: 'video',
      category: 'Mindfulness',
      approach: 'eastern',
      description: 'Start your day with presence and intention through this gentle guided practice.',
      content: 'guided meditation content or youtube URL',
      duration: '10 min',
      difficulty: 'Beginner',
      author: 'Dr. Sarah Chen',
      tags: 'morning,meditation,beginners',
      severityLevel: 'Mild',
      thumbnailUrl: 'https://images.unsplash.com/photo-1622048769696-4d042b1028de',
      isPublished: true,
      externalUrl: 'https://youtube.com/watch?v=example',
      fileType: 'youtube',
      createdBy: admin.id,
    },
    {
      title: 'Understanding Anxiety: A Complete Guide',
      type: 'article',
      category: 'Anxiety',
      approach: 'western',
      description: 'Comprehensive exploration of anxiety - what it is, why it happens, and how to manage it.',
      content: 'Detailed article content about anxiety management...',
      duration: '15 min read',
      difficulty: 'Beginner',
      author: 'Dr. Michael Rodriguez',
      tags: 'anxiety,education,coping',
      severityLevel: 'Moderate',
      thumbnailUrl: 'https://images.unsplash.com/photo-1599744403700-b7330f3c4dbe',
      isPublished: true,
      fileType: 'article',
      createdBy: admin.id,
    },
    {
      title: 'Breathing Techniques for Stress Relief',
      type: 'audio',
      category: 'Stress Management',
      approach: 'hybrid',
      description: 'Learn powerful breathing methods to instantly calm your nervous system.',
      content: 'Audio guide for breathing exercises',
      duration: '15 min',
      difficulty: 'Beginner',
      author: 'Emma Thompson',
      tags: 'breathing,stress,techniques',
      severityLevel: 'Mild',
      thumbnailUrl: 'https://images.unsplash.com/photo-1687180948607-9ba1dd045e10',
      isPublished: true,
      fileType: 'mp3',
      createdBy: admin.id,
    },
    {
      title: 'Body Scan for Deep Relaxation',
      type: 'audio',
      category: 'Relaxation',
      approach: 'eastern',
      description: 'Progressive body scan meditation to release tension and find inner peace.',
      content: 'Guided body scan meditation audio',
      duration: '20 min',
      difficulty: 'Intermediate',
      author: 'Dr. James Wilson',
      tags: 'body scan,relaxation,sleep',
      severityLevel: 'Mild',
      thumbnailUrl: 'https://images.unsplash.com/photo-1622048769696-4d042b1028de',
      isPublished: true,
      fileType: 'mp3',
      createdBy: admin.id,
    },
  ];

  const createdContent = [];
  for (const contentData of sampleContent) {
    // Check if content already exists
    const existing = await prisma.content.findFirst({
      where: { title: contentData.title }
    });
    
    if (!existing) {
      const content = await prisma.content.create({
        data: contentData,
      });
      createdContent.push(content);
      console.log('✅ Created content:', content.title);
    } else {
      createdContent.push(existing);
      console.log('ℹ️  Content already exists:', existing.title);
    }
  }

  // Create sample playlist
  const existingPlaylist = await prisma.playlist.findFirst({
    where: { title: "Beginner's Mindfulness Journey" }
  });
  
  let playlist;
  if (!existingPlaylist) {
    playlist = await prisma.playlist.create({
      data: {
        title: "Beginner's Mindfulness Journey",
        description: 'A complete 7-day series to introduce you to mindfulness and meditation.',
        category: 'Series',
        approach: 'hybrid',
        difficulty: 'Beginner',
        tags: 'beginner,series,meditation',
        severityLevel: 'Mild',
        thumbnailUrl: 'https://images.unsplash.com/photo-1687180948607-9ba1dd045e10',
        isPublished: true,
        createdBy: admin.id,
      },
    });
    console.log('✅ Created playlist:', playlist.title);
  } else {
    playlist = existingPlaylist;
    console.log('ℹ️  Playlist already exists:', playlist.title);
  }

  // Add content to playlist
  for (let i = 0; i < createdContent.length && i < 3; i++) {
    await prisma.playlistItem.upsert({
      where: {
        playlistId_contentId: {
          playlistId: playlist.id,
          contentId: createdContent[i].id,
        }
      },
      update: {},
      create: {
        playlistId: playlist.id,
        contentId: createdContent[i].id,
        order: i + 1,
      },
    });
    console.log(`✅ Added content to playlist: ${createdContent[i].title}`);
  }

  console.log('\n🎉 Enhanced content management system seeded successfully!');
  console.log('\n📧 Admin Login:');
  console.log('   Email: admin@mentalwellbeing.ai');
  console.log('   Password: admin123456');
  console.log('\n🔗 Admin endpoints available at /api/admin/*');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
