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
    const loadQlikObject = async () => {
      try {
        setLoading(true);
        setError(null);

        // Import qlikService dynamically to avoid circular dependencies
        const { qlikService } = await import('@/lib/qlik');
        
        if (!qlikService.isConnected()) {
          throw new Error('Not connected to Qlik Sense. Please configure connection first.');
        }

        // Get the actual Qlik object using the hub object ID
        const result = await qlikService.getObject(objectId);
        
        if (containerRef.current && result.object) {
          // Clear the container
          containerRef.current.innerHTML = '';
          
          // Show the object (this will embed the actual Qlik visualization)
          await result.object.show(containerRef.current);
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setLoading(false);
      }
    };

    if (objectId && containerRef.current) {
      loadQlikObject();
    }
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