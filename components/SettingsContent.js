'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Database, 
  Shield, 
  Bell, 
  Zap,
  Save,
  RefreshCw,
  Lock,
  Unlock,
  CheckCircle,
  FileText,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { getSettings, saveSettings, resetSettings } from '@/lib/settings';
import LogViewer from '@/components/LogViewer';
import logger, { LogLevel, LogCategory } from '@/lib/logger';

export default function SettingsContent() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load settings on component mount
    const loadedSettings = getSettings();
    setSettings(loadedSettings);
    setLoading(false);

    // Log settings page access
    logger.info(LogCategory.USER_ACTION, 'Settings page accessed');

    // Listen for settings changes from other components
    const handleSettingsChange = (event) => {
      setSettings(event.detail);
    };

    window.addEventListener('settingsChanged', handleSettingsChange);
    return () => window.removeEventListener('settingsChanged', handleSettingsChange);
  }, []);

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
        loggingEnabled: settings.logOperations
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

  const handleResetSettings = () => {
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
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
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your application preferences and connection settings.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General Settings
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Operation Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Database Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Settings
                </CardTitle>
                <CardDescription>
                  Configure default database connection parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="connectionTimeout">Connection Timeout (ms)</Label>
                  <Input
                    id="connectionTimeout"
                    type="number"
                    value={settings.connectionTimeout || 15000}
                    onChange={(e) => handleSettingChange('connectionTimeout', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="batchSize">Batch Size</Label>
                  <Input
                    id="batchSize"
                    type="number"
                    value={settings.batchSize || 1000}
                    onChange={(e) => handleSettingChange('batchSize', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="defaultDatabase">Default Database Name</Label>
                  <Input
                    id="defaultDatabase"
                    value={settings.defaultDatabase || 'busbuddy'}
                    onChange={(e) => handleSettingChange('defaultDatabase', e.target.value)}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="autoRetry" 
                    checked={settings.autoRetry || false}
                    onCheckedChange={(checked) => handleSettingChange('autoRetry', checked)}
                  />
                  <Label htmlFor="autoRetry">Auto-retry failed connections</Label>
                </div>
              </CardContent>
            </Card>

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
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="requireConfirmation" 
                    checked={settings.requireConfirmation || false}
                    onCheckedChange={(checked) => handleSettingChange('requireConfirmation', checked)}
                  />
                  <Label htmlFor="requireConfirmation">Require confirmation for destructive operations</Label>
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

            {/* Performance Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Performance Settings
                </CardTitle>
                <CardDescription>
                  Optimize application performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxConcurrent">Max Concurrent Operations</Label>
                  <Input
                    id="maxConcurrent"
                    type="number"
                    value={settings.maxConcurrent || 3}
                    onChange={(e) => handleSettingChange('maxConcurrent', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="memoryLimit">Memory Limit (MB)</Label>
                  <Input
                    id="memoryLimit"
                    type="number"
                    value={settings.memoryLimit || 512}
                    onChange={(e) => handleSettingChange('memoryLimit', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="enableCaching" 
                    checked={settings.enableCaching || false}
                    onCheckedChange={(checked) => handleSettingChange('enableCaching', checked)}
                  />
                  <Label htmlFor="enableCaching">Enable result caching</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="compressionEnabled" 
                    checked={settings.compressionEnabled || false}
                    onCheckedChange={(checked) => handleSettingChange('compressionEnabled', checked)}
                  />
                  <Label htmlFor="compressionEnabled">Enable data compression</Label>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Configure notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="emailNotifications" 
                    checked={settings.emailNotifications || false}
                    onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
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
                  <Input
                    id="notificationEmail"
                    type="email"
                    value={settings.notificationEmail || ''}
                    onChange={(e) => handleSettingChange('notificationEmail', e.target.value)}
                    placeholder="admin@example.com"
                  />
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
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          {settings.logOperations ? (
            <LogViewer />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Operation Logging Disabled</h3>
                <p className="text-muted-foreground mb-4">
                  Enable "Log all operations" in the Security Settings to start tracking system operations.
                </p>
                <Button 
                  onClick={() => handleSettingChange('logOperations', true)}
                  className="gap-2"
                >
                  <Activity className="h-4 w-4" />
                  Enable Logging
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}