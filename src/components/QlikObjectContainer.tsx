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

        // This is a placeholder for the actual Qlik object rendering
        // In a real implementation, you would use the qlikService here
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
        
        // Simulate random success/error for demo
        if (Math.random() > 0.7) {
          throw new Error(`Failed to load object: ${objectId}`);
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setLoading(false);
      }
    };

    if (objectId) {
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
        className="bg-gradient-subtle rounded-lg border border-border p-4 flex items-center justify-center"
      >
        <div className="text-center text-muted-foreground">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-analytics rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-primary/20 rounded-full animate-pulse"></div>
          </div>
          <p className="text-sm">Qlik Object: {objectId}</p>
          <p className="text-xs mt-1 opacity-70">Visualization will render here</p>
        </div>
      </div>
    </Card>
  );
};