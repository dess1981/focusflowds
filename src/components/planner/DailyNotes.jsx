import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { StickyNote } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function DailyNotes({ selectedDate }) {
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const queryClient = useQueryClient();
  const [localText, setLocalText] = useState('');
  const [saving, setSaving] = useState(false);
  const [entryId, setEntryId] = useState(null);

  const { data: entries = [] } = useQuery({
    queryKey: ['daily-entry', dateStr],
    queryFn: () => base44.entities.DailyEntry.filter({ date: dateStr }),
    staleTime: 0,
  });

  useEffect(() => {
    if (entries.length > 0) {
      setLocalText(entries[0].goals_text || '');
      setEntryId(entries[0].id);
    } else {
      setLocalText('');
      setEntryId(null);
    }
  }, [entries]);

  const save = useCallback(async (text) => {
    setSaving(true);
    try {
      if (entryId) {
        await base44.entities.DailyEntry.update(entryId, { goals_text: text });
      } else {
        const created = await base44.entities.DailyEntry.create({ date: dateStr, goals_text: text });
        setEntryId(created.id);
      }
      queryClient.invalidateQueries({ queryKey: ['daily-entry', dateStr] });
    } finally {
      setSaving(false);
    }
  }, [entryId, dateStr, queryClient]);

  // Auto-save com debounce de 800ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localText !== (entries[0]?.goals_text || '')) {
        save(localText);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [localText]);

  return (
    <div
      className="rounded-xl p-4 space-y-2"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Anotações do dia</span>
        </div>
        {saving && <span className="text-[10px] text-white/25">salvando...</span>}
      </div>
      <Textarea
        value={localText}
        onChange={e => setLocalText(e.target.value)}
        placeholder="Anotações livres, lembretes, ideias..."
        className="resize-none min-h-[80px] text-sm bg-transparent border-border/30 placeholder:text-white/20"
      />
    </div>
  );
}