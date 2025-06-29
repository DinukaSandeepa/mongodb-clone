export const LogLevel = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success',
  DEBUG: 'debug',
};

export const LogCategory = {
  CLONE_OPERATION: 'clone_operation',
  JOB_MANAGEMENT: 'job_management',
  SETTINGS: 'settings',
  AUTHENTICATION: 'authentication',
  DATABASE: 'database',
  SYSTEM: 'system',
  USER_ACTION: 'user_action',
};

class Logger {
  info(category, message, details) {
    console.log(`[INFO] [${category}] ${message}`, details || '');
  }
  warning(category, message, details) {
    console.warn(`[WARNING] [${category}] ${message}`, details || '');
  }
  error(category, message, details) {
    console.error(`[ERROR] [${category}] ${message}`, details || '');
  }
  success(category, message, details) {
    console.log(`[SUCCESS] [${category}] ${message}`, details || '');
  }
  debug(category, message, details) {
    console.debug(`[DEBUG] [${category}] ${message}`, details || '');
  }
}

const logger = new Logger();
export default logger; 