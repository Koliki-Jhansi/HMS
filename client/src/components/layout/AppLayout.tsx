import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { HospitalPageBackground } from '../background/HospitalPageBackground';

export const AppLayout: React.FC = () => {
  return (
    <div className="relative min-h-screen flex flex-col font-sans overflow-x-hidden">
      {/* Dedicated Atmospheric Full-Page Hospital Background Layer */}
      <HospitalPageBackground />

      {/* Application Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
