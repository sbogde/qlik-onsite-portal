import React from 'react';
import { Navigation } from '@/components/Navigation';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Navigation />
          </div>
          <div className="lg:col-span-3">
            <main className="space-y-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};