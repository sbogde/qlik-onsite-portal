import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { qlikService } from '@/lib/qlik';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle, AlertCircle, Database, Globe } from 'lucide-react';

interface ConnectionStatus {
  connected: boolean;
  loading: boolean;
  error: string | null;
  appInfo?: any;
}

export const QlikConnectionConfig: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    loading: false,
    error: null
  });
  const [config, setConfig] = useState({
    host: '',
    port: 4848,
    appId: '',
    secure: false
  });
  const { toast } = useToast();

  // Pre-configured demo environments
  const demoConfigs = [
    {
      name: 'Consumer Sales Demo',
      description: 'Retail analytics with sales, products, and customer data',
      host: 'sense-demo.qlik.com',
      port: 443,
      appId: 'ConsumerSales.qvf',
      secure: true,
      objectIds: {
        'sales-kpi': 'Sales KPI',
        'product-trends': 'Product Performance',
        'customer-analysis': 'Customer Segments',
        'regional-sales': 'Regional Breakdown'
      }
    },
    {
      name: 'Local Qlik Sense',
      description: 'Connect to your local Qlik Sense Desktop or Server',
      host: 'localhost',
      port: 4848,
      appId: '',
      secure: false,
      objectIds: {}
    }
  ];

  const handleConnect = async () => {
    if (!config.host || !config.appId) {
      toast({
        title: "Missing Configuration",
        description: "Please provide host and app ID",
        variant: "destructive"
      });
      return;
    }

    setStatus({ connected: false, loading: true, error: null });

    try {
      const success = await qlikService.connect(config);
      
      if (success) {
        // Get app info to verify connection
        const appInfo = await qlikService.getAppInfo();
        
        setStatus({
          connected: true,
          loading: false,
          error: null,
          appInfo
        });

        toast({
          title: "Connected Successfully",
          description: `Connected to ${config.appId} on ${config.host}`,
          variant: "default"
        });
      } else {
        throw new Error('Failed to establish connection');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setStatus({
        connected: false,
        loading: false,
        error: errorMessage
      });

      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleDisconnect = async () => {
    await qlikService.disconnect();
    setStatus({
      connected: false,
      loading: false,
      error: null
    });

    toast({
      title: "Disconnected",
      description: "Successfully disconnected from Qlik Sense",
      variant: "default"
    });
  };

  const loadDemoConfig = (demo: typeof demoConfigs[0]) => {
    setConfig({
      host: demo.host,
      port: demo.port,
      appId: demo.appId,
      secure: demo.secure
    });
  };

  return (
    <Card className="shadow-card bg-gradient-subtle">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-analytics rounded-lg flex items-center justify-center">
            <Database className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-analytics-slate">Qlik Sense Connection</CardTitle>
            <CardDescription>Configure connection to your Qlik Sense server</CardDescription>
          </div>
          <div className="ml-auto">
            <Badge 
              variant={status.connected ? "default" : "secondary"} 
              className={status.connected ? "bg-green-500 hover:bg-green-600" : ""}
            >
              {status.connected ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Disconnected
                </>
              )}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="demos">Demo Configs</TabsTrigger>
            <TabsTrigger value="manual">Manual Setup</TabsTrigger>
          </TabsList>

          <TabsContent value="demos" className="space-y-4">
            <div className="grid gap-4">
              {demoConfigs.map((demo, index) => (
                <Card key={index} className="border border-border/50 hover:border-border transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Globe className="h-4 w-4 text-analytics-blue" />
                          <h4 className="font-medium text-analytics-slate">{demo.name}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{demo.description}</p>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Host: {demo.host}:{demo.port}</div>
                          <div>App: {demo.appId}</div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadDemoConfig(demo)}
                      >
                        Load Config
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host">Host</Label>
                <Input
                  id="host"
                  placeholder="localhost or your-server.com"
                  value={config.host}
                  onChange={(e) => setConfig({ ...config, host: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  placeholder="4848"
                  value={config.port}
                  onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 4848 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appId">App ID</Label>
              <Input
                id="appId"
                placeholder="ConsumerSales.qvf or your-app-id"
                value={config.appId}
                onChange={(e) => setConfig({ ...config, appId: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="secure"
                checked={config.secure}
                onChange={(e) => setConfig({ ...config, secure: e.target.checked })}
                className="rounded border-border"
              />
              <Label htmlFor="secure">Use HTTPS/WSS (secure connection)</Label>
            </div>
          </TabsContent>
        </Tabs>

        {status.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{status.error}</AlertDescription>
          </Alert>
        )}

        {status.connected && status.appInfo && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Connected to app: <strong>{status.appInfo.title || config.appId}</strong>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          {!status.connected ? (
            <Button 
              onClick={handleConnect} 
              disabled={status.loading || !config.host || !config.appId}
              className="bg-gradient-analytics hover:shadow-analytics"
            >
              {status.loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect to Qlik Sense'
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleDisconnect}
              variant="outline"
            >
              Disconnect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};