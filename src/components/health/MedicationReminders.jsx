import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function MedicationReminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);
  const queryClient = useQueryClient();

  const toggleMedMutation = useMutation({
    mutationFn: async (reminder) => {
      const today = new Date().toISOString().split('T')[0];
      const log = await base44.entities.MedicationLog.filter({
        medication_id: reminder.medication_id,
        date: today,
      });

      if (log.length > 0) {
        await base44.entities.MedicationLog.update(log[0].id, { taken: true });
      } else {
        await base44.entities.MedicationLog.create({
          medication_id: reminder.medication_id,
          date: today,
          time: new Date().toTimeString().slice(0, 5),
          taken: true,
        });
      }
      toast.success(`${reminder.medication_name} marcado como tomado!`);
    },
    onSuccess: () => {
      checkReminders();
    },
  });

  const checkReminders = async () => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke('checkMedicationReminders', {});
      
      if (response.data?.pending_reminders) {
        setReminders(response.data.pending_reminders);
        setLastCheck(new Date());

        // Mostrar notificação do navegador para medicações urgentes
        if (response.data.pending_reminders.length > 0) {
          const overdue = response.data.pending_reminders.filter(r => r.status === 'overdue');
          const upcoming = response.data.pending_reminders.filter(r => r.status === 'upcoming' && r.time_until_minutes <= 5);

          if (overdue.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
            overdue.forEach(med => {
              new Notification('💊 Medicação Atrasada!', {
                body: `${med.medication_name} (${med.dosage}) - Horário: ${med.scheduled_time}`,
                icon: '/medical-icon.png',
                tag: `med-${med.medication_id}`,
              });
            });
          }

          if (upcoming.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
            upcoming.forEach(med => {
              new Notification('🔔 Lembrete de Medicação', {
                body: `${med.medication_name} (${med.dosage}) em ${med.time_until_minutes} minutos`,
                icon: '/medical-icon.png',
                tag: `med-${med.medication_id}`,
              });
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar medicações:', error);
    } finally {
      setLoading(false);
    }
  };

  // Executar verificação ao montar e a cada 1 minuto
  useEffect(() => {
    checkReminders();
    const interval = setInterval(checkReminders, 60000); // 1 minuto

    return () => clearInterval(interval);
  }, []);

  // Pedir permissão de notificação
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  if (reminders.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 z-50 space-y-2">
      {reminders.map((reminder) => (
        <Card key={`${reminder.medication_id}-${reminder.scheduled_time}`} className={`border-l-4 ${
          reminder.status === 'overdue'
            ? 'border-l-destructive bg-destructive/10'
            : 'border-l-primary bg-primary/10'
        }`}>
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {reminder.status === 'overdue' ? (
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                ) : (
                  <Bell className="w-5 h-5 text-primary flex-shrink-0 animate-bounce" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{reminder.medication_name}</p>
                <p className="text-xs text-muted-foreground">
                  {reminder.dosage} · {reminder.scheduled_time}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {reminder.status === 'overdue'
                    ? '⚠️ ATRASADO'
                    : `Em ${reminder.time_until_minutes} minuto${reminder.time_until_minutes !== 1 ? 's' : ''}`}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => toggleMedMutation.mutate(reminder)}
                disabled={toggleMedMutation.isPending}
                className="flex-shrink-0 gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      
      <p className="text-xs text-muted-foreground text-center">
        Última verificação: {lastCheck?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  );
}