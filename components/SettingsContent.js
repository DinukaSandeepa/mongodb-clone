'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Shield, 
  Bell, 
  Save,
  RefreshCw,
  Lock,
  Unlock,
  CheckCircle,
  Activity,
  AlertTriangle,
  Mail,
  Send,
  Loader2,
  AlertCircle,
  Info,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { getSettings, saveSettings, resetSettings } from '@/lib/settings';
import logger, { LogLevel, LogCategory } from '@/lib/logger';
import { useConfirmation } from '@/hooks/useConfirmation';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import notificationManager from '@/lib/notifications';

export default function SettingsContent() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState({ configured: false, loading: true });
  const { confirmationState, showConfirmation, handleConfirm, handleCancel } = useConfirmation();

  useEffect(() => {
    // Load settings on component mount
    const loadedSettings = getSettings();
    setSettings(loadedSettings);
    setLoading(false);

    // Log settings page access
    logger.info(LogCategory.USER_ACTION, 'Settings page accessed');

    // Check email configuration status
    checkEmailStatus();

    // Listen for settings changes from other components
    const handleSettingsChange = (event) => {
      setSettings(event.detail);
    };

    window.addEventListener('settingsChanged', handleSettingsChange);
    return () => window.removeEventListener('settingsChanged', handleSettingsChange);
  }, []);

  const checkEmailStatus = async () => {
    try {
      const status = await notificationManager.getEmailStatus();
      setEmailStatus({ ...status, loading: false });
    } catch (error) {
      console.error('Failed to check email status:', error);
      setEmailStatus({ configured: false, loading: false, error: error.message });
    }
  };

  const handleSettingChange = (key, value) => {
    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);

    // Log setting change
    logger.info(LogCategory.SETTINGS, `Setting changed: ${key}`, {
      key,
      oldValue: settings[key],
      newValue: value
    });
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const savedSettings = saveSettings(settings);
      toast.success('Settings saved successfully!', {
        description: 'Your preferences have been updated.',
        icon: <CheckCircle className="h-4 w-4" />
      });

      // Log settings save
      logger.success(LogCategory.SETTINGS, 'Settings saved successfully', {
        settingsCount: Object.keys(settings).length,
        encryptionEnabled: settings.encryptConnections,
        loggingEnabled: settings.logOperations,
        confirmationRequired: settings.requireConfirmation,
        emailNotifications: settings.emailNotifications,
        notificationEmail: settings.notificationEmail ? '***@***.***' : 'not set'
      });
    } catch (error) {
      toast.error('Failed to save settings');
      logger.error(LogCategory.SETTINGS, 'Failed to save settings', {
        error: error.message,
        stack: error.stack
      });
      console.error('Settings save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!settings.notificationEmail) {
      toast.error('Please enter an email address first');
      return;
    }

    setTestingEmail(true);
    
    try {
      const result = await notificationManager.testEmailConfiguration(settings.notificationEmail);
      
      if (result.success) {
        toast.success('Test email sent successfully!', {
          description: 'Check your inbox for the test email.',
          icon: <CheckCircle className="h-4 w-4" />
        });
      } else {
        toast.error('Failed to send test email', {
          description: result.message || 'Please check your email configuration.',
        });
      }
    } catch (error) {
      toast.error('Failed to send test email', {
        description: 'An unexpected error occurred.',
      });
      console.error('Test email error:', error);
    } finally {
      setTestingEmail(false);
    }
  };

  const handleResetSettings = () => {
    const performReset = () => {
      const defaultSettings = resetSettings();
      setSettings(defaultSettings);
      toast.success('Settings reset to defaults', {
        description: 'All preferences have been restored to their default values.',
      });

      // Log settings reset
      logger.warning(LogCategory.SETTINGS, 'Settings reset to defaults', {
        previousSettings: settings,
        newSettings: defaultSettings
      });
    };

    if (settings.requireConfirmation) {
      showConfirmation({
        title: 'Reset All Settings',
        description: 'This will restore all settings to their default values. Any custom configurations will be lost.',
        confirmText: 'Reset Settings',
        variant: 'warning',
        icon: RefreshCw,
        details: (
          <div>
            <h4 className="font-semibold text-yellow-800 mb-2">Settings to be reset:</h4>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>• Security settings (encryption, confirmations)</p>
              <p>• Notification preferences</p>
              <p>• All custom configurations</p>
            </div>
          </div>
        ),
        onConfirm: performReset
      });
    } else {
      performReset();
    }
  };

  const getEmailStatusBadge = () => {
    if (emailStatus.loading) {
      return (
        <Badge variant="outline" className="text-blue-600 border-blue-600">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Checking...
        </Badge>
      );
    }

    if (emailStatus.configured) {
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Configured
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="text-red-600 border-red-600">
        <AlertCircle className="h-3 w-3 mr-1" />
        Not Configured
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure your application preferences and security settings.
          </p>
          {settings.requireConfirmation && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Confirmation dialogs are enabled for destructive operations
              </span>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage security and privacy preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center space-x-3">
                  {settings.encryptConnections ? (
                    <Lock className="h-4 w-4 text-green-600" />
                  ) : (
                    <Unlock className="h-4 w-4 text-orange-600" />
                  )}
                  <div>
                    <Label htmlFor="encryptConnections" className="font-medium">
                      Encrypt connection strings
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {settings.encryptConnections 
                        ? 'Connection strings are encrypted in storage' 
                        : 'Connection strings are stored in plain text'
                      }
                    </p>
                  </div>
                </div>
                <Switch 
                  id="encryptConnections" 
                  checked={settings.encryptConnections || false}
                  onCheckedChange={(checked) => handleSettingChange('encryptConnections', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center space-x-3">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <div>
                    <Label htmlFor="logOperations" className="font-medium">
                      Log all operations
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {settings.logOperations 
                        ? 'All operations are being logged for audit purposes' 
                        : 'Operation logging is disabled'
                      }
                    </p>
                  </div>
                </div>
                <Switch 
                  id="logOperations" 
                  checked={settings.logOperations || false}
                  onCheckedChange={(checked) => handleSettingChange('logOperations', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <div>
                    <Label htmlFor="requireConfirmation" className="font-medium">
                      Require confirmation for destructive operations
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {settings.requireConfirmation 
                        ? 'Confirmation dialogs will appear for dangerous actions' 
                        : 'Destructive operations execute immediately'
                      }
                    </p>
                  </div>
                </div>
                <Switch 
                  id="requireConfirmation" 
                  checked={settings.requireConfirmation || false}
                  onCheckedChange={(checked) => handleSettingChange('requireConfirmation', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.sessionTimeout || 30}
                  onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Configure email notification preferences using OAuth 2.0
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email Configuration Status */}
              <div className="p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Email Service Status</span>
                  </div>
                  {getEmailStatusBadge()}
                </div>
                
                {!emailStatus.configured && !emailStatus.loading && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                    <div className="flex items-start gap-2">
                      <Info className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-blue-700">
                        <p className="font-medium mb-1">Email notifications require OAuth 2.0 setup:</p>
                        <ol className="list-decimal list-inside space-y-1 text-xs">
                          <li>Create Google Cloud Console project</li>
                          <li>Enable Gmail API</li>
                          <li>Create OAuth 2.0 credentials</li>
                          <li>Get refresh token from OAuth Playground</li>
                          <li>Set environment variables</li>
                        </ol>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs text-blue-600 mt-1"
                          onClick={() => window.open('https://developers.google.com/gmail/api/quickstart/nodejs', '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Setup Guide
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {emailStatus.missing && emailStatus.missing.length > 0 && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                    <p className="text-red-700 font-medium">Missing environment variables:</p>
                    <ul className="text-red-600 mt-1">
                      {emailStatus.missing.map(envVar => (
                        <li key={envVar} className="font-mono">• {envVar}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Email Settings */}
              <div className="flex items-center space-x-2">
                <Switch 
                  id="emailNotifications" 
                  checked={settings.emailNotifications || false}
                  onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                  disabled={!emailStatus.configured}
                />
                <Label htmlFor="emailNotifications">Email notifications</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="browserNotifications" 
                  checked={settings.browserNotifications || false}
                  onCheckedChange={(checked) => handleSettingChange('browserNotifications', checked)}
                />
                <Label htmlFor="browserNotifications">Browser notifications</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="successNotifications" 
                  checked={settings.successNotifications || false}
                  onCheckedChange={(checked) => handleSettingChange('successNotifications', checked)}
                />
                <Label htmlFor="successNotifications">Notify on successful operations</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="errorNotifications" 
                  checked={settings.errorNotifications || false}
                  onCheckedChange={(checked) => handleSettingChange('errorNotifications', checked)}
                />
                <Label htmlFor="errorNotifications">Notify on errors</Label>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="notificationEmail">Notification Email</Label>
                <div className="flex gap-2">
                  <Input
                    id="notificationEmail"
                    type="email"
                    value={settings.notificationEmail || ''}
                    onChange={(e) => handleSettingChange('notificationEmail', e.target.value)}
                    placeholder="admin@example.com"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestEmail}
                    disabled={testingEmail || !settings.notificationEmail || !emailStatus.configured}
                    className="gap-2"
                  >
                    {testingEmail ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Test
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {emailStatus.configured 
                    ? 'Enter email address to receive notifications and test the configuration'
                    : 'Configure OAuth 2.0 credentials to enable email notifications'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button 
            className="gap-2" 
            onClick={handleSaveSettings}
            disabled={saving}
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleResetSettings}
            disabled={saving}
          >
            <RefreshCw className="h-4 w-4" />
            Reset to Defaults
          </Button>
        </div>
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