import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MedicationNotificationBell() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const checkReminders = async () => {
      try {
        const response = await base44.functions.invoke('checkMedicationReminders', {});
        setPendingCount(response.data?.total_pending || 0);
      } catch (error) {
        console.error('Erro ao verificar notificações:', error);
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60000); // 1 minuto

    return () => clearInterval(interval);
  }, []);

  if (pendingCount === 0) {
    return null;
  }

  return (
    <div className="relative inline-flex">
      <div className={cn(
        'flex items-center justify-center w-8 h-8 rounded-lg transition-all',
        pendingCount > 0 ? 'bg-destructive/20 text-destructive animate-pulse' : 'text-muted-foreground'
      )}>
        <Bell className="w-4 h-4" />
      </div>
      {pendingCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-destructive text-white text-[10px] font-bold rounded-full">
          {pendingCount}
        </span>
      )}
    </div>
  );
}