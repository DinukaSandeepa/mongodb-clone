'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Play, 
  Loader2, 
  Database, 
  Calendar, 
  Lock, 
  Eye, 
  EyeOff, 
  MoreVertical,
  Edit,
  Trash2,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { maskConnectionString, isEncrypted } from '@/lib/encryption';
import JobEditDialog from '@/components/JobEditDialog';
import JobDeleteDialog from '@/components/JobDeleteDialog';

export default function JobList({ jobs, onJobsChange }) {
  const [loadingJobs, setLoadingJobs] = useState(new Set());
  const [showConnectionStrings, setShowConnectionStrings] = useState(new Set());
  const [editingJob, setEditingJob] = useState(null);
  const [deletingJob, setDeletingJob] = useState(null);

  const handleStartClone = async (job) => {
    setLoadingJobs(prev => new Set(prev).add(job._id));
    
    try {
      const response = await fetch(`/api/clone/${job._id}`, {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message, {
          description: result.stats ? 
            `Processed ${result.stats.processedCollections} of ${result.stats.totalCollections} collections` : 
            undefined
        });
      } else {
        toast.error(result.message || 'Clone failed');
      }
    } catch (error) {
      console.error('Clone error:', error);
      toast.error('An error occurred during cloning');
    } finally {
      setLoadingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(job._id);
        return newSet;
      });
    }
  };

  const handleDuplicateJob = async (job) => {
    try {
      // Create a new job with the same data but different name
      const formData = new FormData();
      formData.append('jobName', `${job.jobName} (Copy)`);
      formData.append('sourceConnectionString', job.sourceConnectionString);
      formData.append('destinationConnectionString', job.destinationConnectionString);

      const { createCloneJob } = await import('@/app/actions/clone-job-actions');
      const result = await createCloneJob(formData);
      
      if (result.success) {
        toast.success('Job duplicated successfully!');
        if (onJobsChange) {
          onJobsChange();
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Duplicate error:', error);
      toast.error('Failed to duplicate job');
    }
  };

  const toggleConnectionStringVisibility = (jobId) => {
    setShowConnectionStrings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getConnectionStringDisplay = (connectionString, jobId) => {
    const isVisible = showConnectionStrings.has(jobId);
    
    if (!isVisible) {
      return maskConnectionString(connectionString);
    }
    
    return connectionString;
  };

  const handleJobUpdated = () => {
    if (onJobsChange) {
      onJobsChange();
    }
  };

  const handleJobDeleted = () => {
    if (onJobsChange) {
      onJobsChange();
    }
  };

  return (
    <>
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Clone Jobs ({jobs.length})
          </CardTitle>
          <CardDescription>
            Manage and execute your database cloning jobs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No jobs created yet</p>
              <p className="text-sm">Create your first clone job to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => {
                const isLoading = loadingJobs.has(job._id);
                const isVisible = showConnectionStrings.has(job._id);
                const hasEncryptedStrings = job.encrypted;
                
                return (
                  <div
                    key={job._id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-base">{job.jobName}</h3>
                          {hasEncryptedStrings && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Lock className="h-3 w-3" />
                              Encrypted
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Created {formatDate(job.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="ml-2">
                          Ready
                        </Badge>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setEditingJob(job)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Job
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateJob(job)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate Job
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setDeletingJob(job)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Job
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground flex-1">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Source:</span>
                            <span className="font-mono text-xs break-all">
                              {getConnectionStringDisplay(job.sourceConnectionString, job._id)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="font-medium">Destination:</span>
                            <span className="font-mono text-xs break-all">
                              {getConnectionStringDisplay(job.destinationConnectionString, job._id)}
                            </span>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleConnectionStringVisibility(job._id)}
                          className="ml-2 h-8 w-8 p-0"
                          title={isVisible ? 'Hide connection strings' : 'Show connection strings'}
                        >
                          {isVisible ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end">
                      <Button
                        onClick={() => handleStartClone(job)}
                        disabled={isLoading}
                        size="sm"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Cloning...
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Start Clone
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <JobEditDialog
        job={editingJob}
        open={!!editingJob}
        onOpenChange={(open) => !open && setEditingJob(null)}
        onJobUpdated={handleJobUpdated}
      />

      {/* Delete Dialog */}
      <JobDeleteDialog
        job={deletingJob}
        open={!!deletingJob}
        onOpenChange={(open) => !open && setDeletingJob(null)}
        onJobDeleted={handleJobDeleted}
      />
    </>
  );
}