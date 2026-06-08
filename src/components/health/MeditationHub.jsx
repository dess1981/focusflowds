import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, CheckCircle2, Brain } from 'lucide-react';
import { format } from 'date-fns';

const MEDITATION_GUIDES = [
  {
    title: 'Foco & Concentração',
    description: 'Meditação de 5 min para melhorar seu foco',
    category: 'foco',
    duration: 5,
  },
  {
    title: 'Calma TDAH',
    description: 'Técnica rápida para lidar com a agitação mental',
    category: 'ansiedade',
    duration: 3,
  },
  {
    title: 'Relaxamento Profundo',
    description: 'Meditação guiada para relaxamento total',
    category: 'relaxamento',
    duration: 10,
  },
  {
    title: 'Sono Tranquilo',
    description: 'Para uma noite de sono reparador',
    category: 'sono',
    duration: 15,
  },
  {
    title: 'Gratidão Matinal',
    description: 'Inicie o dia com positividade',
    category: 'gratidão',
    duration: 5,
  },
];

export default function MeditationHub() {
  const [selectedSession, setSelectedSession] = useState(null);
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: sessions = [] } = useQuery({
    queryKey: ['meditation-sessions', today],
    queryFn: () => base44.entities.MeditationSession.filter({ date: today }),
  });

  const completeMutation = useMutation({
    mutationFn: async (sessionId) => {
      await base44.entities.MeditationSession.update(sessionId, { completed: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meditation-sessions', today] });
      setSelectedSession(null);
    },
  });

  const startSessionMutation = useMutation({
    mutationFn: async (guide) => {
      const session = await base44.entities.MeditationSession.create({
        ...guide,
        date: today,
        completed: false,
      });
      return session;
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['meditation-sessions', today] });
      setSelectedSession(session);
    },
  });

  const completedToday = sessions.filter(s => s.completed).length;

  if (selectedSession) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{selectedSession.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-primary/10 rounded-lg p-6 text-center space-y-4">
            <Brain className="w-12 h-12 mx-auto text-primary" />
            <div>
              <p className="text-sm text-muted-foreground mb-1">Sessão iniciada</p>
              <p className="text-2xl font-bold">{selectedSession.duration} min</p>
            </div>
            <p className="text-xs text-muted-foreground italic">
              Feche os olhos, respire profundamente e deixe-se guiar...
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Dicas para melhor prática:</p>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>✓ Encontre um local tranquilo</li>
              <li>✓ Sente-se confortavelmente</li>
              <li>✓ Desligue notificações</li>
              <li>✓ Respire lentamente</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedSession(null)}
              className="flex-1"
            >
              Fechar
            </Button>
            <Button
              onClick={() => completeMutation.mutate(selectedSession.id)}
              disabled={completeMutation.isPending}
              className="flex-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              {completeMutation.isPending ? 'Salvando...' : 'Concluído'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="w-4 h-4" />
            Meditações Guiadas
          </CardTitle>
          <Badge variant="outline">{completedToday} concluídas</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {MEDITATION_GUIDES.map((guide, i) => {
          const completed = sessions.some(s => s.title === guide.title && s.completed);
          return (
            <button
              key={i}
              onClick={() => startSessionMutation.mutate(guide)}
              disabled={startSessionMutation.isPending}
              className={`w-full p-3 rounded-lg text-left border-2 transition-all ${
                completed
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-muted/30 border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Play className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${completed ? 'line-through text-muted-foreground' : ''}`}>
                    {guide.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{guide.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{guide.duration} minutos</p>
                </div>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}