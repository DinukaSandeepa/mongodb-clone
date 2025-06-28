'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardContent from '@/components/DashboardContent';
import JobsContent from '@/components/JobsContent';
import HistoryContent from '@/components/HistoryContent';
import SettingsContent from '@/components/SettingsContent';
import { getCloneJobs } from '@/app/actions/clone-job-actions';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const fetchedJobs = await getCloneJobs();
        setJobs(fetchedJobs);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent jobs={jobs} />;
      case 'jobs':
        return <JobsContent jobs={jobs} />;
      case 'history':
        return <HistoryContent />;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        jobCount={jobs.length}
      />
      
      {/* Main Content */}
      <div className="flex-1 lg:pl-0">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}