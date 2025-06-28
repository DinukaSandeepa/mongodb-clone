'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { createCloneJob } from '@/app/actions/clone-job-actions';
import logger, { LogLevel, LogCategory } from '@/lib/logger';

export default function JobForm({ onJobCreated }) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData) {
    setIsLoading(true);
    
    const jobName = formData.get('jobName');
    const sourceConnectionString = formData.get('sourceConnectionString');
    const destinationConnectionString = formData.get('destinationConnectionString');
    
    // Log job creation attempt
    logger.info(LogCategory.JOB_MANAGEMENT, 'User initiated clone job creation', {
      jobName,
      hasSource: !!sourceConnectionString,
      hasDestination: !!destinationConnectionString,
      timestamp: new Date().toISOString()
    });
    
    try {
      const result = await createCloneJob(formData);
      
      if (result.success) {
        toast.success(result.message);
        
        // Log successful job creation
        logger.success(LogCategory.JOB_MANAGEMENT, 'Clone job created successfully', {
          jobName,
          jobId: result.jobId,
          encrypted: result.jobData?.encrypted || false,
          timestamp: new Date().toISOString()
        });
        
        // Reset form
        document.getElementById('job-form').reset();
        if (onJobCreated) {
          onJobCreated();
        }
      } else {
        toast.error(result.message);
        
        // Log failed job creation
        logger.error(LogCategory.JOB_MANAGEMENT, 'Failed to create clone job', {
          jobName,
          error: result.message,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      
      // Log unexpected error
      logger.error(LogCategory.JOB_MANAGEMENT, 'Unexpected error during job creation', {
        jobName,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="h-5 w-5" />
          Create Clone Job
        </CardTitle>
        <CardDescription>
          Define a new database cloning job with source and destination connection strings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="job-form" action={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="jobName">Job Name</Label>
            <Input
              id="jobName"
              name="jobName"
              placeholder="e.g., Production to Staging Clone"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sourceConnectionString">Source Connection String</Label>
            <Input
              id="sourceConnectionString"
              name="sourceConnectionString"
              type="password"
              placeholder="mongodb://source-host:27017/database"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Connection string will be encrypted when saved
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="destinationConnectionString">Destination Connection String</Label>
            <Input
              id="destinationConnectionString"
              name="destinationConnectionString"
              type="password"
              placeholder="mongodb://destination-host:27017/database"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Connection string will be encrypted when saved
            </p>
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Job...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Job
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}