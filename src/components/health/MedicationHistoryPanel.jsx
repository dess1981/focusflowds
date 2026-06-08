import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from 'lucide-react';

export default function MedicationHistoryPanel() {
  const { data: medications = [] } = useQuery({
    queryKey: ['medications'],
    queryFn: () => base44.entities.Medication.list(),
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['med-logs-history'],
    queryFn: async () => {
      // Buscar últimos 30 dias
      const last30Days = [];
      for (let i = 0; i < 30; i++) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        const logsForDate = await base44.entities.MedicationLog.filter({ date });
        last30Days.push(...logsForDate);
      }
      return last30Days;
    },
  });

  const getMedName = (medId) => medications.find(m => m.id === medId)?.name || 'Desconhecido';
  
  const groupedByDate = {};
  logs.forEach(log => {
    if (!groupedByDate[log.date]) {
      groupedByDate[log.date] = [];
    }
    groupedByDate[log.date].push(log);
  });

  const sortedDates = Object.keys(groupedByDate).sort().reverse();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="w-4 h-4" />
          Histórico de Doses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[300px] overflow-y-auto">
        {sortedDates.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Nenhum registro de dose
          </p>
        ) : (
          sortedDates.slice(0, 10).map(date => (
            <div key={date} className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground">
                {format(new Date(date), 'EEEE, d MMMM', { locale: ptBR })}
              </p>
              <div className="space-y-1">
                {groupedByDate[date].map(log => (
                  <div key={log.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-xs">
                    <span>{getMedName(log.medication_id)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{log.time}</span>
                      {log.taken ? (
                        <Badge className="bg-green-500/20 text-green-600">✓ Tomado</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Pendente</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}