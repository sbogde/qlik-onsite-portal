import React from 'react';
import { QlikObjectContainer } from '@/components/QlikObjectContainer';
import { QlikConnectionConfig } from '@/components/QlikConnectionConfig';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-analytics-slate mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Overview of key performance indicators and metrics</p>
      </div>

      <QlikConnectionConfig />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QlikObjectContainer
          objectId="sales-kpi"
          title="Sales KPI Overview"
          height="300px"
        />
        <QlikObjectContainer
          objectId="revenue-trend"
          title="Revenue Trends"
          height="300px"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <QlikObjectContainer
          objectId="product-performance"
          title="Product Performance"
          height="350px"
        />
        <QlikObjectContainer
          objectId="regional-sales"
          title="Regional Sales"
          height="350px"
        />
        <QlikObjectContainer
          objectId="customer-segments"
          title="Customer Segments"
          height="350px"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <QlikObjectContainer
          objectId="top-products-table"
          title="Top Performing Products"
          height="400px"
        />
      </div>
    </div>
  );
};

export default Dashboard;