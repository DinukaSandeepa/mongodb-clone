'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Database, 
  Copy, 
  Settings, 
  History, 
  Plus, 
  Menu, 
  X,
  Activity,
  Shield,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Sidebar({ activeTab, onTabChange, jobCount = 0 }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Database,
      description: 'Overview and quick actions'
    },
    {
      id: 'jobs',
      label: 'Clone Jobs',
      icon: Copy,
      description: 'Manage cloning jobs',
      badge: jobCount > 0 ? jobCount : null
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
      description: 'View past operations'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'Application settings'
    }
  ];

  const features = [
    {
      icon: Zap,
      title: 'Fast Streaming',
      description: 'Efficient batch processing'
    },
    {
      icon: Shield,
      title: 'Secure',
      description: 'Protected connections'
    },
    {
      icon: Activity,
      title: 'Real-time',
      description: 'Live progress tracking'
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 z-50 h-screen bg-white border-r border-border transition-all duration-300 ease-in-out flex flex-col",
        "lg:relative lg:translate-x-0",
        isCollapsed ? "-translate-x-full lg:w-16" : "translate-x-0 w-80"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MongoDB Clone</h1>
                <p className="text-xs text-muted-foreground">Database Manager</p>
              </div>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "h-8 w-8 p-0",
              isCollapsed && "mx-auto"
            )}
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          {/* Navigation */}
          <div className="p-4 space-y-2">
            {!isCollapsed && (
              <div className="px-2 py-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Navigation
                </p>
              </div>
            )}
            
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-11",
                    isCollapsed && "justify-center px-2",
                    isActive && "bg-primary/10 text-primary border border-primary/20"
                  )}
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.description}
                        </div>
                      </div>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Button>
              );
            })}
          </div>

          {!isCollapsed && (
            <>
              <Separator className="mx-4" />
              
              {/* Quick Actions */}
              <div className="p-4 space-y-3">
                <div className="px-2 py-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Quick Actions
                  </p>
                </div>
                
                <Button 
                  className="w-full justify-start gap-3 h-11"
                  onClick={() => onTabChange('jobs')}
                >
                  <Plus className="h-5 w-5" />
                  <span>New Clone Job</span>
                </Button>
              </div>

              <Separator className="mx-4" />

              {/* Features */}
              <div className="p-4 space-y-3">
                <div className="px-2 py-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Features
                  </p>
                </div>
                
                <div className="space-y-3">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div key={index} className="flex items-center gap-3 px-2 py-2">
                        <div className="p-1.5 bg-muted rounded-md">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{feature.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer - only show when not collapsed */}
        {!isCollapsed && (
          <div className="p-4 border-t bg-muted/30 flex-shrink-0">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                MongoDB Clone Manager v1.0
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Built with Next.js & shadcn/ui
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}