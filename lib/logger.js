'use client';

// Operation logging system
const LOG_KEY = 'mongodb-clone-logs';
const MAX_LOGS = 1000; // Maximum number of logs to keep

export const LogLevel = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success',
  DEBUG: 'debug'
};

export const LogCategory = {
  CLONE_OPERATION: 'clone_operation',
  JOB_MANAGEMENT: 'job_management',
  SETTINGS: 'settings',
  AUTHENTICATION: 'authentication',
  DATABASE: 'database',
  SYSTEM: 'system',
  USER_ACTION: 'user_action'
};

class Logger {
  constructor() {
    this.isEnabled = this.getLoggingEnabled();
    this.setupEventListeners();
    
    // Initialize with a welcome log if logging is enabled
    if (this.isEnabled) {
      this.log(LogLevel.INFO, LogCategory.SYSTEM, 'Logger initialized successfully', {
        maxLogs: MAX_LOGS,
        timestamp: new Date().toISOString()
      });
    }
  }

  getLoggingEnabled() {
    if (typeof window === 'undefined') return false;
    
    try {
      const settings = localStorage.getItem('mongodb-clone-settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        return parsed.logOperations !== false; // Default to true if not explicitly set to false
      }
    } catch (error) {
      console.error('Error checking logging settings:', error);
    }
    return true; // Default to enabled
  }

  setupEventListeners() {
    if (typeof window === 'undefined') return;
    
    // Listen for settings changes
    window.addEventListener('settingsChanged', (event) => {
      const wasEnabled = this.isEnabled;
      this.isEnabled = event.detail.logOperations !== false;
      
      // Log the change
      if (this.isEnabled) {
        this.log(LogLevel.INFO, LogCategory.SETTINGS, 
          wasEnabled ? 'Logging remains enabled' : 'Logging has been enabled', 
          { previousState: wasEnabled, newState: this.isEnabled }
        );
      }
    });
  }

  log(level, category, message, details = {}) {
    // Always log to console in development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = level === 'error' ? 'error' : 
                           level === 'warning' ? 'warn' : 'log';
      console[consoleMethod](`[${category.toUpperCase()}] ${message}`, details);
    }

    // Only save to localStorage if enabled
    if (!this.isEnabled) return;
    
    const logEntry = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      details,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
      url: typeof window !== 'undefined' ? window.location.href : 'N/A'
    };

    this.saveLog(logEntry);
  }

  saveLog(logEntry) {
    if (typeof window === 'undefined') return;
    
    try {
      const existingLogs = this.getLogs();
      const updatedLogs = [logEntry, ...existingLogs].slice(0, MAX_LOGS);
      localStorage.setItem(LOG_KEY, JSON.stringify(updatedLogs));
      
      // Dispatch event for real-time updates
      window.dispatchEvent(new CustomEvent('logsUpdated', { 
        detail: { logs: updatedLogs, newLog: logEntry }
      }));
    } catch (error) {
      console.error('Error saving log:', error);
    }
  }

  getLogs() {
    if (typeof window === 'undefined') return [];
    
    try {
      const logs = localStorage.getItem(LOG_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('Error retrieving logs:', error);
      return [];
    }
  }

  clearLogs() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(LOG_KEY);
      
      // Dispatch event for real-time updates
      window.dispatchEvent(new CustomEvent('logsUpdated', { 
        detail: { logs: [], cleared: true }
      }));
      
      // Log the clear action if logging is enabled
      if (this.isEnabled) {
        this.log(LogLevel.INFO, LogCategory.SYSTEM, 'Operation logs cleared');
      }
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  }

  exportLogs() {
    const logs = this.getLogs();
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mongodb-clone-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    this.log(LogLevel.INFO, LogCategory.SYSTEM, 'Operation logs exported', {
      logCount: logs.length,
      exportTime: new Date().toISOString()
    });
  }

  getLogStats() {
    const logs = this.getLogs();
    const stats = {
      total: logs.length,
      byLevel: {},
      byCategory: {},
      recent: logs.slice(0, 10)
    };

    logs.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
    });

    return stats;
  }

  // Force enable logging (for testing)
  forceEnable() {
    this.isEnabled = true;
    this.log(LogLevel.INFO, LogCategory.SYSTEM, 'Logging force enabled for testing');
  }

  // Check if logging is currently enabled
  isLoggingEnabled() {
    return this.isEnabled;
  }

  // Convenience methods
  info(category, message, details) {
    this.log(LogLevel.INFO, category, message, details);
  }

  warning(category, message, details) {
    this.log(LogLevel.WARNING, category, message, details);
  }

  error(category, message, details) {
    this.log(LogLevel.ERROR, category, message, details);
  }

  success(category, message, details) {
    this.log(LogLevel.SUCCESS, category, message, details);
  }

  debug(category, message, details) {
    this.log(LogLevel.DEBUG, category, message, details);
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;