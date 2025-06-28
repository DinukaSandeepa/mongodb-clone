'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { updateCloneJob } from '@/app/actions/clone-job-actions';

export default function JobEditDialog({ job, open, onOpenChange, onJobUpdated }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    jobName: '',
    sourceConnectionString: '',
    destinationConnectionString: '',
  });

  useEffect(() => {
    if (job) {
      setFormData({
        jobName: job.jobName || '',
        sourceConnectionString: job.sourceConnectionString || '',
        destinationConnectionString: job.destinationConnectionString || '',
      });
    }
  }, [job]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!job) return;

    setIsLoading(true);
    
    try {
      const formDataObj = new FormData();
      formDataObj.append('jobName', formData.jobName);
      formDataObj.append('sourceConnectionString', formData.sourceConnectionString);
      formDataObj.append('destinationConnectionString', formData.destinationConnectionString);

      const result = await updateCloneJob(job._id, formDataObj);
      
      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        if (onJobUpdated) {
          onJobUpdated();
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Edit Clone Job
          </DialogTitle>
          <DialogDescription>
            Update the job name and connection strings for this clone job.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-jobName">Job Name</Label>
              <Input
                id="edit-jobName"
                value={formData.jobName}
                onChange={(e) => handleInputChange('jobName', e.target.value)}
                placeholder="e.g., Production to Staging Clone"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-sourceConnectionString">Source Connection String</Label>
              <Input
                id="edit-sourceConnectionString"
                type="password"
                value={formData.sourceConnectionString}
                onChange={(e) => handleInputChange('sourceConnectionString', e.target.value)}
                placeholder="mongodb://source-host:27017/database"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Connection string will be encrypted when saved
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-destinationConnectionString">Destination Connection String</Label>
              <Input
                id="edit-destinationConnectionString"
                type="password"
                value={formData.destinationConnectionString}
                onChange={(e) => handleInputChange('destinationConnectionString', e.target.value)}
                placeholder="mongodb://destination-host:27017/database"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Connection string will be encrypted when saved
              </p>
            </div>
          </div>
          
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Job
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}