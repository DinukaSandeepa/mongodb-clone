'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Download, 
  Trash2, 
  Search, 
  Filter,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Bug,
  Calendar,
  Clock,
  RefreshCw,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import logger, { LogLevel, LogCategory } from '@/lib/logger';
import { useConfirmation } from '@/hooks/useConfirmation';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import { getSetting } from '@/lib/settings';

export default function LogViewer() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { confirmationState, showConfirmation, handleConfirm, handleCancel } = useConfirmation();

  useEffect(() => {
    loadLogs();
    
    // Listen for real-time log updates
    const handleLogsUpdated = (event) => {
      setLogs(event.detail.logs);
      setStats(logger.getLogStats());
    };

    window.addEventListener('logsUpdated', handleLogsUpdated);
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(loadLogs, 5000);
    
    return () => {
      window.removeEventListener('logsUpdated', handleLogsUpdated);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, levelFilter, categoryFilter]);

  const loadLogs = () => {
    try {
      const allLogs = logger.getLogs();
      const logStats = logger.getLogStats();
      setLogs(allLogs);
      setStats(logStats);
      
      // Add some test logs if none exist and logging is enabled
      if (allLogs.length === 0 && logger.isLoggingEnabled()) {
        logger.info(LogCategory.SYSTEM, 'Log viewer opened - no existing logs found');
        logger.info(LogCategory.USER_ACTION, 'User accessed operation logs');
        // Reload after adding test logs
        setTimeout(() => {
          const updatedLogs = logger.getLogs();
          const updatedStats = logger.getLogStats();
          setLogs(updatedLogs);
          setStats(updatedStats);
        }, 100);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Failed to load logs');
    } finally {
      setIsLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by level
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(log => log.category === categoryFilter);
    }

    setFilteredLogs(filtered);
  };

  const handleClearLogs = () => {
    const requireConfirmation = getSetting('requireConfirmation');

    const performClear = () => {
      logger.clearLogs();
      loadLogs();
      toast.success('All logs cleared successfully');
    };

    if (requireConfirmation) {
      showConfirmation({
        title: 'Clear All Logs',
        description: 'This action cannot be undone. All operation logs will be permanently deleted from local storage.',
        confirmText: 'Clear Logs',
        variant: 'destructive',
        icon: Trash2,
        details: (
          <div>
            <h4 className="font-semibold text-red-800 mb-2">Logs to be cleared:</h4>
            <p className="text-red-700 font-medium">{stats.total || 0} total log entries</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div className="text-red-600">Errors: {stats.byLevel?.[LogLevel.ERROR] || 0}</div>
              <div className="text-red-600">Warnings: {stats.byLevel?.[LogLevel.WARNING] || 0}</div>
              <div className="text-red-600">Success: {stats.byLevel?.[LogLevel.SUCCESS] || 0}</div>
              <div className="text-red-600">Info: {stats.byLevel?.[LogLevel.INFO] || 0}</div>
            </div>
          </div>
        ),
        requiresTyping: true,
        confirmationText: 'CLEAR LOGS',
        onConfirm: performClear
      });
    } else {
      performClear();
    }
  };

  const handleExportLogs = () => {
    logger.exportLogs();
    toast.success('Logs exported successfully');
  };

  const handleRefresh = () => {
    setIsLoading(true);
    loadLogs();
    toast.success('Logs refreshed');
  };

  const handleGenerateTestLogs = () => {
    // Generate some test logs for demonstration
    logger.info(LogCategory.USER_ACTION, 'Test log generated by user');
    logger.success(LogCategory.SYSTEM, 'Test success operation completed');
    logger.warning(LogCategory.DATABASE, 'Test warning - connection timeout increased');
    logger.error(LogCategory.CLONE_OPERATION, 'Test error - simulated failure', {
      errorCode: 'TEST_ERROR',
      timestamp: new Date().toISOString()
    });
    
    loadLogs();
    toast.success('Test logs generated');
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case LogLevel.ERROR:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case LogLevel.WARNING:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case LogLevel.SUCCESS:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case LogLevel.DEBUG:
        return <Bug className="h-4 w-4 text-purple-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLevelBadge = (level) => {
    const variants = {
      [LogLevel.ERROR]: 'destructive',
      [LogLevel.WARNING]: 'secondary',
      [LogLevel.SUCCESS]: 'default',
      [LogLevel.INFO]: 'outline',
      [LogLevel.DEBUG]: 'secondary'
    };

    return (
      <Badge variant={variants[level] || 'outline'} className="text-xs">
        {level.toUpperCase()}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatCategory = (category) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading operation logs...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Status Banner */}
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-800">
                Operation Logging: {logger.isLoggingEnabled() ? 'Enabled' : 'Disabled'}
              </p>
              <p className="text-sm text-blue-600">
                {logger.isLoggingEnabled() 
                  ? `${stats.total || 0} logs captured` 
                  : 'Enable logging in settings to track operations'
                }
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {process.env.NODE_ENV === 'development' && (
              <Button variant="outline" size="sm" onClick={handleGenerateTestLogs}>
                <Bug className="h-4 w-4 mr-2" />
                Generate Test Logs
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Errors</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.byLevel?.[LogLevel.ERROR] || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warnings</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.byLevel?.[LogLevel.WARNING] || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.byLevel?.[LogLevel.SUCCESS] || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Operation Logs
            </CardTitle>
            <CardDescription>
              View and manage all system operation logs
              {getSetting('requireConfirmation') && (
                <span className="block mt-1 text-xs text-yellow-600">
                  ⚠️ Confirmation required for destructive operations
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value={LogLevel.ERROR}>Error</SelectItem>
                  <SelectItem value={LogLevel.WARNING}>Warning</SelectItem>
                  <SelectItem value={LogLevel.SUCCESS}>Success</SelectItem>
                  <SelectItem value={LogLevel.INFO}>Info</SelectItem>
                  <SelectItem value={LogLevel.DEBUG}>Debug</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.values(LogCategory).map(category => (
                    <SelectItem key={category} value={category}>
                      {formatCategory(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportLogs} disabled={logs.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={handleClearLogs} disabled={logs.length === 0}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>

            {/* Log Entries */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No logs found</p>
                  <p className="text-sm">
                    {logs.length === 0 
                      ? logger.isLoggingEnabled() 
                        ? 'No operations have been logged yet. Try performing some actions to see logs appear here.'
                        : 'Operation logging is disabled. Enable it in settings to start tracking operations.'
                      : 'Try adjusting your search or filter criteria.'
                    }
                  </p>
                  {logs.length === 0 && logger.isLoggingEnabled() && process.env.NODE_ENV === 'development' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleGenerateTestLogs}
                      className="mt-4"
                    >
                      <Bug className="h-4 w-4 mr-2" />
                      Generate Test Logs
                    </Button>
                  )}
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getLevelIcon(log.level)}
                        <span className="font-medium">{log.message}</span>
                        {getLevelBadge(log.level)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatTimestamp(log.timestamp)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <Badge variant="outline" className="text-xs">
                        {formatCategory(log.category)}
                      </Badge>
                      {log.url && log.url !== 'N/A' && (
                        <span className="font-mono text-xs truncate max-w-xs">
                          {log.url}
                        </span>
                      )}
                    </div>

                    {Object.keys(log.details).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                          View Details
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmationState.isOpen}
        onOpenChange={handleCancel}
        onConfirm={handleConfirm}
        title={confirmationState.title}
        description={confirmationState.description}
        confirmText={confirmationState.confirmText}
        cancelText={confirmationState.cancelText}
        variant={confirmationState.variant}
        icon={confirmationState.icon}
        details={confirmationState.details}
        requiresTyping={confirmationState.requiresTyping}
        confirmationText={confirmationState.confirmationText}
        isLoading={confirmationState.isLoading}
      />
    </>
  );
}