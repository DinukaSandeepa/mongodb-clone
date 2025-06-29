'use client';

import emailService from '@/lib/email';
import { getSetting } from '@/lib/settings';
import logger, { LogLevel, LogCategory } from '@/lib/logger';

// Notification manager for handling different types of notifications
class NotificationManager {
  constructor() {
    this.isClient = typeof window !== 'undefined';
  }

  async sendCloneSuccessNotification(jobDetails) {
    const settings = this.getNotificationSettings();
    
    // Log notification attempt
    logger.info(LogCategory.SYSTEM, 'Sending clone success notification', {
      jobName: jobDetails.jobName,
      emailEnabled: settings.emailNotifications,
      browserEnabled: settings.browserNotifications,
      successNotificationsEnabled: settings.successNotifications
    });

    // Check if success notifications are enabled
    if (!settings.successNotifications) {
      logger.debug(LogCategory.SYSTEM, 'Success notifications disabled, skipping');
      return;
    }

    // Send email notification
    if (settings.emailNotifications && settings.notificationEmail) {
      try {
        if (this.isClient) {
          // Call API from client
          const response = await fetch('/api/email/clone-success', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: settings.notificationEmail,
              jobDetails
            })
          });
          
          const result = await response.json();
          if (result.success) {
            logger.success(LogCategory.SYSTEM, 'Clone success email sent', {
              jobName: jobDetails.jobName,
              email: settings.notificationEmail
            });
          } else {
            logger.error(LogCategory.SYSTEM, 'Failed to send clone success email', {
              error: result.message
            });
          }
        } else {
          // Server-side call
          const result = await emailService.sendCloneSuccessNotification(
            settings.notificationEmail, 
            jobDetails
          );
          
          if (result.success) {
            logger.success(LogCategory.SYSTEM, 'Clone success email sent', {
              jobName: jobDetails.jobName,
              email: settings.notificationEmail
            });
          }
        }
      } catch (error) {
        logger.error(LogCategory.SYSTEM, 'Error sending clone success email', {
          error: error.message,
          jobName: jobDetails.jobName
        });
      }
    }

    // Send browser notification
    if (settings.browserNotifications && this.isClient) {
      this.sendBrowserNotification(
        '✅ Clone Operation Successful',
        `${jobDetails.jobName} completed successfully`,
        'success'
      );
    }
  }

  async sendCloneErrorNotification(jobDetails, error) {
    const settings = this.getNotificationSettings();
    
    // Log notification attempt
    logger.info(LogCategory.SYSTEM, 'Sending clone error notification', {
      jobName: jobDetails.jobName,
      emailEnabled: settings.emailNotifications,
      browserEnabled: settings.browserNotifications,
      errorNotificationsEnabled: settings.errorNotifications,
      error: error
    });

    // Check if error notifications are enabled
    if (!settings.errorNotifications) {
      logger.debug(LogCategory.SYSTEM, 'Error notifications disabled, skipping');
      return;
    }

    // Send email notification
    if (settings.emailNotifications && settings.notificationEmail) {
      try {
        if (this.isClient) {
          // Call API from client
          const response = await fetch('/api/email/clone-error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: settings.notificationEmail,
              jobDetails,
              error
            })
          });
          
          const result = await response.json();
          if (result.success) {
            logger.success(LogCategory.SYSTEM, 'Clone error email sent', {
              jobName: jobDetails.jobName,
              email: settings.notificationEmail
            });
          } else {
            logger.error(LogCategory.SYSTEM, 'Failed to send clone error email', {
              error: result.message
            });
          }
        } else {
          // Server-side call
          const result = await emailService.sendCloneErrorNotification(
            settings.notificationEmail, 
            jobDetails,
            error
          );
          
          if (result.success) {
            logger.success(LogCategory.SYSTEM, 'Clone error email sent', {
              jobName: jobDetails.jobName,
              email: settings.notificationEmail
            });
          }
        }
      } catch (emailError) {
        logger.error(LogCategory.SYSTEM, 'Error sending clone error email', {
          error: emailError.message,
          jobName: jobDetails.jobName
        });
      }
    }

    // Send browser notification
    if (settings.browserNotifications && this.isClient) {
      this.sendBrowserNotification(
        '❌ Clone Operation Failed',
        `${jobDetails.jobName} failed: ${error}`,
        'error'
      );
    }
  }

  sendBrowserNotification(title, body, type = 'info') {
    if (!this.isClient) return;

    // Check if browser notifications are supported
    if (!('Notification' in window)) {
      logger.warning(LogCategory.SYSTEM, 'Browser notifications not supported');
      return;
    }

    // Request permission if needed
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.showNotification(title, body, type);
        } else {
          logger.warning(LogCategory.SYSTEM, 'Browser notification permission denied');
        }
      });
    } else if (Notification.permission === 'granted') {
      this.showNotification(title, body, type);
    }
  }

  showNotification(title, body, type) {
    const options = {
      body,
      icon: type === 'success' ? '/favicon.ico' : '/favicon.ico', // You can add different icons
      badge: '/favicon.ico',
      tag: 'mongodb-clone-' + Date.now(),
      requireInteraction: type === 'error', // Keep error notifications visible
      timestamp: Date.now()
    };

    try {
      const notification = new Notification(title, options);
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close success notifications after 5 seconds
      if (type === 'success') {
        setTimeout(() => notification.close(), 5000);
      }

      logger.debug(LogCategory.SYSTEM, 'Browser notification shown', {
        title,
        type
      });
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to show browser notification', {
        error: error.message,
        title
      });
    }
  }

  getNotificationSettings() {
    if (!this.isClient) {
      // Return default settings on server
      return {
        emailNotifications: false,
        browserNotifications: false,
        successNotifications: false,
        errorNotifications: false,
        notificationEmail: ''
      };
    }

    return {
      emailNotifications: getSetting('emailNotifications'),
      browserNotifications: getSetting('browserNotifications'),
      successNotifications: getSetting('successNotifications'),
      errorNotifications: getSetting('errorNotifications'),
      notificationEmail: getSetting('notificationEmail')
    };
  }

  async testEmailConfiguration(email) {
    if (!this.isClient) return { success: false, message: 'Client-side only' };

    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const result = await response.json();
      
      logger.info(LogCategory.SYSTEM, 'Email test completed', {
        success: result.success,
        email,
        message: result.message
      });

      return result;
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Email test failed', {
        error: error.message,
        email
      });

      return {
        success: false,
        message: 'Failed to test email configuration',
        error: error.message
      };
    }
  }

  async getEmailStatus() {
    if (!this.isClient) return { configured: false };

    try {
      const response = await fetch('/api/email/status');
      const result = await response.json();
      return result;
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to get email status', {
        error: error.message
      });
      return { configured: false, error: error.message };
    }
  }
}

// Create singleton instance
const notificationManager = new NotificationManager();

export default notificationManager;