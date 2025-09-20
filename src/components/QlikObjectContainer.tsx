import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface QlikObjectContainerProps {
  objectId: string;
  title?: string;
  height?: string;
  className?: string;
}

export const QlikObjectContainer: React.FC<QlikObjectContainerProps> = ({
  objectId,
  title,
  height = "400px",
  className = ""
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    let unsubscribe: (() => void) | undefined;

    const initialise = async () => {
      try {
        setLoading(true);
        setError(null);

        const { qlikService } = await import('@/lib/qlik');

        const renderObject = async () => {
          try {
            const result = await qlikService.getObject(objectId);

            if (containerRef.current && result.object) {
              containerRef.current.innerHTML = '';
              await result.object.show(containerRef.current);
            }

            if (isActive) {
              setLoading(false);
            }
          } catch (loadError) {
            if (!isActive) {
              return;
            }
            setError(
              loadError instanceof Error ? loadError.message : 'Unknown error occurred'
            );
            setLoading(false);
          }
        };

        if (qlikService.isConnected()) {
          await renderObject();
        } else {
          const handleConnected = () => {
            if (!isActive) {
              return;
            }
            void renderObject();
          };

          qlikService.on('connected', handleConnected);
          unsubscribe = () => qlikService.off('connected', handleConnected);
        }
      } catch (err) {
        if (!isActive) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setLoading(false);
      }
    };

    if (objectId && containerRef.current) {
      void initialise();
    }

    return () => {
      isActive = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [objectId]);

  if (loading) {
    return (
      <Card className="p-6 shadow-card transition-smooth hover:shadow-analytics">
        {title && <h3 className="text-lg font-semibold mb-4 text-analytics-slate">{title}</h3>}
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-32 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 shadow-card">
        {title && <h3 className="text-lg font-semibold mb-4 text-analytics-slate">{title}</h3>}
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <Card className={`p-6 shadow-card transition-smooth hover:shadow-analytics ${className}`}>
      {title && <h3 className="text-lg font-semibold mb-4 text-analytics-slate">{title}</h3>}
      <div 
        ref={containerRef}
        style={{ height }}
        className="bg-gradient-subtle rounded-lg border border-border overflow-hidden"
      />
    </Card>
  );
};
