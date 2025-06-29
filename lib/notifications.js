'use client';

// Notification manager for handling different types of notifications (client-side only)
class NotificationManager {
  constructor() {
    this.isClient = typeof window !== 'undefined';
  }

  async sendCloneSuccessNotification(jobDetails) {
    // Call API from client
    try {
      const response = await fetch('/api/email/clone-success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDetails })
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async sendCloneErrorNotification(jobDetails, error) {
    // Call API from client
    try {
      const response = await fetch('/api/email/clone-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDetails, error })
      });
      return await response.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  async testEmailConfiguration(email) {
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
      new Notification(title, options);
    } catch (e) {}
  }
}

const notificationManager = new NotificationManager();
export default notificationManager;