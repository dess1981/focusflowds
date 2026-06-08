import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wand2, ChevronDown, ChevronUp, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRIORITY_LABELS = { urgent: '🔴', high: '🟠', medium: '🔵', low: '⚪' };

export default function UseTemplateButton({ onApply }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['task-templates'],
    queryFn: () => base44.entities.TaskTemplate.list('-use_count', 50),
  });

  const incrementUse = useMutation({
    mutationFn: ({ id, count }) => base44.entities.TaskTemplate.update(id, { use_count: (count || 0) + 1 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task-templates'] }),
  });

  const handleApply = (t) => {
    onApply({
      title: t.title || '',
      description: t.description || '',
      priority: t.priority || 'medium',
      task_type: t.task_type || 'task',
      energy_level: t.energy_level || 'medium',
      estimated_minutes: t.estimated_minutes || '',
      time_block_start: t.time_block_start || '',
      time_block_end: t.time_block_end || '',
      category_id: t.category_id || '',
      project_id: t.project_id || '',
      checklist: (t.checklist || []).map(item => ({ ...item, done: false })),
      notes: t.notes || '',
      location_name: t.location_name || '',
      location_address: t.location_address || '',
      travel_minutes: t.travel_minutes || '',
      travel_origin: t.travel_origin || 'ultimo_evento',
      departure_reminder_minutes: t.departure_reminder_minutes || 30,
    });
    incrementUse.mutate({ id: t.id, count: t.use_count });
    setOpen(false);
  };

  if (templates.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
        style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.25)' }}
      >
        <Wand2 className="w-3.5 h-3.5" />
        Usar Template
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1.5 w-72 rounded-xl overflow-hidden z-50 shadow-xl"
          style={{ background: 'hsl(var(--card))', border: '1px solid rgba(168,85,247,0.2)' }}
        >
          <div className="px-3 py-2 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground">Selecionar template</p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {templates.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleApply(t)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 transition-colors text-left border-b border-border/50 last:border-0"
              >
                <span className="text-xl flex-shrink-0">{t.emoji || '📋'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {t.priority && <span className="text-[10px]">{PRIORITY_LABELS[t.priority]}</span>}
                    {t.estimated_minutes && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />{t.estimated_minutes}min
                      </span>
                    )}
                    {t.checklist?.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">✅ {t.checklist.length} itens</span>
                    )}
                  </div>
                </div>
                {t.use_count > 0 && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 flex-shrink-0">
                    <Zap className="w-2.5 h-2.5" />{t.use_count}x
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}