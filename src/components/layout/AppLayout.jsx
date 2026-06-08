import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="lg:pl-[260px] transition-all duration-300">
        <div className="p-4 pt-16 pb-24 lg:pt-6 lg:pb-6 lg:p-6 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}