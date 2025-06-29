'use client';

import { getSetting } from '@/lib/settings';

// Notification manager for handling different types of notifications (client-side only)
class NotificationManager {
  constructor() {
    this.isClient = typeof window !== 'undefined';
  }

  async sendCloneSuccessNotification(jobDetails) {
    const settings = this.getNotificationSettings();
    if (!settings.emailNotifications || !settings.successNotifications || !settings.notificationEmail) {
      return { success: true, message: 'Email notifications for success are disabled or email not configured' };
    }
    // Call API from client
    try {
      const response = await fetch('/api/email/clone-success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobDetails: { ...jobDetails, notificationEmail: settings.notificationEmail } 
        })
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async sendCloneErrorNotification(jobDetails, error) {
    const settings = this.getNotificationSettings();
    if (!settings.emailNotifications || !settings.errorNotifications || !settings.notificationEmail) {
      return { success: true, message: 'Email notifications for errors are disabled or email not configured' };
    }
    // Call API from client
    try {
      const response = await fetch('/api/email/clone-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobDetails: { ...jobDetails, notificationEmail: settings.notificationEmail }, 
          error 
        })
      });
      return await response.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  async testEmailConfiguration(email) {
    const settings = this.getNotificationSettings();
    if (!settings.emailNotifications || !email) {
      return { success: false, message: 'Email notifications are disabled or email address is empty' };
    }
    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return await response.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  async getEmailStatus() {
    try {
      const response = await fetch('/api/email/status');
      return await response.json();
    } catch (err) {
      return { configured: false, message: err.message };
    }
  }

  sendBrowserNotification(title, body, type = 'info') {
    if (!this.isClient) return;
    const settings = this.getNotificationSettings();

    if (!settings.browserNotifications) return;

    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.showNotification(title, body, type);
        }
      });
    } else if (Notification.permission === 'granted') {
      this.showNotification(title, body, type);
    }
  }

  showNotification(title, body, type) {
    const options = {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'mongodb-clone-' + Date.now(),
      requireInteraction: type === 'error',
      timestamp: Date.now()
    };
    try {
      const notification = new Notification(title, options);
      if (type === 'success') {
        setTimeout(() => notification.close(), 5000);
      }
    } catch (e) {}
  }

  getNotificationSettings() {
    // Retrieve settings using the client-side getSetting function
    return {
      emailNotifications: getSetting('emailNotifications'),
      browserNotifications: getSetting('browserNotifications'),
      successNotifications: getSetting('successNotifications'),
      errorNotifications: getSetting('errorNotifications'),
      notificationEmail: getSetting('notificationEmail'),
    };
  }
}

const notificationManager = new NotificationManager();
export default notificationManager;