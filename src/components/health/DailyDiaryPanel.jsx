import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Save } from 'lucide-react';
import { format } from 'date-fns';

const moods = ['😍', '😊', '😐', '😔', '😢'];

export default function DailyDiaryPanel() {
  const [mode, setMode] = useState('view'); // view, edit
  const [formData, setFormData] = useState({ diary_text: '', goals_text: '', mood: '😊' });
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: entry } = useQuery({
    queryKey: ['daily-entry', today],
    queryFn: async () => {
      const entries = await base44.entities.DailyEntry.filter({ date: today });
      return entries[0] || null;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (entry?.id) {
        await base44.entities.DailyEntry.update(entry.id, data);
      } else {
        await base44.entities.DailyEntry.create({ date: today, ...data });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-entry', today] });
      setMode('view');
    },
  });

  const handleEdit = () => {
    setFormData({
      diary_text: entry?.diary_text || '',
      goals_text: entry?.goals_text || '',
      mood: entry?.mood || '😊',
    });
    setMode('edit');
  };

  if (mode === 'edit') {
    return (
      <Card className="border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="w-4 h-4" />
            Diário do Dia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Como foi seu dia?</label>
            <Textarea
              value={formData.diary_text}
              onChange={e => setFormData(f => ({ ...f, diary_text: e.target.value }))}
              placeholder="Escreva sobre seu dia, desafios, vitórias..."
              className="mt-1 min-h-[100px] resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Metas e desejos</label>
            <Textarea
              value={formData.goals_text}
              onChange={e => setFormData(f => ({ ...f, goals_text: e.target.value }))}
              placeholder="O que você deseja para hoje? Anotações importantes..."
              className="mt-1 min-h-[80px] resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">Seu humor</label>
            <div className="flex gap-2">
              {moods.map(mood => (
                <button
                  key={mood}
                  onClick={() => setFormData(f => ({ ...f, mood }))}
                  className={`text-2xl p-2 rounded-lg transition-all ${
                    formData.mood === mood
                      ? 'bg-primary/20 scale-110'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setMode('view')}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => saveMutation.mutate(formData)}
              disabled={saveMutation.isPending}
              className="flex-1"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Diário
          </div>
          {entry?.mood && <span className="text-2xl">{entry.mood}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {entry ? (
          <>
            {entry.diary_text && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground mb-1">Como foi seu dia</p>
                <p className="text-sm line-clamp-3">{entry.diary_text}</p>
              </div>
            )}
            {entry.goals_text && (
              <div className="p-3 rounded-lg bg-primary/5">
                <p className="text-xs font-medium text-muted-foreground mb-1">Metas</p>
                <p className="text-sm line-clamp-2">{entry.goals_text}</p>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleEdit}
              size="sm"
            >
              Editar
            </Button>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground mb-2">Nenhuma entrada para hoje</p>
            <Button onClick={handleEdit} size="sm">
              Iniciar Diário
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}