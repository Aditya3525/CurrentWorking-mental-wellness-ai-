import { Clock, Hash, Heart, Tag, X } from 'lucide-react';
import React from 'react';

import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { ScrollArea } from '../components/ui/scroll-area';

interface PracticeItem {
  id: string;
  title: string;
  category: string;
  type: string;
  approach: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  duration?: number;
  description?: string;
  instructions?: string;
  benefits?: string[];
  tags?: string[];
  isPublished: boolean;
}

interface PracticePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  practice: PracticeItem | null;
}

export const PracticePreviewModal: React.FC<PracticePreviewModalProps> = ({
  open,
  onOpenChange,
  practice
}) => {
  if (!practice) return null;

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-100';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-100';
      case 'Advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-100';
      default:
        return '';
    }
  };

  const getApproachColor = (approach: string) => {
    switch (approach.toLowerCase()) {
      case 'western':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-100';
      case 'eastern':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-100';
      case 'hybrid':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-100';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-8">
              <DialogTitle className="text-2xl font-bold mb-2">
                {practice.title}
              </DialogTitle>
              <DialogDescription className="flex flex-wrap gap-2 items-center">
                <Badge variant="outline">{practice.category}</Badge>
                <Badge variant="default" className="capitalize">
                  {practice.type}
                </Badge>
                <Badge variant="secondary" className={getApproachColor(practice.approach)}>
                  {practice.approach.toUpperCase()}
                </Badge>
                {practice.difficulty && (
                  <Badge variant="secondary" className={getDifficultyColor(practice.difficulty)}>
                    {practice.difficulty}
                  </Badge>
                )}
                {practice.isPublished ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Published
                  </Badge>
                ) : (
                  <Badge variant="outline">Draft</Badge>
                )}
                {practice.duration && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {practice.duration} min
                  </Badge>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content Area */}
        <ScrollArea className="flex-1 pr-4">
          <div className="py-4 space-y-6">
            {/* Description */}
            {practice.description && (
              <div>
                <h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wide">
                  Description
                </h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed border-l-4 border-primary pl-4 italic">
                    {practice.description}
                  </p>
                </div>
              </div>
            )}

            {/* Practice Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border bg-card p-4">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Category
                </div>
                <div className="text-lg font-semibold">
                  {practice.category}
                </div>
              </div>

              <div className="rounded-lg border bg-card p-4">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Type
                </div>
                <div className="text-lg font-semibold capitalize">
                  {practice.type}
                </div>
              </div>

              <div className="rounded-lg border bg-card p-4">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Approach
                </div>
                <div className="text-lg font-semibold capitalize">
                  {practice.approach}
                </div>
              </div>

              <div className="rounded-lg border bg-card p-4">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Difficulty
                </div>
                <div className="text-lg font-semibold">
                  {practice.difficulty || 'Not specified'}
                </div>
              </div>
            </div>

            {/* Instructions */}
            {practice.instructions && (
              <div>
                <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Instructions
                </h3>
                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {practice.instructions}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Benefits */}
            {practice.benefits && practice.benefits.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Benefits
                </h3>
                <ul className="space-y-2">
                  {practice.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-sm flex-1">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tags */}
            {practice.tags && practice.tags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Tags
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {practice.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Practice Card Preview */}
            <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2">{practice.title}</h4>
                  {practice.duration && (
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <Clock className="h-4 w-4" />
                      {practice.duration} minutes
                    </p>
                  )}
                </div>
                <Button className="w-full">
                  Start Practice
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="pt-4 border-t flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Close Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PracticePreviewModal;
