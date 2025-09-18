import React from 'react';
import { QlikObjectContainer } from '@/components/QlikObjectContainer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Calendar, Filter } from 'lucide-react';

const Reports: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-analytics-slate mb-2">Reports</h1>
        <p className="text-muted-foreground">Comprehensive reporting and data exports</p>
      </div>

      <Card className="p-6 shadow-card bg-gradient-subtle">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-analytics-slate mb-1">Report Controls</h3>
            <p className="text-sm text-muted-foreground">Customize and export your reports</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            <Button variant="default" size="sm" className="gap-2 bg-gradient-analytics">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QlikObjectContainer
          objectId="reports-summary-1"
          title="Executive Summary"
          height="350px"
        />
        <QlikObjectContainer
          objectId="reports-metrics-1"
          title="Key Metrics Report"
          height="350px"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <QlikObjectContainer
          objectId="reports-detailed-1"
          title="Detailed Financial Report"
          height="500px"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <QlikObjectContainer
          objectId="reports-trend-1"
          title="Trend Analysis"
          height="300px"
        />
        <QlikObjectContainer
          objectId="reports-comparison-1"
          title="Period Comparison"
          height="300px"
        />
        <QlikObjectContainer
          objectId="reports-forecast-1"
          title="Forecast Report"
          height="300px"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <QlikObjectContainer
          objectId="reports-data-table"
          title="Raw Data Export"
          height="400px"
        />
      </div>
    </div>
  );
};

export default Reports;