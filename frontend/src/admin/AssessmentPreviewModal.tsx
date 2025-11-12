import { AlertCircle, CheckCircle, Clock, Hash, Tag, X } from 'lucide-react';
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

interface AssessmentItem {
  id: string;
  name: string;
  type: string;
  category: string;
  description: string | null;
  timeEstimate: string | null;
  isActive: boolean;
  isBasicOverallOnly?: boolean;
  visibleInMainList?: boolean;
  questionCount: number;
  tags?: string;
}

interface AssessmentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessment: AssessmentItem | null;
}

export const AssessmentPreviewModal: React.FC<AssessmentPreviewModalProps> = ({
  open,
  onOpenChange,
  assessment
}) => {
  if (!assessment) return null;

  const parsedTags = assessment.tags 
    ? assessment.tags.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-8">
              <DialogTitle className="text-2xl font-bold mb-2">
                {assessment.name}
              </DialogTitle>
              <DialogDescription className="flex flex-wrap gap-2 items-center">
                <Badge variant="default" className="capitalize">
                  {assessment.type}
                </Badge>
                <Badge variant="outline">{assessment.category}</Badge>
                {assessment.isActive ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Inactive
                  </Badge>
                )}
                {assessment.timeEstimate && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {assessment.timeEstimate}
                  </Badge>
                )}
                <Badge variant="outline" className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {assessment.questionCount} questions
                </Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content Area */}
        <ScrollArea className="flex-1 pr-4">
          <div className="py-4 space-y-6">
            {/* Description */}
            {assessment.description && (
              <div>
                <h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wide">
                  Description
                </h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {assessment.description}
                  </p>
                </div>
              </div>
            )}

            {/* Assessment Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border bg-card p-4">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Assessment Type
                </div>
                <div className="text-lg font-semibold capitalize">
                  {assessment.type}
                </div>
              </div>

              <div className="rounded-lg border bg-card p-4">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Category
                </div>
                <div className="text-lg font-semibold">
                  {assessment.category}
                </div>
              </div>

              <div className="rounded-lg border bg-card p-4">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Question Count
                </div>
                <div className="text-lg font-semibold">
                  {assessment.questionCount}
                </div>
              </div>

              <div className="rounded-lg border bg-card p-4">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Time Estimate
                </div>
                <div className="text-lg font-semibold">
                  {assessment.timeEstimate || 'Not specified'}
                </div>
              </div>
            </div>

            {/* Visibility Settings */}
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                Visibility Settings
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <span className="text-sm font-medium">Status</span>
                  {assessment.isActive ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline">Inactive</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <span className="text-sm font-medium">Visible in Main List</span>
                  {assessment.visibleInMainList ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Yes
                    </Badge>
                  ) : (
                    <Badge variant="outline">No</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <span className="text-sm font-medium">Basic Overall Only</span>
                  {assessment.isBasicOverallOnly ? (
                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                      Yes
                    </Badge>
                  ) : (
                    <Badge variant="outline">No</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            {parsedTags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Tags
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {parsedTags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Note */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-medium mb-1">Preview Note</p>
                  <p className="text-blue-700 dark:text-blue-300">
                    This is how the assessment appears in the admin panel. The actual user-facing 
                    assessment experience includes the full question set and interactive elements.
                  </p>
                </div>
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

export default AssessmentPreviewModal;
