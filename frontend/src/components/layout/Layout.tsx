import React from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen animated-gradient overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        {children}
      </div>
    </div>
  );
}