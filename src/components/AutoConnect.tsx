import { useEffect, useRef } from 'react';
import { qlikService } from '@/lib/qlik';
import { consumerSalesDemoConfig } from '@/components/QlikConnectionConfig';

export const AutoConnect: React.FC = () => {
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (attemptedRef.current) {
      return;
    }

    attemptedRef.current = true;

    const connect = async () => {
      try {
        if (!qlikService.isConnected()) {
          await qlikService.connect(consumerSalesDemoConfig);
        }
      } catch (error) {
        console.warn('Auto-connect to Qlik Sense failed:', error);
      }
    };

    void connect();
  }, []);

  return null;
};
