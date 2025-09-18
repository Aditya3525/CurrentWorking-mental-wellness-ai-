import { 
  Play, 
  Pause, 
  BookOpen, 
  Clock, 
  Star, 
  Bookmark, 
  BookmarkCheck, 
  Share2,
  Eye,
  Heart,
  Volume2
} from 'lucide-react';
import React, { useState } from 'react';

import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Progress } from '../../ui/progress';

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'audio' | 'article' | 'playlist';
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  approach: 'western' | 'eastern' | 'hybrid';
  thumbnail?: string;
  duration?: number;
  averageRating?: number;
  ratingCount?: number;
  viewCount: number;
  isBookmarked?: boolean;
  isFeatured: boolean;
  author?: {
    id: string;
    name: string;
  };
  progress?: {
    completed: boolean;
    percentage: number;
    lastPosition?: number;
  };
}

interface RichContentCardProps {
  content: ContentItem;
  variant?: 'default' | 'featured' | 'compact' | 'detailed';
  showProgress?: boolean;
  onPlay?: (content: ContentItem) => void;
  onBookmark?: (content: ContentItem) => void;
  onRate?: (content: ContentItem, rating: number) => void;
  onShare?: (content: ContentItem) => void;
  onNavigate?: (content: ContentItem) => void;
}

export const RichContentCard: React.FC<RichContentCardProps> = ({
  content,
  variant = 'default',
  showProgress = true,
  onPlay,
  onBookmark,
  onRate,
  onShare,
  onNavigate
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [userRating, setUserRating] = useState(0);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (onPlay) {
      onPlay(content);
    }
  };

  const handleBookmark = () => {
    if (onBookmark) {
      onBookmark(content);
    }
  };

  const handleRating = (rating: number) => {
    setUserRating(rating);
    if (onRate) {
      onRate(content, rating);
    }
    setShowRating(false);
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="w-4 h-4" />;
      case 'audio':
        return <Volume2 className="w-4 h-4" />;
      case 'article':
        return <BookOpen className="w-4 h-4" />;
      case 'playlist':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-500';
      case 'Intermediate':
        return 'bg-yellow-500';
      case 'Advanced':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (variant === 'compact') {
    return (
      <Card className="p-3 hover:bg-gray-800 transition-all cursor-pointer group" onClick={() => onNavigate?.(content)}>
        <div className="flex items-center gap-3">
          {content.thumbnail && (
            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
              <img src={content.thumbnail} alt={content.title} className="w-full h-full object-cover" />
              {(content.type === 'video' || content.type === 'audio') && (
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white text-sm line-clamp-1">{content.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" size="sm" className="text-xs">
                {getTypeIcon(content.type)}
                <span className="ml-1">{content.type}</span>
              </Badge>
              {content.duration && (
                <span className="text-xs text-gray-400">{formatDuration(content.duration)}</span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleBookmark();
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {content.isBookmarked ? (
              <BookmarkCheck className="w-4 h-4 text-purple-400" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </Button>
        </div>
      </Card>
    );
  }

  if (variant === 'featured') {
    return (
      <Card className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-gray-900 to-blue-900 border-purple-500/50">
        {content.thumbnail && (
          <div className="relative h-48 overflow-hidden">
            <img 
              src={content.thumbnail} 
              alt={content.title}
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            <div className="absolute top-4 left-4">
              <Badge variant="default" className="bg-purple-600 text-white">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            </div>
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmark}
                className="bg-black/20 backdrop-blur-sm hover:bg-black/40"
              >
                {content.isBookmarked ? (
                  <BookmarkCheck className="w-4 h-4 text-purple-400" />
                ) : (
                  <Bookmark className="w-4 h-4 text-white" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onShare?.(content)}
                className="bg-black/20 backdrop-blur-sm hover:bg-black/40"
              >
                <Share2 className="w-4 h-4 text-white" />
              </Button>
            </div>
            {(content.type === 'video' || content.type === 'audio') && (
              <div className="absolute bottom-4 left-4">
                <Button
                  variant="default"
                  size="lg"
                  onClick={handlePlayPause}
                  className="bg-purple-600 hover:bg-purple-700 rounded-full w-12 h-12 p-0"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-1" />
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
        
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{content.type}</Badge>
              <div className={`w-2 h-2 rounded-full ${getDifficultyColor(content.difficulty)}`} />
              <span className="text-sm text-gray-300">{content.difficulty}</span>
            </div>
            {content.duration && (
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                {formatDuration(content.duration)}
              </div>
            )}
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{content.title}</h3>
          <p className="text-gray-300 text-sm mb-4 line-clamp-3">{content.description}</p>
          
          {content.author && (
            <p className="text-sm text-gray-400 mb-3">by {content.author.name}</p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {content.averageRating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-gray-300">{content.averageRating.toFixed(1)}</span>
                  <span className="text-xs text-gray-500">({content.ratingCount})</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <Eye className="w-4 h-4" />
                {content.viewCount.toLocaleString()}
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={() => onNavigate?.(content)}
              className="text-purple-400 border-purple-400 hover:bg-purple-400 hover:text-white"
            >
              View Details
            </Button>
          </div>
          
          {showProgress && content.progress && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Progress</span>
                <span className="text-sm text-gray-400">{content.progress.percentage}%</span>
              </div>
              <Progress value={content.progress.percentage} className="h-2" />
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className="overflow-hidden hover:bg-gray-800 transition-all group cursor-pointer" onClick={() => onNavigate?.(content)}>
      {content.thumbnail && (
        <div className="relative h-40 overflow-hidden">
          <img 
            src={content.thumbnail} 
            alt={content.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all" />
          
          {content.isFeatured && (
            <div className="absolute top-2 left-2">
              <Badge variant="default" size="sm" className="bg-purple-600">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            </div>
          )}
          
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleBookmark();
              }}
              className="bg-black/20 backdrop-blur-sm hover:bg-black/40 w-8 h-8 p-0"
            >
              {content.isBookmarked ? (
                <BookmarkCheck className="w-4 h-4 text-purple-400" />
              ) : (
                <Bookmark className="w-4 h-4 text-white" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onShare?.(content);
              }}
              className="bg-black/20 backdrop-blur-sm hover:bg-black/40 w-8 h-8 p-0"
            >
              <Share2 className="w-4 h-4 text-white" />
            </Button>
          </div>
          
          {(content.type === 'video' || content.type === 'audio') && (
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="default"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayPause();
                }}
                className="bg-purple-600 hover:bg-purple-700 rounded-full w-10 h-10 p-0"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </Button>
            </div>
          )}
          
          {content.duration && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="secondary" size="sm" className="bg-black/50 text-white">
                <Clock className="w-3 h-3 mr-1" />
                {formatDuration(content.duration)}
              </Badge>
            </div>
          )}
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" size="sm">
              {getTypeIcon(content.type)}
              <span className="ml-1 capitalize">{content.type}</span>
            </Badge>
            <Badge variant="outline" size="sm" className={`${getDifficultyColor(content.difficulty)} text-white`}>
              {content.difficulty}
            </Badge>
          </div>
          
          {content.approach && (
            <Badge variant="outline" size="sm" className="text-xs">
              {content.approach}
            </Badge>
          )}
        </div>
        
        <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
          {content.title}
        </h3>
        
        <p className="text-sm text-gray-400 mb-3 line-clamp-2">{content.description}</p>
        
        {content.author && (
          <p className="text-xs text-gray-500 mb-3">by {content.author.name}</p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {content.averageRating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm text-gray-300">{content.averageRating.toFixed(1)}</span>
              </div>
            )}
            
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Eye className="w-3 h-3" />
              {content.viewCount > 1000 ? `${(content.viewCount / 1000).toFixed(1)}k` : content.viewCount}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowRating(!showRating);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Heart className="w-4 h-4" />
          </Button>
        </div>
        
        {showProgress && content.progress && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Progress</span>
              <span className="text-xs text-gray-500">{content.progress.percentage}%</span>
            </div>
            <Progress value={content.progress.percentage} className="h-1" />
          </div>
        )}
        
        {showRating && (
          <div className="mt-3 p-3 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-300 mb-2">Rate this content:</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleRating(rating)}
                  className="hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-5 h-5 ${
                      rating <= userRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-400 hover:text-yellow-400'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default RichContentCard;