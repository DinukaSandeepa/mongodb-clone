import emailService from '@/lib/email';

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
  async log(level, category, message, details = {}) {
    const logMessage = `[${level.toUpperCase()}] [${category}] ${message}`;
    const logDetails = details ? JSON.stringify(details, null, 2) : '';
    const fullLog = `${logMessage}${logDetails ? '\n' + logDetails : ''}`;

    switch (level) {
      case LogLevel.ERROR:
        console.error(fullLog);
        if (process.env.GOOGLE_USER_EMAIL) {
          try {
            await emailService.sendEmail({
              to: process.env.GOOGLE_USER_EMAIL,
              subject: `MongoDB Clone Manager - ERROR: ${message}`,
              html: `<p><strong>Category:</strong> ${category}</p><p><strong>Message:</strong> ${message}</p><pre>${logDetails}</pre>`,
            });
            console.log(`Email sent for ERROR log: ${message}`);
          } catch (e) {
            console.error(`Failed to send email for ERROR log: ${e.message}`);
          }
        }
        break;
      case LogLevel.WARNING:
        console.warn(fullLog);
        if (process.env.GOOGLE_USER_EMAIL) {
          try {
            await emailService.sendEmail({
              to: process.env.GOOGLE_USER_EMAIL,
              subject: `MongoDB Clone Manager - WARNING: ${message}`,
              html: `<p><strong>Category:</strong> ${category}</p><p><strong>Message:</strong> ${message}</p><pre>${logDetails}</pre>`,
            });
            console.log(`Email sent for WARNING log: ${message}`);
          } catch (e) {
            console.error(`Failed to send email for WARNING log: ${e.message}`);
          }
        }
        break;
      case LogLevel.INFO:
        console.log(fullLog);
        break;
      case LogLevel.SUCCESS:
        console.log(fullLog);
        break;
      case LogLevel.DEBUG:
        console.debug(fullLog);
        break;
      default:
        console.log(fullLog);
    }
  }

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

const logger = new Logger();
export default logger; 