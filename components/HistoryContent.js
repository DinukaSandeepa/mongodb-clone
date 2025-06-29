'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
} from 'lucide-react';
import { getCloneHistory, getCloneStats } from '@/app/actions/clone-history-actions';

export default function HistoryContent() {
  const [historyItems, setHistoryItems] = useState([]);
  const [stats, setStats] = useState({
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    avgDuration: '0s',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [historyResult, statsResult] = await Promise.all([
          getCloneHistory(),
          getCloneStats()
        ]);
        
        if (historyResult.success) {
          setHistoryItems(historyResult.history || []);
        }
        
        if (statsResult.success) {
          setStats(statsResult.stats);
        }
      } catch (error) {
        console.error('Error fetching history data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Running</Badge>;
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

  const formatDuration = (durationMs) => {
    if (!durationMs) return 'N/A';
    
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Operation History</h1>
          <p className="text-muted-foreground">Loading history data...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Operation History</h1>
          <p className="text-muted-foreground">
            View and analyze your past cloning operations.
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOperations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.successfulOperations}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.failedOperations}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDuration}</div>
          </CardContent>
        </Card>
      </div>

      {/* History List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Operations
          </CardTitle>
          <CardDescription>
            Detailed history of your cloning operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No history yet</p>
              <p className="text-sm">Your operation history will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {historyItems.map((item) => (
                <div key={item._id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(item.status)}
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-1">{item.jobName}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(item.startTime)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDuration(item.duration)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Collections:</span>
                      <div className="font-semibold">{item.collections || 0}</div>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Documents:</span>
                      <div className="font-semibold">{(item.documents || 0).toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Start Time:</span>
                      <div className="font-semibold">{new Date(item.startTime).toLocaleTimeString()}</div>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">End Time:</span>
                      <div className="font-semibold">
                        {item.endTime ? new Date(item.endTime).toLocaleTimeString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                  
                  {item.sourceDatabase && item.destinationDatabase && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Source DB:</span>
                        <div className="font-mono text-xs bg-muted px-2 py-1 rounded mt-1">
                          {item.sourceDatabase}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Destination DB:</span>
                        <div className="font-mono text-xs bg-muted px-2 py-1 rounded mt-1">
                          {item.destinationDatabase}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {item.errorMessage && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                      <strong>Error:</strong> {item.errorMessage}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}