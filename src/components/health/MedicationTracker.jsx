import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Circle, Plus, Pill, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function MedicationTracker({ medications, medLogs, medTakenToday }) {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedMedTime, setSelectedMedTime] = useState(null);

  const toggleMedMutation = useMutation({
    mutationFn: async (medId, time = null) => {
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
                <div key={med.id}>
                  <button
                    onClick={() => {
                      if (!isEditing && !taken) {
                        setSelectedMedTime({ medId: med.id, time: format(new Date(), 'HH:mm') });
                      } else {
                        toggleMedMutation.mutate(med.id, medTime);
                      }
                    }}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      taken
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-muted/30 border-border hover:border-primary/50'
                    }`}
                    disabled={toggleMedMutation.isPending || isEditing}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {taken ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${taken ? 'line-through text-muted-foreground' : ''}`}>
                          {med.name} - {med.dosage}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {med.time_of_day?.join(', ') || 'Horário não definido'}
                          </p>
                        </div>
                        {taken && medTime && (
                          <p className="text-xs text-green-600 mt-1">✓ Tomado às {medTime}</p>
                        )}
                      </div>
                    </div>
                  </button>

                  {isEditing && (
                    <div className="mt-2 p-2 rounded-lg bg-primary/10 border border-primary/30 space-y-2">
                      <label className="text-xs font-medium text-primary">Horário da ingestão</label>
                      <div className="flex gap-2">
                        <Input
                          type="time"
                          value={selectedMedTime.time}
                          onChange={e => setSelectedMedTime(prev => ({ ...prev, time: e.target.value }))}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            toggleMedMutation.mutate(med.id, selectedMedTime.time);
                          }}
                          disabled={toggleMedMutation.isPending}
                        >
                          ✓
                        </Button>
                      </div>
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