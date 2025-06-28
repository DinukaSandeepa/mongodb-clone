'use client';

// Settings management for client-side preferences
const SETTINGS_KEY = 'mongodb-clone-settings';

const defaultSettings = {
  encryptConnections: true,
  autoRetry: true,
  logOperations: true, // Default to true
  requireConfirmation: true,
  emailNotifications: true,
  browserNotifications: true,
  successNotifications: true,
  errorNotifications: true,
  enableCaching: true,
  compressionEnabled: true,
  connectionTimeout: 15000,
  batchSize: 1000,
  defaultDatabase: 'busbuddy',
  sessionTimeout: 30,
  maxConcurrent: 3,
  memoryLimit: 512,
  notificationEmail: '',
};

export function getSettings() {
  if (typeof window === 'undefined') return defaultSettings;
  
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure logOperations defaults to true if not set
      return { 
        ...defaultSettings, 
        ...parsed,
        logOperations: parsed.logOperations !== false // Default to true unless explicitly false
      };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  
  return defaultSettings;
}

export function saveSettings(settings) {
  if (typeof window === 'undefined') return;
  
  try {
    const currentSettings = getSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
    
    // Dispatch custom event for settings change
    window.dispatchEvent(new CustomEvent('settingsChanged', { 
      detail: updatedSettings 
    }));
    
    return updatedSettings;
  } catch (error) {
    console.error('Error saving settings:', error);
    return settings;
  }
}

export function resetSettings() {
  if (typeof window === 'undefined') return defaultSettings;
  
  try {
    localStorage.removeItem(SETTINGS_KEY);
    window.dispatchEvent(new CustomEvent('settingsChanged', { 
      detail: defaultSettings 
    }));
    return defaultSettings;
  } catch (error) {
    console.error('Error resetting settings:', error);
    return defaultSettings;
  }
}

export function getSetting(key) {
  const settings = getSettings();
  return settings[key];
}

export function setSetting(key, value) {
  const settings = getSettings();
  return saveSettings({ ...settings, [key]: value });
}