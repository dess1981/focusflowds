import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

function playBeep(type = 'upcoming') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === 'overdue') {
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } else {
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {}
}

export default function MedicationReminders() {
  const [now, setNow] = useState(new Date());
  const queryClient = useQueryClient();

  // Atualiza o relógio a cada minuto
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const today = now.toISOString().split('T')[0];
  const todayDayOfWeek = now.getDay(); // 0=Dom ... 6=Sab
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const { data: medications = [] } = useQuery({
    queryKey: ['medications'],
    queryFn: () => base44.entities.Medication.filter({ active: true }),
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['medicationLogs', today],
    queryFn: () => base44.entities.MedicationLog.filter({ date: today }),
    staleTime: 0,
  });

  // Calcula os reminders pendentes localmente
  const reminders = useMemo(() => {
    const result = [];

    for (const med of medications) {
      // Verificar dias de recorrência
      if (med.recurrence_days && med.recurrence_days.length > 0) {
        if (!med.recurrence_days.includes(todayDayOfWeek)) continue;
      }

      const times = med.time_of_day || [];
      for (const time of times) {
        const [h, m] = time.split(':').map(Number);
        const schedMinutes = h * 60 + m;
        const diffMinutes = schedMinutes - currentMinutes;

        // Já tomado hoje nesse horário?
        const taken = logs.some(
          l => l.medication_id === med.id && l.taken && l.time === time
        );
        if (taken) continue;

        // Mostrar se atrasado (até 120 min) ou próximo (até 15 min)
        if (diffMinutes < -120) continue; // muito atrasado, ignorar
        if (diffMinutes > 15) continue;   // ainda não está na janela

        result.push({
          medication_id: med.id,
          medication_name: med.name,
          dosage: med.dosage || '',
          scheduled_time: time,
          status: diffMinutes < 0 ? 'overdue' : 'upcoming',
          time_until_minutes: diffMinutes,
        });
      }
    }
    return result;
  }, [medications, logs, currentMinutes, todayDayOfWeek]);

  // Som quando aparece um lembrete urgente
  useEffect(() => {
    const overdue = reminders.filter(r => r.status === 'overdue');
    const soon = reminders.filter(r => r.status === 'upcoming' && r.time_until_minutes <= 5);
    if (overdue.length > 0) playBeep('overdue');
    else if (soon.length > 0) playBeep('upcoming');
  }, [reminders.length]);

  const markTaken = useMutation({
    mutationFn: async (reminder) => {
      // Procura log existente para hoje + horário
      const existing = logs.find(
        l => l.medication_id === reminder.medication_id && l.time === reminder.scheduled_time
      );
      if (existing) {
        await base44.entities.MedicationLog.update(existing.id, { taken: true });
      } else {
        await base44.entities.MedicationLog.create({
          medication_id: reminder.medication_id,
          date: today,
          time: reminder.scheduled_time,
          taken: true,
        });
      }
    },
    onSuccess: (_, reminder) => {
      toast.success(`${reminder.medication_name} marcado como tomado! ✅`);
      queryClient.invalidateQueries({ queryKey: ['medicationLogs', today] });
    },
  });

  if (reminders.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 z-50 space-y-2">
      {reminders.map((reminder) => (
        <Card
          key={`${reminder.medication_id}-${reminder.scheduled_time}`}
          className={`border-l-4 ${
            reminder.status === 'overdue'
              ? 'border-l-destructive bg-destructive/10'
              : 'border-l-primary bg-primary/10'
          }`}
        >
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
                    : reminder.time_until_minutes <= 0
                      ? 'Agora!'
                      : `Em ${reminder.time_until_minutes} min`}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => markTaken.mutate(reminder)}
                disabled={markTaken.isPending}
                className="flex-shrink-0"
                title="Marcar como tomado"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}