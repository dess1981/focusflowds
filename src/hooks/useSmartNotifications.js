import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export function useSmartNotifications() {
  const notificationCacheRef = useRef(new Set());
  const intervalRef = useRef(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const result = await base44.functions.invoke('getSmartNotifications', {});
        const notifications = result.data?.notifications || [];

        notifications.forEach(notif => {
          const notifId = `${notif.type}-${notif.task_id || notif.block_id}`;
          
          // Evita duplicatas
          if (!notificationCacheRef.current.has(notifId)) {
            notificationCacheRef.current.add(notifId);

            if (notif.type === 'task_approaching') {
              toast.warning(`⏰ ${notif.title} começa em ${notif.time_until}`, {
                description: notif.message,
                duration: 5000,
              });
            } else if (notif.type === 'time_exceeded') {
              toast.error(`⚠️ ${notif.title} ultrapassou o tempo estimado`, {
                description: `Estimado: ${notif.estimated_time} | Decorrido: ${notif.actual_time}`,
                duration: 5000,
              });
            } else if (notif.type === 'focus_reminder') {
              toast.info(`🎯 ${notif.message}`, {
                duration: 4000,
              });
            }
          }
        });
      } catch (error) {
        console.error('Erro ao buscar notificações:', error);
      }
    };

    // Verifica notificações a cada 30 segundos
    intervalRef.current = setInterval(fetchNotifications, 30000);
    fetchNotifications(); // Check immediately on mount

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
}