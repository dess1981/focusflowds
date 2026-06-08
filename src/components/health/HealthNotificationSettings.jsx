import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function HealthNotificationSettings() {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState(null);

  const { data: prefData, isLoading } = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: async () => {
      const prefs = await base44.entities.NotificationPreference.list();
      return prefs.length > 0 ? prefs[0] : null;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      if (prefData?.id) {
        await base44.entities.NotificationPreference.update(prefData.id, data);
      } else {
        await base44.entities.NotificationPreference.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
      toast.success('Preferências atualizadas');
    },
  });

  useEffect(() => {
    if (prefData) {
      setPreferences(prefData);
    }
  }, [prefData]);

  if (isLoading) {
    return <div className="text-muted-foreground">Carregando...</div>;
  }

  if (!preferences) {
    return null;
  }

  const handleToggle = (field) => {
    const updated = { ...preferences, [field]: !preferences[field] };
    setPreferences(updated);
    updateMutation.mutate({ [field]: !preferences[field] });
  };

  const handleAdvanceChange = (value) => {
    const updated = { ...preferences, medication_advance_minutes: parseInt(value) };
    setPreferences(updated);
    updateMutation.mutate({ medication_advance_minutes: parseInt(value) });
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Notificações de Saúde
        </CardTitle>
        <CardDescription>
          Configure lembretes por notificação push
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Aviso se push não está habilitado */}
        <div className="flex gap-3 p-3 rounded-lg bg-muted/50 border border-muted">
          <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Para receber notificações push, certifique-se de que seu navegador as permite
          </p>
        </div>

        {/* Medicamentos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base cursor-pointer">Lembretes de Medicamentos</Label>
              <p className="text-xs text-muted-foreground">
                Notificações para tomar medicamentos
              </p>
            </div>
            <Switch
              checked={preferences.medication_reminders}
              onCheckedChange={() => handleToggle('medication_reminders')}
            />
          </div>

          {preferences.medication_reminders && (
            <div className="ml-6 space-y-2">
              <Label className="text-sm">Avisar com antecedência:</Label>
              <Select
                value={String(preferences.medication_advance_minutes)}
                onValueChange={handleAdvanceChange}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Consultas */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="space-y-1">
            <Label className="text-base cursor-pointer">Lembretes de Consultas</Label>
            <p className="text-xs text-muted-foreground">
              Notificações para consultas médicas
            </p>
          </div>
          <Switch
            checked={preferences.appointment_reminders}
            onCheckedChange={() => handleToggle('appointment_reminders')}
          />
        </div>

        {/* Exames */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="space-y-1">
            <Label className="text-base cursor-pointer">Lembretes de Exames</Label>
            <p className="text-xs text-muted-foreground">
              Notificações para exames agendados
            </p>
          </div>
          <Switch
            checked={preferences.test_reminders}
            onCheckedChange={() => handleToggle('test_reminders')}
          />
        </div>

        {/* Meditação */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="space-y-1">
            <Label className="text-base cursor-pointer">Lembretes de Meditação</Label>
            <p className="text-xs text-muted-foreground">
              Notificações para sessões de meditação
            </p>
          </div>
          <Switch
            checked={preferences.meditation_reminders}
            onCheckedChange={() => handleToggle('meditation_reminders')}
          />
        </div>

        {/* Tarefas */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="space-y-1">
            <Label className="text-base cursor-pointer">Lembretes de Tarefas Vencidas</Label>
            <p className="text-xs text-muted-foreground">
              Notificações para tarefas que ultrapassaram a data
            </p>
          </div>
          <Switch
            checked={preferences.task_reminders}
            onCheckedChange={() => handleToggle('task_reminders')}
          />
        </div>
      </CardContent>
    </Card>
  );
}