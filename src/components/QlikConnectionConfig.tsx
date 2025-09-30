import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { qlikService, QlikConfig } from '@/lib/qlik';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle, AlertCircle, Database, Globe } from 'lucide-react';

interface ConnectionStatus {
  connected: boolean;
  loading: boolean;
  error: string | null;
  appInfo?: any;
}

const APP_ID = '372cbc85-f7fb-4db6-a620-9a5367845dce';

const inferredProxy = (() => {
  const wsUrl = import.meta.env.VITE_QLIK_WS_URL;
  try {
    if (wsUrl) {
      const parsed = new URL(wsUrl);
      const secure = parsed.protocol === 'wss:';
      const port = parsed.port
        ? Number(parsed.port)
        : secure
          ? 443
          : 80;

      return {
        host: parsed.hostname,
        port,
        secure,
      } satisfies Pick<QlikConfig, 'host' | 'port' | 'secure'>;
    }
  } catch (error) {
    console.warn('Failed to parse VITE_QLIK_WS_URL for proxy defaults', error);
  }

  return {
    host: 'localhost',
    port: 3000,
    secure: false,
  } satisfies Pick<QlikConfig, 'host' | 'port' | 'secure'>;
})();

export const consumerSalesDemoConfig: QlikConfig = {
  ...inferredProxy,
  appId: APP_ID,
};

export const consumerSalesDemo = {
  name: 'Consumer Sales Demo',
  description: 'Retail analytics with sales, products, and customer data',
  ...consumerSalesDemoConfig,
  objectIds: {
    marginKpi: 'JRNGq',
    salesOverTime: 'JRVHPjJ',
    salesByProduct: 'PJTJWqx',
    salesByState: 'zPERD',
    salesByChannel: 'ngAuD',
    tySalesTable: 'RSfXpWZ'
  }
} as const;

const demoConfigs = [
  {
    name: 'Consumer Sales via Proxy',
    description: 'Connect through the local/proxy bridge (recommended)',
    ...consumerSalesDemoConfig,
    objectIds: consumerSalesDemo.objectIds,
  },
  {
    name: 'Consumer Sales (Direct to Qlik Cloud)',
    description: 'Bypass the proxy and connect to sense-demo.qlik.com',
    host: 'sense-demo.qlik.com',
    port: 443,
    appId: APP_ID,
    secure: true,
    objectIds: consumerSalesDemo.objectIds,
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

const defaultConfig: QlikConfig = { ...consumerSalesDemoConfig };

export const QlikConnectionConfig: React.FC = () => {

  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    loading: false,
    error: null
  });
  const [config, setConfig] = useState(defaultConfig);
  const autoConnectRef = useRef(false);
  const { toast } = useToast();

  const connectToQlik = async (
    connectionConfig: typeof config,
    { silent }: { silent?: boolean } = {}
  ) => {
    if (!connectionConfig.host || !connectionConfig.appId) {
      toast({
        title: "Missing Configuration",
        description: "Please provide host and app ID",
        variant: "destructive"
      });
      return;
    }

    setStatus({ connected: false, loading: true, error: null });

    try {
      const success = await qlikService.connect(connectionConfig);
      
      if (success) {
        // Get app info to verify connection
        const appInfo = await qlikService.getAppInfo();
        
        setStatus({
          connected: true,
          loading: false,
          error: null,
          appInfo
        });

        setConfig(connectionConfig);

        if (!silent) {
          toast({
            title: "Connected Successfully",
            description: `Connected to ${connectionConfig.appId} on ${connectionConfig.host}`,
            variant: "default"
          });
        }
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

      if (!silent) {
        toast({
          title: "Connection Failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
    }
  };

  const handleConnect = async () => {
    await connectToQlik(config);
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

  const loadDemoConfig = (
    demo: typeof demoConfigs[number],
    options: { connect?: boolean; silent?: boolean } = {}
  ) => {
    const nextConfig = {
      host: demo.host,
      port: demo.port,
      appId: demo.appId,
      secure: demo.secure
    };

    setConfig(nextConfig);

    if (options.connect) {
      void connectToQlik(nextConfig, { silent: options.silent });
    }
  };

  useEffect(() => {
    if (autoConnectRef.current) {
      return;
    }

    autoConnectRef.current = true;
    const defaultDemo = demoConfigs[0];

    if (defaultDemo) {
      loadDemoConfig(defaultDemo, { connect: true, silent: true });
    }
  }, []);

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
              role="status"
              aria-live="polite"
              aria-label={status.connected ? "Connected" : "Disconnected"}
              data-testid="connection-status"
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
        <Tabs defaultValue="demos" className="w-full">
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
                        onClick={() => loadDemoConfig(demo, { connect: true })}
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
