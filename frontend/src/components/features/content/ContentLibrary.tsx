import { 
  ArrowLeft,
  Search,
  Play,
  BookOpen,
  Headphones,
  Video,
  Clock,
  Star,
  Bookmark,
  Filter,
  Heart,
  Brain,
  Users
} from 'lucide-react';
import React, { useState } from 'react';

import { ImageWithFallback } from '../../common/ImageWithFallback';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Input } from '../../ui/input';

interface ContentLibraryProps {
  onNavigate: (page: string) => void;
  user?: any;
}

interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'audio' | 'article' | 'playlist';
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  tags: string[];
  thumbnail: string;
  rating: number;
  isBookmarked: boolean;
  author: string;
  approach: 'western' | 'eastern' | 'hybrid' | 'all';
}

export function ContentLibrary({ onNavigate, user }: ContentLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApproach, setSelectedApproach] = useState<'all' | 'western' | 'eastern' | 'hybrid'>(
    user?.approach || 'all'
  );
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  const contentItems: ContentItem[] = [
    {
      id: '1',
      title: '10-Minute Morning Mindfulness',
      description: 'Start your day with presence and intention through this gentle guided practice.',
      type: 'audio',
      duration: '10 min',
      difficulty: 'Beginner',
      category: 'Mindfulness',
      tags: ['morning', 'meditation', 'beginners'],
      thumbnail: 'https://images.unsplash.com/photo-1622048769696-4d042b1028de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZWFjZWZ1bCUyMHlvZ2ElMjBtZWRpdGF0aW9ufGVufDF8fHx8MTc1NjcxMDg4OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      rating: 4.8,
      isBookmarked: false,
      author: 'Dr. Sarah Chen',
      approach: 'eastern'
    },
    {
      id: '2',
      title: 'Understanding Anxiety: A Complete Guide',
      description: 'Comprehensive exploration of anxiety - what it is, why it happens, and how to manage it.',
      type: 'video',
      duration: '25 min',
      difficulty: 'Beginner',
      category: 'Anxiety',
      tags: ['anxiety', 'education', 'coping'],
      thumbnail: 'https://images.unsplash.com/photo-1599744403700-b7330f3c4dbe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxtaW5kZnVsbmVzcyUyMG5hdHVyZSUyMHBlYWNlZnVsfGVufDF8fHx8MTc1NjcxMDg5M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      rating: 4.9,
      isBookmarked: true,
      author: 'Dr. Michael Rodriguez',
      approach: 'western'
    },
    {
      id: '3',
      title: 'Breathing Techniques for Stress Relief',
      description: 'Learn powerful breathing methods to instantly calm your nervous system.',
      type: 'video',
      duration: '15 min',
      difficulty: 'Beginner',
      category: 'Stress Management',
      tags: ['breathing', 'stress', 'techniques'],
      thumbnail: 'https://images.unsplash.com/photo-1687180948607-9ba1dd045e10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWxtJTIwbWVkaXRhdGlvbiUyMHdlbGxuZXNzfGVufDF8fHx8MTc1NjcxMDg4Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      rating: 4.7,
      isBookmarked: false,
      author: 'Emma Thompson',
      approach: 'hybrid'
    },
    {
      id: '4',
      title: 'Body Scan for Deep Relaxation',
      description: 'Progressive body scan meditation to release tension and find inner peace.',
      type: 'audio',
      duration: '20 min',
      difficulty: 'Intermediate',
      category: 'Relaxation',
      tags: ['body scan', 'relaxation', 'sleep'],
      thumbnail: 'https://images.unsplash.com/photo-1622048769696-4d042b1028de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZWFjZWZ1bCUyMHlvZ2ElMjBtZWRpdGF0aW9ufGVufDF8fHx8MTc1NjcxMDg4OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      rating: 4.6,
      isBookmarked: true,
      author: 'Dr. James Wilson',
      approach: 'eastern'
    },
    {
      id: '5',
      title: 'Building Emotional Resilience',
      description: 'Practical strategies to bounce back from life\'s challenges with greater strength.',
      type: 'article',
      duration: '8 min read',
      difficulty: 'Intermediate',
      category: 'Emotional Intelligence',
      tags: ['resilience', 'emotional intelligence', 'coping'],
      thumbnail: 'https://images.unsplash.com/photo-1599744403700-b7330f3c4dbe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxtaW5kZnVsbmVzcyUyMG5hdHVyZSUyMHBlYWNlZnVsfGVufDF8fHx8MTc1NjcxMDg5M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      rating: 4.5,
      isBookmarked: false,
      author: 'Dr. Lisa Park',
      approach: 'western'
    },
    {
      id: '6',
      title: 'Beginner\'s Journey to Calm',
      description: 'A complete 7-day series to introduce you to mindfulness and meditation.',
      type: 'playlist',
      duration: '7 sessions',
      difficulty: 'Beginner',
      category: 'Series',
      tags: ['beginner', 'series', 'meditation'],
      thumbnail: 'https://images.unsplash.com/photo-1687180948607-9ba1dd045e10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWxtJTIwbWVkaXRhdGlvbiUyMHdlbGxuZXNzfGVufDF8fHx8MTc1NjcxMDg4Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      rating: 4.9,
      isBookmarked: true,
      author: 'Mindful Living Team',
      approach: 'hybrid'
    },
    {
      id: '7',
      title: 'Cognitive Behavioral Therapy Basics',
      description: 'Learn fundamental CBT techniques to challenge negative thought patterns.',
      type: 'video',
      duration: '30 min',
      difficulty: 'Intermediate',
      category: 'Anxiety',
      tags: ['CBT', 'therapy', 'negative thoughts'],
      thumbnail: 'https://images.unsplash.com/photo-1599744403700-b7330f3c4dbe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxtaW5kZnVsbmVzcyUyMG5hdHVyZSUyMHBlYWNlZnVsfGVufDF8fHx8MTc1NjcxMDg5M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      rating: 4.7,
      isBookmarked: false,
      author: 'Dr. Rachel Thompson',
      approach: 'western'
    },
    {
      id: '8',
      title: 'Ancient Yoga Nidra for Deep Rest',
      description: 'Traditional yogic sleep practice for profound relaxation and healing.',
      type: 'audio',
      duration: '45 min',
      difficulty: 'Intermediate',
      category: 'Relaxation',
      tags: ['yoga nidra', 'ancient practice', 'deep rest'],
      thumbnail: 'https://images.unsplash.com/photo-1622048769696-4d042b1028de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZWFjZWZ1bCUyMHlvZ2ElMjBtZWRpdGF0aW9ufGVufDF8fHx8MTc1NjcxMDg4OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      rating: 4.8,
      isBookmarked: true,
      author: 'Swami Ananda',
      approach: 'eastern'
    },
    {
      id: '9',
      title: 'The Science of Mindfulness',
      description: 'Research-backed benefits of meditation combined with practical techniques.',
      type: 'article',
      duration: '12 min read',
      difficulty: 'Intermediate',
      category: 'Mindfulness',
      tags: ['science', 'research', 'mindfulness'],
      thumbnail: 'https://images.unsplash.com/photo-1687180948607-9ba1dd045e10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWxtJTIwbWVkaXRhdGlvbiUyMHdlbGxuZXNzfGVufDF8fHx8MTc1NjcxMDg4Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      rating: 4.6,
      isBookmarked: false,
      author: 'Dr. Jon Kabat-Zinn',
      approach: 'hybrid'
    },
    {
      id: '10',
      title: 'Traditional Qi Gong for Energy',
      description: 'Ancient Chinese practice to cultivate life energy and inner balance.',
      type: 'video',
      duration: '20 min',
      difficulty: 'Beginner',
      category: 'Stress Management',
      tags: ['qi gong', 'energy', 'balance'],
      thumbnail: 'https://images.unsplash.com/photo-1622048769696-4d042b1028de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZWFjZWZ1bCUyMHlvZ2ElMjBtZWRpdGF0aW9ufGVufDF8fHx8MTc1NjcxMDg4OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      rating: 4.5,
      isBookmarked: false,
      author: 'Master Li Wei',
      approach: 'eastern'
    },
    {
      id: '11',
      title: 'Dialectical Behavior Therapy Skills',
      description: 'Learn DBT techniques for emotional regulation and distress tolerance.',
      type: 'video',
      duration: '28 min',
      difficulty: 'Advanced',
      category: 'Emotional Intelligence',
      tags: ['DBT', 'emotional regulation', 'distress tolerance'],
      thumbnail: 'https://images.unsplash.com/photo-1599744403700-b7330f3c4dbe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHhtaW5kZnVsbmVzcyUyMG5hdHVyZSUyMHBlYWNlZnVsfGVufDF8fHx8MTc1NjcxMDg5M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      rating: 4.9,
      isBookmarked: true,
      author: 'Dr. Marsha Linehan',
      approach: 'western'
    },
    {
      id: '12',
      title: 'Integrative Stress Relief Program',
      description: 'Combines Western psychology with Eastern mindfulness for complete stress management.',
      type: 'playlist',
      duration: '10 sessions',
      difficulty: 'Intermediate',
      category: 'Stress Management',
      tags: ['integrative', 'stress relief', 'complete program'],
      thumbnail: 'https://images.unsplash.com/photo-1687180948607-9ba1dd045e10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWxtJTIwbWVkaXRhdGlvbiUyMHdlbGxuZXNzfGVufDF8fHx8MTc1NjcxMDg4Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      rating: 4.8,
      isBookmarked: false,
      author: 'Integrative Wellness Team',
      approach: 'hybrid'
    }
  ];

  const categories = ['all', 'Mindfulness', 'Anxiety', 'Stress Management', 'Relaxation', 'Emotional Intelligence', 'Series'];
  const types = ['all', 'video', 'audio', 'article', 'playlist'];

  const filteredContent = contentItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesType = selectedType === 'all' || item.type === selectedType;
    const matchesApproach = selectedApproach === 'all' || item.approach === selectedApproach || item.approach === 'all';
    
    return matchesSearch && matchesCategory && matchesType && matchesApproach;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'audio': return <Headphones className="h-4 w-4" />;
      case 'article': return <BookOpen className="h-4 w-4" />;
      case 'playlist': return <Play className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-red-100 text-red-800';
      case 'audio': return 'bg-green-100 text-green-800';
      case 'article': return 'bg-blue-100 text-blue-800';
      case 'playlist': return 'bg-purple-100 text-purple-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onNavigate('dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl">Content Library</h1>
            <p className="text-muted-foreground text-lg">
              Curated videos, guided meditations, articles, and educational content for your wellbeing journey
            </p>

            {/* Approach preference message */}
            {user?.approach && user.approach !== selectedApproach && selectedApproach !== 'all' && (
              <div className="bg-accent/20 border border-accent/30 rounded-lg p-4">
                <p className="text-sm">
                  💡 <strong>Tip:</strong> You're currently viewing{' '}
                  <span className="capitalize font-medium">{selectedApproach}</span> content.{' '}
                  Your preferred approach is{' '}
                  <span className="capitalize font-medium">{user.approach}</span>.{' '}
                  <button 
                    onClick={() => setSelectedApproach(user.approach!)}
                    className="text-primary hover:underline font-medium"
                  >
                    Switch to your preferred content
                  </button>
                </p>
              </div>
            )}

            {user?.approach && selectedApproach === user.approach && selectedApproach !== 'all' && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <p className="text-sm">
                  ✨ Showing content tailored to your{' '}
                  <span className="capitalize font-medium">{user.approach}</span> approach preference.{' '}
                  <button 
                    onClick={() => setSelectedApproach('all')}
                    className="text-primary hover:underline font-medium"
                  >
                    View all content
                  </button>
                </p>
              </div>
            )}

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Filters */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <div className="space-y-3">
            {/* Category Filter */}
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Category:</span>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="capitalize"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Content Type:</span>
              <div className="flex flex-wrap gap-2">
                {types.map((type) => (
                  <Button
                    key={type}
                    variant={selectedType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedType(type)}
                    className="capitalize flex items-center gap-1"
                  >
                    {type !== 'all' && getTypeIcon(type)}
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            {/* Approach Filter */}
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Approach:</span>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedApproach === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedApproach('all')}
                >
                  All Approaches
                </Button>
                <Button
                  variant={selectedApproach === 'western' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedApproach('western')}
                  className="flex items-center gap-1"
                >
                  <Brain className="h-3 w-3" />
                  Western Therapy
                </Button>
                <Button
                  variant={selectedApproach === 'eastern' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedApproach('eastern')}
                  className="flex items-center gap-1"
                >
                  <Heart className="h-3 w-3" />
                  Eastern Practices
                </Button>
                <Button
                  variant={selectedApproach === 'hybrid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedApproach('hybrid')}
                  className="flex items-center gap-1"
                >
                  <Users className="h-3 w-3" />
                  Hybrid Approach
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContent.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <ImageWithFallback
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />
                
                {/* Overlay with play button */}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center group">
                  <Button 
                    size="sm" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {item.type === 'article' ? 'Read' : 'Play'}
                  </Button>
                </div>

                {/* Bookmark button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Toggle bookmark functionality
                  }}
                >
                  <Bookmark 
                    className={`h-4 w-4 ${item.isBookmarked ? 'fill-current text-primary' : ''}`} 
                  />
                </Button>

                {/* Type indicator */}
                <Badge 
                  className={`absolute top-2 left-2 ${getTypeColor(item.type)}`}
                >
                  <div className="flex items-center gap-1">
                    {getTypeIcon(item.type)}
                    <span className="capitalize">{item.type}</span>
                  </div>
                </Badge>

                {/* Approach indicator */}
                {item.approach !== 'all' && (
                  <Badge 
                    className="absolute top-12 left-2 bg-white/90 text-gray-700 text-xs"
                  >
                    {item.approach === 'western' && '🧠 Western'}
                    {item.approach === 'eastern' && '🕉️ Eastern'}
                    {item.approach === 'hybrid' && '🌸 Hybrid'}
                  </Badge>
                )}
              </div>

              <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                  <h3 className="font-semibold leading-tight">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{item.duration}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current text-yellow-500" />
                    <span className="text-sm font-medium">{item.rating}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Badge 
                    variant="outline"
                    className={getDifficultyColor(item.difficulty)}
                  >
                    {item.difficulty}
                  </Badge>
                  
                  <span className="text-xs text-muted-foreground">
                    by {item.author}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredContent.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No content found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <Button 
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedType('all');
                setSelectedApproach('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Featured Collections */}
        <div className="mt-12 space-y-6">
          <h2 className="text-2xl">Featured Collections</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Anxiety Relief</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Immediate techniques and long-term strategies for managing anxiety
                </p>
                <Button size="sm" variant="outline">
                  Explore Collection
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">Better Sleep</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Guided practices and education for improving sleep quality
                </p>
                <Button size="sm" variant="outline">
                  Explore Collection
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold">Relationships</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Building healthy connections and communication skills
                </p>
                <Button size="sm" variant="outline">
                  Explore Collection
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}