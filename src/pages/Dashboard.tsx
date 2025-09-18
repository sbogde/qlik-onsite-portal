import React from 'react';
import { QlikObjectContainer } from '@/components/QlikObjectContainer';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-analytics-slate mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Overview of key performance indicators and metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QlikObjectContainer
          objectId="dashboard-kpi-1"
          title="Revenue Overview"
          height="300px"
        />
        <QlikObjectContainer
          objectId="dashboard-kpi-2"
          title="Sales Performance"
          height="300px"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <QlikObjectContainer
          objectId="dashboard-chart-1"
          title="Monthly Trends"
          height="350px"
        />
        <QlikObjectContainer
          objectId="dashboard-chart-2"
          title="Regional Breakdown"
          height="350px"
        />
        <QlikObjectContainer
          objectId="dashboard-chart-3"
          title="Customer Segments"
          height="350px"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <QlikObjectContainer
          objectId="dashboard-table-1"
          title="Top Performing Products"
          height="400px"
        />
      </div>
    </div>
  );
};

export default Dashboard;