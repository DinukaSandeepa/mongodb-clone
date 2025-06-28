'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Database, 
  Copy, 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Server,
  Zap,
  XCircle
} from 'lucide-react';
import { getCloneStats } from '@/app/actions/clone-history-actions';

export default function DashboardContent({ jobs = [] }) {
  const [stats, setStats] = useState({
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    successRate: 0,
    avgDuration: '0s',
  });
  const [dbHealth, setDbHealth] = useState({
    status: 'checking',
    message: 'Checking connection...',
    database: null
  });
  const [apiPerformance, setApiPerformance] = useState({
    status: 'checking',
    statusColor: 'blue',
    responseTime: 'Checking...',
    message: 'Checking API performance...'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsResult, healthResult, performanceResult] = await Promise.all([
          getCloneStats(),
          fetch('/api/health').then(res => res.json()).catch(() => ({ 
            success: false, 
            status: 'error', 
            message: 'Health check failed' 
          })),
          fetch('/api/performance').then(res => res.json()).catch(() => ({ 
            success: false, 
            status: 'error', 
            statusColor: 'red',
            responseTime: 'Error',
            message: 'Performance check failed' 
          }))
        ]);
        
        if (statsResult.success) {
          setStats(statsResult.stats);
        }
        
        setDbHealth({
          status: healthResult.success ? healthResult.status : 'error',
          message: healthResult.message || 'Unknown status',
          database: healthResult.database || null
        });

        setApiPerformance({
          status: performanceResult.success ? performanceResult.status : 'error',
          statusColor: performanceResult.statusColor || 'red',
          responseTime: performanceResult.responseTime || 'Error',
          message: performanceResult.message || 'Performance check failed',
          memory: performanceResult.memory
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setDbHealth({
          status: 'error',
          message: 'Failed to check database status',
          database: null
        });
        setApiPerformance({
          status: 'error',
          statusColor: 'red',
          responseTime: 'Error',
          message: 'Failed to check API performance'
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getDbStatusBadge = () => {
    switch (dbHealth.status) {
      case 'connected':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            Connected
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            Mock Mode
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            Error
          </Badge>
        );
      case 'checking':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Checking...
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-600">
            Unknown
          </Badge>
        );
    }
  };

  const getDbStatusIcon = () => {
    switch (dbHealth.status) {
      case 'connected':
        return <Server className="h-4 w-4 text-green-600" />;
      case 'disconnected':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'checking':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Server className="h-4 w-4 text-gray-600" />;
    }
  };

  const getApiStatusBadge = () => {
    const colorClasses = {
      green: 'text-green-600 border-green-600',
      blue: 'text-blue-600 border-blue-600',
      yellow: 'text-yellow-600 border-yellow-600',
      red: 'text-red-600 border-red-600',
    };

    const statusLabels = {
      optimal: 'Optimal',
      good: 'Good',
      moderate: 'Moderate',
      slow: 'Slow',
      error: 'Error',
      checking: 'Checking...',
    };

    return (
      <Badge variant="outline" className={colorClasses[apiPerformance.statusColor] || 'text-gray-600 border-gray-600'}>
        {statusLabels[apiPerformance.status] || 'Unknown'}
      </Badge>
    );
  };

  const getApiStatusIcon = () => {
    const iconClasses = {
      green: 'text-green-600',
      blue: 'text-blue-600',
      yellow: 'text-yellow-600',
      red: 'text-red-600',
    };

    return <Zap className={`h-4 w-4 ${iconClasses[apiPerformance.statusColor] || 'text-gray-600'}`} />;
  };

  const dashboardStats = {
    totalJobs: jobs.length,
    recentJobs: jobs.slice(0, 3),
    ...stats
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your MongoDB cloning operations and manage database synchronization.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalJobs}</div>
            <p className="text-xs text-muted-foreground">
              Clone jobs created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Loading...' : `${dashboardStats.successfulOperations}/${dashboardStats.totalOperations} operations`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Clone Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : dashboardStats.avgDuration}
            </div>
            <p className="text-xs text-muted-foreground">
              Per operation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalOperations}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.failedOperations > 0 && `${dashboardStats.failedOperations} failed`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Jobs
            </CardTitle>
            <CardDescription>
              Your latest cloning operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardStats.recentJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No jobs yet</p>
                <p className="text-sm">Create your first clone job to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardStats.recentJobs.map((job) => (
                  <div key={job._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-md">
                        <Copy className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{job.jobName}</p>
                        <p className="text-sm text-muted-foreground">
                          Created {new Date(job.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">Ready</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              System Status
            </CardTitle>
            <CardDescription>
              Current system performance and connectivity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getDbStatusIcon()}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Database Connection</span>
                    {dbHealth.database && (
                      <span className="text-xs text-muted-foreground">
                        Connected to: {dbHealth.database}
                      </span>
                    )}
                  </div>
                </div>
                {getDbStatusBadge()}
              </div>
              
              {dbHealth.status === 'error' && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                  {dbHealth.message}
                </div>
              )}
              
              {dbHealth.status === 'disconnected' && (
                <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                  Using mock data. Configure MONGODB_URI to connect to a real database.
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getApiStatusIcon()}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">API Performance</span>
                    <span className="text-xs text-muted-foreground">
                      Response time: {apiPerformance.responseTime}
                    </span>
                  </div>
                </div>
                {getApiStatusBadge()}
              </div>

              {apiPerformance.memory && (
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  Memory: {apiPerformance.memory.used}MB used / {apiPerformance.memory.total}MB total
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Avg. Operation Time</span>
                </div>
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  {loading ? 'Loading...' : dashboardStats.avgDuration}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button className="h-20 flex-col gap-2" variant="outline">
              <Copy className="h-6 w-6" />
              <span>New Clone Job</span>
            </Button>
            
            <Button className="h-20 flex-col gap-2" variant="outline">
              <Activity className="h-6 w-6" />
              <span>View History</span>
            </Button>
            
            <Button className="h-20 flex-col gap-2" variant="outline">
              <Database className="h-6 w-6" />
              <span>Test Connection</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}