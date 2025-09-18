import React from 'react';
import { QlikObjectContainer } from '@/components/QlikObjectContainer';

const Analytics: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-analytics-slate mb-2">Analytics</h1>
        <p className="text-muted-foreground">Deep dive analysis and advanced visualizations</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <QlikObjectContainer
          objectId="analytics-main-1"
          title="Advanced Time Series Analysis"
          height="450px"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QlikObjectContainer
          objectId="analytics-scatter-1"
          title="Correlation Analysis"
          height="400px"
        />
        <QlikObjectContainer
          objectId="analytics-heatmap-1"
          title="Performance Heatmap"
          height="400px"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <QlikObjectContainer
          objectId="analytics-funnel-1"
          title="Conversion Funnel"
          height="350px"
        />
        <QlikObjectContainer
          objectId="analytics-waterfall-1"
          title="Waterfall Analysis"
          height="350px"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <QlikObjectContainer
          objectId="analytics-detailed-table"
          title="Detailed Analytics Data"
          height="500px"
        />
      </div>
    </div>
  );
};

export default Analytics;