import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Pill, Brain, BookOpen, Calendar, Microscope, Wind, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DailyDiaryPanel from './DailyDiaryPanel';
import MedicationTracker from './MedicationTracker';
import MedicationManager from './MedicationManager';
import MedicationHistoryPanel from './MedicationHistoryPanel';
import MedicalAppointmentsPanel from './MedicalAppointmentsPanel';
import MedicalTestsPanel from './MedicalTestsPanel';
import MeditationHub from './MeditationHub';
import TdahResources from './TdahResources';
import HealthNotificationSettings from './HealthNotificationSettings';

export default function HealthHub() {
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: medications = [] } = useQuery({
    queryKey: ['medications'],
    queryFn: () => base44.entities.Medication.filter({ active: true }),
  });

  const { data: medLogs = [] } = useQuery({
    queryKey: ['med-logs', today],
    queryFn: () => base44.entities.MedicationLog.filter({ date: today }),
  });

  const medTakenToday = medLogs.filter(log => log.taken).length;

  const tabs = [
    { value: 'diary', label: 'Emocional', icon: BookOpen },
    { value: 'today', label: 'Atividades Diárias', icon: Pill },
    { value: 'manage', label: 'Meus Medicamentos', icon: Pill },
    { value: 'appointments', label: 'Consultas', icon: Calendar },
    { value: 'tests', label: 'Exames', icon: Microscope },
    { value: 'meditate', label: 'Meditação', icon: Wind },
    { value: 'learn', label: 'TDAH', icon: Brain },
    { value: 'settings', label: 'Alertas', icon: Bell },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg sm:text-xl font-heading font-bold tracking-tight flex items-center gap-2">
          <Wind className="w-5 h-5 text-accent" />
          Saúde & Bem-estar
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Cuide de você: medicação, meditação e conhecimento
        </p>
      </div>

      <Tabs defaultValue="diary" className="w-full">
        <TabsList className="grid w-full grid-cols-4 sm:grid-cols-8 gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <TabsTrigger 
                key={tab.value}
                value={tab.value} 
                className="text-xs flex items-center justify-center gap-1 p-2 h-9"
              >
                <Icon className="w-4 h-4 hidden sm:inline" />
                <span className="line-clamp-1">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="mt-3 overflow-hidden">
          <TabsContent value="diary" className="mt-0">
            <DailyDiaryPanel />
          </TabsContent>

          <TabsContent value="today" className="mt-0 space-y-3">
            <MedicationTracker medications={medications} medLogs={medLogs} medTakenToday={medTakenToday} />
            <MedicationHistoryPanel />
          </TabsContent>

          <TabsContent value="manage" className="mt-0 space-y-3">
            <MedicationManager />
          </TabsContent>

          <TabsContent value="appointments" className="mt-0">
            <MedicalAppointmentsPanel />
          </TabsContent>

          <TabsContent value="tests" className="mt-0">
            <MedicalTestsPanel />
          </TabsContent>

          <TabsContent value="meditate" className="mt-0">
            <MeditationHub />
          </TabsContent>

          <TabsContent value="learn" className="mt-0">
            <TdahResources />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <HealthNotificationSettings />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}