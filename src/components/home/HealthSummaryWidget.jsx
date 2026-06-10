import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseLocalDate } from '@/lib/dateUtils';
import { Heart, Pill, CalendarDays, ChevronDown, ChevronUp, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HealthSummaryWidget() {
  const [expanded, setExpanded] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayDate = new Date();

  const { data: medications = [] } = useQuery({
    queryKey: ['medications-home'],
    queryFn: () => base44.entities.Medication.filter({ active: true }),
  });

  const { data: medLogs = [] } = useQuery({
    queryKey: ['med-logs-home', today],
    queryFn: () => base44.entities.MedicationLog.filter({ date: today }),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments-home'],
    queryFn: () => base44.entities.MedicalAppointment.filter({ status: 'agendada' }),
  });

  const todayMeds = medications.filter(med => {
    if (!med.recurrence_days || med.recurrence_days.length === 0) return true;
    return med.recurrence_days.includes(todayDate.getDay());
  });

  const takenCount = todayMeds.filter(med =>
    medLogs.some(log => log.medication_id === med.id && log.taken)
  ).length;

  const upcomingAppts = appointments
    .filter(a => a.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const hasAlerts = todayMeds.length > takenCount || upcomingAppts.some(a => a.date === today);

  if (todayMeds.length === 0 && upcomingAppts.length === 0) return null;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${hasAlerts ? 'rgba(236,72,153,0.3)' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      {/* Header - sempre visível */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Heart className={cn("w-4 h-4", hasAlerts ? "text-pink-400" : "text-muted-foreground")} />
          <span className="text-sm font-semibold text-white/80">Saúde de Hoje</span>
          <div className="flex items-center gap-2 ml-2">
            {todayMeds.length > 0 && (
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                takenCount === todayMeds.length
                  ? "bg-green-500/20 text-green-400"
                  : "bg-pink-500/20 text-pink-400"
              )}>
                💊 {takenCount}/{todayMeds.length}
              </span>
            )}
            {upcomingAppts.some(a => a.date === today) && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                📅 consulta hoje
              </span>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
      </button>

      {/* Detalhes expandíveis */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5">
          {/* Medicamentos */}
          {todayMeds.length > 0 && (
            <div className="pt-3">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                <Pill className="w-3 h-3 inline mr-1" />Medicamentos de Hoje
              </p>
              <div className="space-y-1.5">
                {todayMeds.map(med => {
                  const taken = medLogs.some(log => log.medication_id === med.id && log.taken);
                  return (
                    <div key={med.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {taken
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                          : <Clock className="w-3.5 h-3.5 text-pink-400" />
                        }
                        <span className={taken ? "text-white/40 line-through" : "text-white/80"}>
                          {med.name} {med.dosage && `· ${med.dosage}`}
                        </span>
                      </div>
                      {med.time_of_day?.length > 0 && (
                        <span className="text-white/30">{med.time_of_day.join(', ')}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Próximas Consultas */}
          {upcomingAppts.length > 0 && (
            <div className={todayMeds.length > 0 ? "pt-2 border-t border-white/5" : "pt-3"}>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                <CalendarDays className="w-3 h-3 inline mr-1" />Próximas Consultas
              </p>
              <div className="space-y-1.5">
                {upcomingAppts.map(appt => (
                  <div key={appt.id} className="flex items-center justify-between text-xs">
                    <div>
                      <span className={cn(
                        "font-medium",
                        appt.date === today ? "text-accent" : "text-white/80"
                      )}>
                        {appt.doctor_name}
                        {appt.specialty && ` · ${appt.specialty}`}
                      </span>
                    </div>
                    <span className={cn(
                      "text-white/40",
                      appt.date === today && "text-accent font-semibold"
                    )}>
                      {appt.date === today
                        ? `Hoje ${appt.time || ''}`
                        : format(parseLocalDate(appt.date), "dd/MM", { locale: ptBR })
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}