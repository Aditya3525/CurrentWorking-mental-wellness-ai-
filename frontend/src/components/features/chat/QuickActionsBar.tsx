import { BookMarked, Download, Dumbbell, Sparkles } from 'lucide-react';
import React from 'react';

import { Button } from '../../ui/button';

interface QuickActionsBarProps {
  onExercises?: () => void;
  onSummary?: () => void;
  onBookmark?: () => void;
  onExport?: () => void;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  onExercises,
  onSummary,
  onBookmark,
  onExport,
}) => {
  const actions = [
    {
      icon: Dumbbell,
      label: 'Get Exercises',
      onClick: onExercises,
      description: 'Recommended practices',
      enabled: !!onExercises,
    },
    {
      icon: Sparkles,
      label: 'Summarize',
      onClick: onSummary,
      description: 'Conversation summary',
      enabled: !!onSummary,
    },
    {
      icon: BookMarked,
      label: 'Bookmark',
      onClick: onBookmark,
      description: 'Save this chat',
      enabled: !!onBookmark,
    },
    {
      icon: Download,
      label: 'Export',
      onClick: onExport,
      description: 'Download chat',
      enabled: !!onExport,
    },
  ];

  return (
    <div className="border-t border-border bg-muted/30 py-2 px-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant="ghost"
              size="sm"
              onClick={action.onClick}
              disabled={!action.enabled}
              className="flex items-center gap-2 whitespace-nowrap text-sm hover:bg-background/80 transition-colors"
              title={action.description}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{action.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActionsBar;
