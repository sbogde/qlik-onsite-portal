import React from 'react';
import { QlikConnectionConfig } from '@/components/QlikConnectionConfig';

const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-analytics-slate mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage Qlik Sense connection and configuration</p>
      </div>

      <QlikConnectionConfig />
    </div>
  );
};

export default Settings;
