'use client';

import { useState } from 'react';
import JobForm from '@/components/JobForm';
import JobList from '@/components/JobList';

export default function JobsContent({ jobs, onJobsChange }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleJobsChange = () => {
    setRefreshKey(prev => prev + 1);
    if (onJobsChange) {
      onJobsChange();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Clone Jobs</h1>
        <p className="text-muted-foreground">
          Create and manage your MongoDB database cloning operations.
        </p>
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Job Creation Form */}
        <div>
          <JobForm onJobCreated={handleJobsChange} />
        </div>

        {/* Right Column - Job List */}
        <div>
          <JobList jobs={jobs} onJobsChange={handleJobsChange} />
        </div>
      </div>
    </div>
  );
}