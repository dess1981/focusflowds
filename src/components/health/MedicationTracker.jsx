import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Circle, Pill, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function MedicationTracker({ medications, medLogs, medTakenToday }) {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedMedTime, setSelectedMedTime] = useState(null);

  const toggleMedMutation = useMutation({
    mutationFn: async ({ medId, time }) => {
      const log = medLogs.find(l => l.medication_id === medId);
      const finalTime = time || format(new Date(), 'HH:mm');
      if (log?.id) {
        await base44.entities.MedicationLog.update(log.id, { taken: !log.taken, time: finalTime });
      } else {
        await base44.entities.MedicationLog.create({
          medication_id: medId,
          date: today,
          time: finalTime,
          taken: true,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['med-logs', today] });
      setSelectedMedTime(null);
    },
  });

  const getMedStatus = (medId) => {
    const log = medLogs.find(l => l.medication_id === medId);
    return log?.taken || false;
  };

  const getMedTime = (medId) => {
    const log = medLogs.find(l => l.medication_id === medId);
    return log?.time || null;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Pill className="w-4 h-4" />
            Medicação de Hoje
          </CardTitle>
          <Badge variant={medTakenToday === medications.length && medications.length > 0 ? 'default' : 'outline'}>
            {medTakenToday}/{medications.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {medications.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs text-muted-foreground mb-3">Nenhuma medicação cadastrada</p>
            <p className="text-[10px] text-muted-foreground">Use a aba "Gerenciar" para adicionar medicações</p>
          </div>
        ) : (
          <div className="space-y-2">
            {medications.map(med => {
              const taken = getMedStatus(med.id);
              const medTime = getMedTime(med.id);
              const isEditing = selectedMedTime?.medId === med.id;
              
              return (
                <div key={med.id} className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  taken ? 'bg-green-500/10 border-green-500/30' : 'bg-muted/30 border-border'
                }`}>
                  {/* Botão de 1 clique */}
                  <button
                    onClick={() => toggleMedMutation.mutate({ medId: med.id, time: medTime })}
                    disabled={toggleMedMutation.isPending}
                    className="flex-shrink-0 transition-transform hover:scale-110"
                    title={taken ? 'Desmarcar' : 'Marcar como tomado'}
                  >
                    {taken ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-muted-foreground" />
                    )}
                  </button>

                  {/* Info do medicamento */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${taken ? 'line-through text-muted-foreground' : ''}`}>
                      {med.name}{med.dosage ? ` — ${med.dosage}` : ''}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {taken && medTime ? `Tomado às ${medTime}` : (med.time_of_day?.join(', ') || 'Horário não definido')}
                      </p>
                    </div>
                  </div>

                  {/* Ajustar horário (expandível) */}
                  {!taken && (
                    <button
                      onClick={() => setSelectedMedTime(isEditing ? null : { medId: med.id, time: format(new Date(), 'HH:mm') })}
                      className="flex-shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-white/5"
                    >
                      {isEditing ? '✕' : '⏰'}
                    </button>
                  )}

                  {isEditing && (
                    <div className="flex gap-2 items-center">
                      <Input
                        type="time"
                        value={selectedMedTime.time}
                        onChange={e => setSelectedMedTime(prev => ({ ...prev, time: e.target.value }))}
                        className="w-28 h-8 text-xs"
                      />
                      <Button size="sm" className="h-8 px-2" onClick={() => toggleMedMutation.mutate({ medId: med.id, time: selectedMedTime.time })} disabled={toggleMedMutation.isPending}>
                        ✓
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}