'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { deleteCloneJob } from '@/app/actions/clone-job-actions';
import { useConfirmation } from '@/hooks/useConfirmation';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import { getSetting } from '@/lib/settings';

export default function JobDeleteDialog({ job, open, onOpenChange, onJobDeleted }) {
  const [isLoading, setIsLoading] = useState(false);
  const { confirmationState, showConfirmation, handleConfirm, handleCancel } = useConfirmation();

  const handleDelete = async () => {
    if (!job) return;

    const requireConfirmation = getSetting('requireConfirmation');

    const performDelete = async () => {
      setIsLoading(true);
      
      try {
        const result = await deleteCloneJob(job._id);
        
        if (result.success) {
          toast.success(result.message);
          onOpenChange(false);
          if (onJobDeleted) {
            onJobDeleted();
          }
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error('An unexpected error occurred');
        console.error('Delete error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (requireConfirmation) {
      showConfirmation({
        title: 'Delete Clone Job',
        description: 'This action cannot be undone. This will permanently delete the clone job and remove all associated data.',
        confirmText: 'Delete Job',
        variant: 'destructive',
        icon: AlertTriangle,
        details: (
          <div>
            <h4 className="font-semibold text-red-800 mb-2">Job to be deleted:</h4>
            <p className="text-red-700 font-medium">{job.jobName}</p>
            <p className="text-sm text-red-600 mt-1">
              Created: {new Date(job.createdAt).toLocaleDateString()}
            </p>
          </div>
        ),
        requiresTyping: true,
        confirmationText: job.jobName,
        onConfirm: performDelete
      });
    } else {
      await performDelete();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Clone Job
            </DialogTitle>
            <DialogDescription>
              {getSetting('requireConfirmation') 
                ? 'Click "Delete Job" to proceed with confirmation.'
                : 'This action cannot be undone. This will permanently delete the clone job and remove all associated data.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {job && (
            <div className="py-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">Job to be deleted:</h4>
                <p className="text-red-700 font-medium">{job.jobName}</p>
                <p className="text-sm text-red-600 mt-1">
                  Created: {new Date(job.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Job
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={confirmationState.isOpen}
        onOpenChange={handleCancel}
        onConfirm={handleConfirm}
        title={confirmationState.title}
        description={confirmationState.description}
        confirmText={confirmationState.confirmText}
        cancelText={confirmationState.cancelText}
        variant={confirmationState.variant}
        icon={confirmationState.icon}
        details={confirmationState.details}
        requiresTyping={confirmationState.requiresTyping}
        confirmationText={confirmationState.confirmationText}
        isLoading={confirmationState.isLoading}
      />
    </>
  );
}