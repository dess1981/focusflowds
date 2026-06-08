import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Plus, Pill } from 'lucide-react';
import { format } from 'date-fns';

export default function MedicationTracker({ medications, medLogs, medTakenToday }) {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [showForm, setShowForm] = useState(false);

  const toggleMedMutation = useMutation({
    mutationFn: async (medId) => {
      const log = medLogs.find(l => l.medication_id === medId);
      if (log?.id) {
        await base44.entities.MedicationLog.update(log.id, { taken: !log.taken });
      } else {
        await base44.entities.MedicationLog.create({
          medication_id: medId,
          date: today,
          time: format(new Date(), 'HH:mm'),
          taken: true,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['med-logs', today] });
    },
  });

  const getMedStatus = (medId) => {
    const log = medLogs.find(l => l.medication_id === medId);
    return log?.taken || false;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Pill className="w-4 h-4" />
            Medicação
          </CardTitle>
          <Badge variant="outline">{medTakenToday}/{medications.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {medications.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs text-muted-foreground mb-3">Nenhuma medicação cadastrada</p>
            <Button size="sm" className="gap-1">
              <Plus className="w-3 h-3" />
              Adicionar
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {medications.map(med => {
              const taken = getMedStatus(med.id);
              return (
                <button
                  key={med.id}
                  onClick={() => toggleMedMutation.mutate(med.id)}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    taken
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-muted/30 border-border hover:border-primary/50'
                  }`}
                  disabled={toggleMedMutation.isPending}
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
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {med.time_of_day?.join(', ') || 'Horário não definido'}
                      </p>
                      {med.notes && <p className="text-xs text-muted-foreground mt-1">{med.notes}</p>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}