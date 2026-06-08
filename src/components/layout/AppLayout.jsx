import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileMenuButton from './MobileMenuButton';
import BottomNav from './BottomNav';
import MedicationReminders from '@/components/health/MedicationReminders';
import GlobalSearch from '@/components/GlobalSearch';
import FocusModeModal from '@/components/focus/FocusModeModal';
import OverloadWarning from '@/components/alerts/OverloadWarning';
import { useSmartNotifications } from '@/hooks/useSmartNotifications';
import { useFocusMode } from '@/context/FocusModeContext';
import { useTheme } from '@/hooks/useTheme';

export default function AppLayout() {
  useSmartNotifications();
  useTheme(); // Inicializa tema
  const { focusTaskId, exitFocusMode } = useFocusMode();

  return (
    <div className="min-h-screen">
      <Sidebar />
      <MobileMenuButton />
      <main className="lg:pl-[260px] transition-all duration-300">
        <div className="max-w-[1600px] mx-auto">
          <OverloadWarning />
          <div className="p-4 pt-16 pb-24 lg:pt-6 lg:pb-6 lg:p-6">
            <Outlet />
          </div>
        </div>
      </main>
      <BottomNav />
      <MedicationReminders />
      <GlobalSearch />
      <FocusModeModal taskId={focusTaskId} onExit={exitFocusMode} isActive={!!focusTaskId} />
    </div>
  );
}