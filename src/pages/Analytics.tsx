import React from "react";
import { QlikObjectContainer } from "@/components/QlikObjectContainer";

const Analytics: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-analytics-slate mb-2">
          Analytics
        </h1>
        <p className="text-muted-foreground">
          Deep dive analysis and advanced visualisations
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <QlikObjectContainer
          objectId="WSPHg"
          title="Budget Over Time"
          height="450px"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QlikObjectContainer
          objectId="yCUgsJ"
          title="Sales vs Margin"
          height="400px"
        />
        <QlikObjectContainer
          objectId="mYPpJB"
          title="Sales Qty by Sales Rep"
          height="400px"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <QlikObjectContainer
          objectId="jujzX"
          title="Central Margin %"
          height="350px"
        />
        <QlikObjectContainer
          objectId="mkQXr"
          title="Northeast Margin %"
          height="350px"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <QlikObjectContainer
          objectId="ycEcd"
          title="Southern Margin %"
          height="350px"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <QlikObjectContainer
          objectId="PbCMeyM"
          title="Western Margin %"
          height="350px"
        />
        <QlikObjectContainer
          objectId="RgRdrZ"
          title="YOY Sales by Customer"
          height="350px"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <QlikObjectContainer objectId="PwaUu" title="Budget $" height="500px" />
      </div>
    </div>
  );
};

export default Analytics;
