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
  }

  getLoggingEnabled() {
    if (typeof window === 'undefined') return false;
    
    try {
      const settings = localStorage.getItem('mongodb-clone-settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        return parsed.logOperations || false;
      }
    } catch (error) {
      console.error('Error checking logging settings:', error);
    }
    return false;
  }

  setupEventListeners() {
    if (typeof window === 'undefined') return;
    
    // Listen for settings changes
    window.addEventListener('settingsChanged', (event) => {
      this.isEnabled = event.detail.logOperations || false;
    });
  }

  log(level, category, message, details = {}) {
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
    
    // Also log to console for development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = level === 'error' ? 'error' : 
                           level === 'warning' ? 'warn' : 'log';
      console[consoleMethod](`[${category.toUpperCase()}] ${message}`, details);
    }
  }

  saveLog(logEntry) {
    if (typeof window === 'undefined') return;
    
    try {
      const existingLogs = this.getLogs();
      const updatedLogs = [logEntry, ...existingLogs].slice(0, MAX_LOGS);
      localStorage.setItem(LOG_KEY, JSON.stringify(updatedLogs));
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
      this.log(LogLevel.INFO, LogCategory.SYSTEM, 'Operation logs cleared');
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
    
    this.log(LogLevel.INFO, LogCategory.SYSTEM, 'Operation logs exported');
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