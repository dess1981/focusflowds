import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import MedicationReminders from '@/components/health/MedicationReminders';
import GlobalSearch from '@/components/GlobalSearch';
import FocusModeModal from '@/components/focus/FocusModeModal';
import { useSmartNotifications } from '@/hooks/useSmartNotifications';
import { useFocusMode } from '@/context/FocusModeContext';

export default function AppLayout() {
  useSmartNotifications();
  const { focusTaskId, exitFocusMode } = useFocusMode();

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="lg:pl-[260px] transition-all duration-300">
        <div className="p-4 pt-16 pb-24 lg:pt-6 lg:pb-6 lg:p-6 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
      <BottomNav />
      <MedicationReminders />
      <GlobalSearch />
      <FocusModeModal taskId={focusTaskId} onExit={exitFocusMode} isActive={!!focusTaskId} />
    </div>
  );
}