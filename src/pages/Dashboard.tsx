import React, { useEffect } from 'react';
import { QlikObjectContainer } from '@/components/QlikObjectContainer';
import { testQlikConnection } from '@/qlik/session';

const Dashboard: React.FC = () => {
  useEffect(() => {
    testQlikConnection().catch((err) => console.error('Qlik test failed:', err));
  }, []);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-analytics-slate mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Overview of key performance indicators and metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QlikObjectContainer
          objectId="JRNGq"
          title="Margin %"
          height="300px"
        />
        <QlikObjectContainer
          objectId="JRVHPjJ"
          title="Sales Over Time"
          height="300px"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <QlikObjectContainer
          objectId="PJTJWqx"
          title="Sales $ by Product"
          height="350px"
        />
        <QlikObjectContainer
          objectId="zPERD"
          title="Sales by State"
          height="350px"
        />
        <QlikObjectContainer
          objectId="ngAuD"
          title="Sales by Channel"
          height="350px"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <QlikObjectContainer
          objectId="RSfXpWZ"
          title="TY Sales"
          height="400px"
        />
      </div>
    </div>
  );
};

export default Dashboard;
