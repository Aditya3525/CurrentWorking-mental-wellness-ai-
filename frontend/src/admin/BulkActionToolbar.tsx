import { CheckCircle, Trash2, XCircle, Tag, Layout } from 'lucide-react';
import React from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

interface BulkActionToolbarProps {
  selectedCount: number;
  entityType: 'assessments' | 'practices' | 'content';
  onPublish?: () => void;
  onUnpublish?: () => void;
  onDelete: () => void;
  onUpdateTags?: () => void;
  onUpdateApproach?: () => void;
  onUpdateType?: () => void;
  onClearSelection: () => void;
  isLoading?: boolean;
}

export const BulkActionToolbar: React.FC<BulkActionToolbarProps> = ({
  selectedCount,
  entityType,
  onPublish,
  onUnpublish,
  onDelete,
  onUpdateTags,
  onUpdateApproach,
  onUpdateType,
  onClearSelection,
  isLoading = false
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const handleDelete = () => {
    onDelete();
    setDeleteDialogOpen(false);
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
        <div className="bg-card border rounded-lg shadow-lg p-4 flex items-center gap-4">
          <Badge variant="secondary" className="px-3 py-1">
            {selectedCount} selected
          </Badge>

          <div className="flex items-center gap-2">
            {/* Publish/Unpublish Actions */}
            {onPublish && (
              <Button
                size="sm"
                variant="outline"
                onClick={onPublish}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Publish
              </Button>
            )}

            {onUnpublish && (
              <Button
                size="sm"
                variant="outline"
                onClick={onUnpublish}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Unpublish
              </Button>
            )}

            {/* More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" disabled={isLoading}>
                  <Layout className="h-4 w-4 mr-2" />
                  More Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {onUpdateTags && (
                  <DropdownMenuItem onClick={onUpdateTags}>
                    <Tag className="h-4 w-4 mr-2" />
                    Update Tags
                  </DropdownMenuItem>
                )}

                {onUpdateApproach && (
                  <DropdownMenuItem onClick={onUpdateApproach}>
                    <Layout className="h-4 w-4 mr-2" />
                    Update Approach
                  </DropdownMenuItem>
                )}

                {onUpdateType && (
                  <DropdownMenuItem onClick={onUpdateType}>
                    <Layout className="h-4 w-4 mr-2" />
                    Update Type
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Delete Button */}
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>

            {/* Clear Selection */}
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearSelection}
              disabled={isLoading}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} {entityType}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected {entityType}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete {selectedCount} {entityType}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BulkActionToolbar;
