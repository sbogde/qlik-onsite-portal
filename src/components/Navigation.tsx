import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  BarChart3,
  LineChart,
  FileText,
  Activity,
  Database
} from 'lucide-react';
import { qlikService } from '@/lib/qlik';

const navItems = [
  {
    path: '/',
    label: 'Dashboard',
    icon: BarChart3,
    description: 'Main overview and KPIs'
  },
  {
    path: '/analytics',
    label: 'Analytics',
    icon: LineChart,
    description: 'Deep dive analysis'
  },
  {
    path: '/reports',
    label: 'Reports',
    icon: FileText,
    description: 'Detailed reporting'
  }
];

export const Navigation: React.FC = () => {
  const location = useLocation();
  const [connected, setConnected] = useState(qlikService.isConnected());

  useEffect(() => {
    const handleConnected = () => setConnected(true);
    const handleDisconnected = () => setConnected(false);

    qlikService.on('connected', handleConnected);
    qlikService.on('disconnected', handleDisconnected);

    return () => {
      qlikService.off('connected', handleConnected);
      qlikService.off('disconnected', handleDisconnected);
    };
  }, []);

  const indicatorColor = connected ? 'bg-green-500' : 'bg-red-500';
  const statusText = connected ? 'Connected to Qlik Sense' : 'Disconnected from Qlik Sense';

  return (
    <Card className="p-6 shadow-card bg-gradient-subtle">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-analytics rounded-lg flex items-center justify-center">
          <Database className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-analytics-slate">Qlik Sense</h2>
          <p className="text-sm text-muted-foreground">Analytics Mashup</p>
        </div>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start gap-3 h-auto p-4 transition-spring ${
                  isActive 
                    ? "bg-gradient-analytics shadow-analytics text-white" 
                    : "hover:bg-accent/50 hover:shadow-card"
                }`}
              >
                <Icon className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">{item.label}</div>
                  <div className={`text-xs ${isActive ? 'text-white/80' : 'text-muted-foreground'}`}>
                    {item.description}
                  </div>
                </div>
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 p-4 bg-accent/30 rounded-lg border border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-4 w-4 text-analytics-blue" />
          <span className="text-sm font-medium text-analytics-slate">Connection Status</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${indicatorColor} animate-pulse`}></div>
          <span className="text-xs text-muted-foreground">{statusText}</span>
        </div>
      </div>
    </Card>
  );
};
