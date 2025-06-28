'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Loader2, Database, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function JobList({ jobs }) {
  const [loadingJobs, setLoadingJobs] = useState(new Set());

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
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
              
              return (
                <div
                  key={job._id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base mb-1">{job.jobName}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Created {formatDate(job.createdAt)}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      Ready
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Source:</span>
                        <span className="font-mono text-xs">
                          {job.sourceConnectionString.substring(0, 30)}...
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="font-medium">Destination:</span>
                        <span className="font-mono text-xs">
                          {job.destinationConnectionString.substring(0, 30)}...
                        </span>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleStartClone(job)}
                      disabled={isLoading}
                      size="sm"
                      className="ml-4"
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
  );
}