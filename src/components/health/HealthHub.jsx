import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Pill, Brain, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DailyDiaryPanel from './DailyDiaryPanel';
import MedicationTracker from './MedicationTracker';
import MedicationManager from './MedicationManager';
import MedicationHistoryPanel from './MedicationHistoryPanel';
import MeditationHub from './MeditationHub';
import TdahResources from './TdahResources';

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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-heading font-bold tracking-tight flex items-center gap-2">
          💚 Saúde & Bem-estar
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Cuide de você: medicação, meditação e conhecimento sobre TDAH
        </p>
      </div>

      <Tabs defaultValue="diary" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="diary" className="text-xs">📔 Diário</TabsTrigger>
          <TabsTrigger value="today" className="text-xs flex items-center gap-1">
            <Pill className="w-3 h-3" />
            Hoje
          </TabsTrigger>
          <TabsTrigger value="manage" className="text-xs">⚙️ Meds</TabsTrigger>
          <TabsTrigger value="meditate" className="text-xs">🧘 Meditar</TabsTrigger>
          <TabsTrigger value="learn" className="text-xs">📚 TDAH</TabsTrigger>
        </TabsList>

        <TabsContent value="diary" className="mt-3">
          <DailyDiaryPanel />
        </TabsContent>

        <TabsContent value="today" className="mt-3 space-y-3">
          <MedicationTracker medications={medications} medLogs={medLogs} medTakenToday={medTakenToday} />
          <MedicationHistoryPanel />
        </TabsContent>

        <TabsContent value="manage" className="mt-3 space-y-3">
          <MedicationManager />
        </TabsContent>

        <TabsContent value="meditate" className="mt-3">
          <MeditationHub />
        </TabsContent>

        <TabsContent value="learn" className="mt-3">
          <TdahResources />
        </TabsContent>
      </Tabs>
    </div>
  );
}