import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';

export const AppShell = () => {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <Outlet />
    </div>
  );
};
