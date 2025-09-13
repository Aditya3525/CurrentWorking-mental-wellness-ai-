// YouTube Content Integration for Mental Wellbeing AI App

export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
  channelName: string;
  publishedAt: string;
  viewCount: number;
  categoryId: string;
}

export interface CuratedYouTubeContent {
  id: string;
  title: string;
  description: string;
  youtubeVideoId: string;
  channelName: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  tags: string[];
  thumbnailUrl: string;
  approach: 'western' | 'eastern' | 'hybrid' | 'all';
  curatedBy: string;
  verified: boolean;
  rating?: number;
}

// Curated YouTube Content Database
export const CURATED_YOUTUBE_CONTENT: CuratedYouTubeContent[] = [
  // Meditation & Mindfulness
  {
    id: 'youtube-1',
    title: '10 Minute Guided Meditation for Anxiety',
    description: 'A calming guided meditation to help reduce anxiety and stress in just 10 minutes.',
    youtubeVideoId: 'ZToicYcHIOU', // The Honest Guys
    channelName: 'The Honest Guys',
    duration: '10:02',
    difficulty: 'Beginner',
    category: 'Mindfulness',
    tags: ['meditation', 'anxiety', 'guided', 'beginners'],
    thumbnailUrl: 'https://img.youtube.com/vi/ZToicYcHIOU/maxresdefault.jpg',
    approach: 'eastern',
    curatedBy: 'Mental Health Team',
    verified: true,
    rating: 4.8
  },
  {
    id: 'youtube-2',
    title: 'Body Scan Meditation for Deep Relaxation',
    description: 'Progressive body scan meditation to release tension and promote deep relaxation.',
    youtubeVideoId: 'ihO02wjNS18', // Jason Stephenson
    channelName: 'Jason Stephenson - Sleep Meditation Music',
    duration: '20:15',
    difficulty: 'Beginner',
    category: 'Relaxation',
    tags: ['body scan', 'relaxation', 'sleep', 'tension release'],
    thumbnailUrl: 'https://img.youtube.com/vi/ihO02wjNS18/maxresdefault.jpg',
    approach: 'eastern',
    curatedBy: 'Mindfulness Expert',
    verified: true,
    rating: 4.9
  },
  {
    id: 'youtube-3',
    title: 'Breathing Exercises for Panic Attacks',
    description: '4-7-8 breathing technique and other methods to manage panic attacks effectively.',
    youtubeVideoId: 'tEmt1Znux58', // Therapy in a Nutshell
    channelName: 'Therapy in a Nutshell',
    duration: '8:45',
    difficulty: 'Beginner',
    category: 'Anxiety',
    tags: ['breathing', 'panic attacks', 'anxiety', 'techniques'],
    thumbnailUrl: 'https://img.youtube.com/vi/tEmt1Znux58/maxresdefault.jpg',
    approach: 'western',
    curatedBy: 'Licensed Therapist',
    verified: true,
    rating: 4.7
  },
  {
    id: 'youtube-4',
    title: 'Yoga for Anxiety and Stress Relief',
    description: 'Gentle yoga flow designed specifically for anxiety relief and stress management.',
    youtubeVideoId: 'hJbRpHZr_d0', // Yoga with Adriene
    channelName: 'Yoga with Adriene',
    duration: '25:30',
    difficulty: 'Beginner',
    category: 'Stress Management',
    tags: ['yoga', 'anxiety', 'stress relief', 'movement'],
    thumbnailUrl: 'https://img.youtube.com/vi/hJbRpHZr_d0/maxresdefault.jpg',
    approach: 'eastern',
    curatedBy: 'Yoga Instructor',
    verified: true,
    rating: 4.8
  },
  {
    id: 'youtube-5',
    title: 'Understanding CBT: Cognitive Behavioral Therapy Basics',
    description: 'Learn the fundamentals of CBT and how to apply these techniques in daily life.',
    youtubeVideoId: 'o79_gmO5ppg', // Therapy in a Nutshell
    channelName: 'Therapy in a Nutshell',
    duration: '15:22',
    difficulty: 'Intermediate',
    category: 'Anxiety',
    tags: ['CBT', 'therapy', 'cognitive', 'techniques'],
    thumbnailUrl: 'https://img.youtube.com/vi/o79_gmO5ppg/maxresdefault.jpg',
    approach: 'western',
    curatedBy: 'Clinical Psychologist',
    verified: true,
    rating: 4.9
  },
  {
    id: 'youtube-6',
    title: 'Loving Kindness Meditation',
    description: 'Cultivate compassion and self-love through this traditional loving-kindness practice.',
    youtubeVideoId: 'sz7cpV7ERsM', // UCLA Mindful Awareness Research Center
    channelName: 'UCLA Mindful Awareness Research Center',
    duration: '12:45',
    difficulty: 'Intermediate',
    category: 'Emotional Intelligence',
    tags: ['loving kindness', 'compassion', 'self-love', 'meditation'],
    thumbnailUrl: 'https://img.youtube.com/vi/sz7cpV7ERsM/maxresdefault.jpg',
    approach: 'eastern',
    curatedBy: 'Meditation Teacher',
    verified: true,
    rating: 4.6
  },
  {
    id: 'youtube-7',
    title: 'Sleep Meditation for Insomnia',
    description: 'Guided sleep meditation to help overcome insomnia and achieve restful sleep.',
    youtubeVideoId: 'aAVPDYUI3Mg', // Michael Sealey
    channelName: 'Michael Sealey',
    duration: '60:00',
    difficulty: 'Beginner',
    category: 'Relaxation',
    tags: ['sleep', 'insomnia', 'meditation', 'rest'],
    thumbnailUrl: 'https://img.youtube.com/vi/aAVPDYUI3Mg/maxresdefault.jpg',
    approach: 'eastern',
    curatedBy: 'Sleep Specialist',
    verified: true,
    rating: 4.8
  },
  {
    id: 'youtube-8',
    title: 'Grounding Techniques for Trauma',
    description: 'Practical grounding exercises to help manage trauma responses and stay present.',
    youtubeVideoId: 'nvXuq9jRWKE', // Therapy in a Nutshell
    channelName: 'Therapy in a Nutshell',
    duration: '12:18',
    difficulty: 'Intermediate',
    category: 'Emotional Intelligence',
    tags: ['grounding', 'trauma', 'techniques', 'mindfulness'],
    thumbnailUrl: 'https://img.youtube.com/vi/nvXuq9jRWKE/maxresdefault.jpg',
    approach: 'hybrid',
    curatedBy: 'Trauma Specialist',
    verified: true,
    rating: 4.7
  },
  {
    id: 'youtube-9',
    title: 'Morning Yoga for Energy and Focus',
    description: 'Energizing morning yoga routine to start your day with clarity and positivity.',
    youtubeVideoId: 'VaoV1PrYft4', // Boho Beautiful
    channelName: 'Boho Beautiful',
    duration: '30:15',
    difficulty: 'Intermediate',
    category: 'Stress Management',
    tags: ['morning yoga', 'energy', 'focus', 'routine'],
    thumbnailUrl: 'https://img.youtube.com/vi/VaoV1PrYft4/maxresdefault.jpg',
    approach: 'eastern',
    curatedBy: 'Yoga Instructor',
    verified: true,
    rating: 4.5
  },
  {
    id: 'youtube-10',
    title: 'Mindfulness in Daily Life',
    description: 'How to integrate mindfulness practices into your everyday routines and activities.',
    youtubeVideoId: 'F6eFFCi12v8', // Headspace
    channelName: 'Headspace',
    duration: '7:30',
    difficulty: 'Beginner',
    category: 'Mindfulness',
    tags: ['mindfulness', 'daily life', 'integration', 'awareness'],
    thumbnailUrl: 'https://img.youtube.com/vi/F6eFFCi12v8/maxresdefault.jpg',
    approach: 'hybrid',
    curatedBy: 'Mindfulness Coach',
    verified: true,
    rating: 4.6
  }
];

// Curated YouTube Channels for Mental Health
export const CURATED_CHANNELS = {
  meditation: [
    {
      name: 'The Honest Guys',
      channelId: 'UCO2MMz05UXhJm4StouckZIA',
      description: 'Guided meditations and relaxation content',
      subscribers: '2.1M',
      verified: true
    },
    {
      name: 'Headspace',
      channelId: 'UC3JhfsgFPLSLNEROQCdj-GQ',
      description: 'Mindfulness and meditation for everyday life',
      subscribers: '1.9M',
      verified: true
    },
    {
      name: 'Jason Stephenson - Sleep Meditation Music',
      channelId: 'UChSy8ZKKLfrRfGALGBC4BUg',
      description: 'Sleep meditations, relaxation and healing music',
      subscribers: '1.8M',
      verified: true
    }
  ],
  yoga: [
    {
      name: 'Yoga with Adriene',
      channelId: 'UCFKE7WVJfvaHW5q283SxchA',
      description: 'Free yoga practices for every body',
      subscribers: '11.7M',
      verified: true
    },
    {
      name: 'DoYogaWithMe',
      channelId: 'UC_LOkzqBu9fww8xWHxWlIcg',
      description: 'Free online yoga classes',
      subscribers: '1.4M',
      verified: true
    },
    {
      name: 'Boho Beautiful',
      channelId: 'UCAW-CaBSrE3Zm_bleAC-7xw',
      description: 'Yoga, pilates, and meditation in beautiful locations',
      subscribers: '2.1M',
      verified: true
    }
  ],
  therapy: [
    {
      name: 'Therapy in a Nutshell',
      channelId: 'UCpuqYFKLkcEryEieomiAv3Q',
      description: 'Mental health education and therapy techniques',
      subscribers: '1.2M',
      verified: true
    },
    {
      name: 'Psych2Go',
      channelId: 'UCkJEpR7JmS36tajD34Gp4VA',
      description: 'Psychology and mental health awareness',
      subscribers: '8.9M',
      verified: true
    },
    {
      name: 'Kati Morton',
      channelId: 'UCzBqODmU1LtE6Mt4_UhnjAg',
      description: 'Licensed therapist sharing mental health insights',
      subscribers: '1.1M',
      verified: true
    }
  ]
};

// Utility functions for YouTube integration
export const getYouTubeEmbedUrl = (videoId: string): string => {
  return `https://www.youtube.com/embed/${videoId}`;
};

export const getYouTubeThumbnail = (videoId: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'high'): string => {
  return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`;
};

export const getYouTubeWatchUrl = (videoId: string): string => {
  return `https://www.youtube.com/watch?v=${videoId}`;
};

// Filter content by approach
export const filterContentByApproach = (content: CuratedYouTubeContent[], approach: string): CuratedYouTubeContent[] => {
  if (approach === 'all') return content;
  return content.filter(item => item.approach === approach || item.approach === 'all');
};

// Filter content by category
export const filterContentByCategory = (content: CuratedYouTubeContent[], category: string): CuratedYouTubeContent[] => {
  if (category === 'all') return content;
  return content.filter(item => item.category === category);
};

// Search content
export const searchContent = (content: CuratedYouTubeContent[], query: string): CuratedYouTubeContent[] => {
  if (!query.trim()) return content;
  const lowercaseQuery = query.toLowerCase();
  return content.filter(item => 
    item.title.toLowerCase().includes(lowercaseQuery) ||
    item.description.toLowerCase().includes(lowercaseQuery) ||
    item.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
    item.channelName.toLowerCase().includes(lowercaseQuery)
  );
};

export default CURATED_YOUTUBE_CONTENT;
