import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { useState } from 'react';

export function InstallPrompt() {
  const { isInstallable, isInstalled, installApp, canInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  // Don't show if already installed, not installable, or dismissed
  if (isInstalled || !isInstallable || !canInstall || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      <Alert className="border-blue-200 bg-blue-50">
        <Download className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-sm">
            Install this app for a better experience!
          </span>
          <div className="flex gap-2 ml-2">
            <Button
              size="sm"
              onClick={handleInstall}
              className="h-8 px-3"
            >
              Install
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}