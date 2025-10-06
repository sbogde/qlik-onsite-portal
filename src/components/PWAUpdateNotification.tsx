import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, X } from 'lucide-react';

export function PWAUpdateNotification() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setShowUpdatePrompt(false);
  };

  useEffect(() => {
    if (needRefresh) {
      setShowUpdatePrompt(true);
    }
  }, [needRefresh]);

  if (!showUpdatePrompt && !offlineReady) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      {needRefresh && (
        <Alert className="border-blue-200 bg-blue-50">
          <RefreshCw className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">
              New version available! Reload to update.
            </span>
            <div className="flex gap-2 ml-2">
              <Button
                size="sm"
                onClick={() => updateServiceWorker(true)}
                className="h-8 px-3"
              >
                Reload
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={close}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {offlineReady && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">
              App ready to work offline!
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={close}
              className="h-8 w-8 p-0 ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}