'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Database, 
  Shield, 
  Bell, 
  Zap,
  Save,
  RefreshCw
} from 'lucide-react';

export default function SettingsContent() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your application preferences and connection settings.
        </p>
      </div>

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
              <Label htmlFor="defaultTimeout">Connection Timeout (ms)</Label>
              <Input
                id="defaultTimeout"
                type="number"
                placeholder="15000"
                defaultValue="15000"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="batchSize">Batch Size</Label>
              <Input
                id="batchSize"
                type="number"
                placeholder="1000"
                defaultValue="1000"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="defaultDatabase">Default Database Name</Label>
              <Input
                id="defaultDatabase"
                placeholder="busbuddy"
                defaultValue="busbuddy"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="autoRetry" defaultChecked />
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
            <div className="flex items-center space-x-2">
              <Switch id="encryptConnections" defaultChecked />
              <Label htmlFor="encryptConnections">Encrypt connection strings</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="logOperations" defaultChecked />
              <Label htmlFor="logOperations">Log all operations</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="requireConfirmation" defaultChecked />
              <Label htmlFor="requireConfirmation">Require confirmation for destructive operations</Label>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                placeholder="30"
                defaultValue="30"
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
                placeholder="3"
                defaultValue="3"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="memoryLimit">Memory Limit (MB)</Label>
              <Input
                id="memoryLimit"
                type="number"
                placeholder="512"
                defaultValue="512"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="enableCaching" defaultChecked />
              <Label htmlFor="enableCaching">Enable result caching</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="compressionEnabled" defaultChecked />
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
              <Switch id="emailNotifications" defaultChecked />
              <Label htmlFor="emailNotifications">Email notifications</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="browserNotifications" defaultChecked />
              <Label htmlFor="browserNotifications">Browser notifications</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="successNotifications" defaultChecked />
              <Label htmlFor="successNotifications">Notify on successful operations</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="errorNotifications" defaultChecked />
              <Label htmlFor="errorNotifications">Notify on errors</Label>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label htmlFor="notificationEmail">Notification Email</Label>
              <Input
                id="notificationEmail"
                type="email"
                placeholder="admin@example.com"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button className="gap-2">
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
        
        <Button variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}