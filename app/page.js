'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardContent from '@/components/DashboardContent';
import JobsContent from '@/components/JobsContent';
import HistoryContent from '@/components/HistoryContent';
import SettingsContent from '@/components/SettingsContent';
import LogViewer from '@/components/LogViewer';
import { getCloneJobs } from '@/app/actions/clone-job-actions';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchJobs = async () => {
    try {
      const result = await getCloneJobs();
      
      if (result.success) {
        setJobs(result.jobs || []);
      } else {
        console.error('Failed to fetch jobs:', result.error);
        setError(result.error);
        setJobs([]); // Set empty array as fallback
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError(error.message);
      setJobs([]); // Set empty array as fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleJobsChange = () => {
    fetchJobs();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent jobs={jobs} />;
      case 'jobs':
        return <JobsContent jobs={jobs} onJobsChange={handleJobsChange} />;
      case 'history':
        return <HistoryContent />;
      case 'logs':
        return <LogViewer />;
      case 'settings':
        return <SettingsContent />;
      default:
        return <DashboardContent jobs={jobs} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-muted-foreground mb-2">Error loading data</p>
          <p className="text-sm text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        jobCount={jobs.length}
      />
      
      {/* Main Content */}
      <div className="flex-1 overflow-scroll h-screen">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}