'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  History, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Database,
  Calendar,
  Filter
} from 'lucide-react';

export default function HistoryContent() {
  // Placeholder data - in a real app, this would come from your database
  const historyItems = [
    {
      id: 1,
      jobName: 'Production to Staging Clone',
      status: 'completed',
      startTime: '2024-01-15T10:30:00Z',
      endTime: '2024-01-15T10:32:15Z',
      collections: 12,
      documents: 15420,
      duration: '2m 15s'
    },
    {
      id: 2,
      jobName: 'Backup Database Clone',
      status: 'completed',
      startTime: '2024-01-14T15:45:00Z',
      endTime: '2024-01-14T15:47:30Z',
      collections: 8,
      documents: 8750,
      duration: '2m 30s'
    },
    {
      id: 3,
      jobName: 'Development Sync',
      status: 'failed',
      startTime: '2024-01-13T09:15:00Z',
      endTime: '2024-01-13T09:15:45Z',
      collections: 0,
      documents: 0,
      duration: '45s',
      error: 'Connection timeout'
    }
  ];

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
        
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{historyItems.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {historyItems.filter(item => item.status === 'completed').length}
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
              {historyItems.filter(item => item.status === 'failed').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2m 10s</div>
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
                <div key={item.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
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
                            <span>{item.duration}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Collections:</span>
                      <div className="font-semibold">{item.collections}</div>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Documents:</span>
                      <div className="font-semibold">{item.documents.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Start Time:</span>
                      <div className="font-semibold">{new Date(item.startTime).toLocaleTimeString()}</div>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">End Time:</span>
                      <div className="font-semibold">{new Date(item.endTime).toLocaleTimeString()}</div>
                    </div>
                  </div>
                  
                  {item.error && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                      <strong>Error:</strong> {item.error}
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