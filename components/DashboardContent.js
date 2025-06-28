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
  Zap
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const result = await getCloneStats();
        if (result.success) {
          setStats(result.stats);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

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
              Current system performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Database Connection</span>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Healthy
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">API Performance</span>
                </div>
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  Optimal
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Avg. Response Time</span>
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