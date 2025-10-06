import React, { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { qlikService } from "@/lib/qlik";

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
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const teardownRef = useRef<(() => void) | null>(null);
  const mountNodeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isActive = true;

    const renderVisualisation = async () => {
      if (!isActive) {
        return;
      }

      if (!qlikService.isConnected()) {
        // Stay in loading state until connection is available.
        return;
      }

      try {
        setError(null);
        setLoading(true);
        if (!containerRef.current) {
          return;
        }

        if (teardownRef.current) {
          teardownRef.current();
          teardownRef.current = null;
        }

        if (mountNodeRef.current) {
          containerRef.current.removeChild(mountNodeRef.current);
          mountNodeRef.current = null;
        }

        const mountElement = document.createElement("div");
        mountElement.className = "w-full h-full";
        containerRef.current.appendChild(mountElement);
        mountNodeRef.current = mountElement;

        const tearDown = await qlikService.renderVisualisation({
          element: mountElement,
          objectId,
        });

        if (!isActive) {
          tearDown?.();
          return;
        }

        teardownRef.current = tearDown;
        setLoading(false);
      } catch (err) {
        if (
          mountNodeRef.current &&
          containerRef.current?.contains(mountNodeRef.current)
        ) {
          try {
            containerRef.current.removeChild(mountNodeRef.current);
          } catch (removeError) {
            console.warn(
              "Failed to clean nebula mount node after error:",
              removeError
            );
          }
          mountNodeRef.current = null;
        }
        setError(
          err instanceof Error
            ? err.message
            : "Unable to render Qlik visualisation"
        );
        setLoading(false);
      }
    };

    const handleConnected = () => {
      void renderVisualisation();
    };

    const handleDisconnected = () => {
      if (!isActive) {
        return;
      }
      if (teardownRef.current) {
        teardownRef.current();
        teardownRef.current = null;
      }
      if (containerRef.current) {
        if (mountNodeRef.current) {
          try {
            containerRef.current.removeChild(mountNodeRef.current);
          } catch (error) {
            console.warn("Failed to remove nebula mount node:", error);
          }
          mountNodeRef.current = null;
        }
      }
      setLoading(true);
    };

    qlikService.on("connected", handleConnected);
    qlikService.on("disconnected", handleDisconnected);

    // Attempt immediately in case we're already connected.
    void renderVisualisation();

    return () => {
      isActive = false;
      qlikService.off("connected", handleConnected);
      qlikService.off("disconnected", handleDisconnected);
      if (teardownRef.current) {
        teardownRef.current();
        teardownRef.current = null;
      }
      if (containerRef.current && mountNodeRef.current) {
        try {
          containerRef.current.removeChild(mountNodeRef.current);
        } catch (error) {
          console.warn(
            "Failed to remove nebula mount node during cleanup:",
            error
          );
        }
        mountNodeRef.current = null;
      }
    };
  }, [objectId]);

  return (
    <Card
      className={`p-6 shadow-card transition-smooth hover:shadow-analytics ${className}`}
    >
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-analytics-slate">
          {title}
        </h3>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div
        ref={containerRef}
        style={{ height, position: "relative" }}
        className="bg-gradient-subtle rounded-lg border border-border overflow-hidden"
      >
        {loading && (
          <div className="absolute inset-0 flex flex-col gap-4 p-6 bg-background/80 backdrop-blur-sm">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="flex-1" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
