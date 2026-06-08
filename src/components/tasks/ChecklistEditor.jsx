import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function ChecklistEditor({ items = [], onChange }) {
  const [newItem, setNewItem] = useState('');

  const addItem = () => {
    const text = newItem.trim();
    if (!text) return;
    const item = { id: crypto.randomUUID(), text, done: false };
    onChange([...items, item]);
    setNewItem('');
  };

  const toggleItem = (id) => {
    onChange(items.map(i => i.id === id ? { ...i, done: !i.done } : i));
  };

  const removeItem = (id) => {
    onChange(items.filter(i => i.id !== id));
  };

  const updateText = (id, text) => {
    onChange(items.map(i => i.id === id ? { ...i, text } : i));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addItem(); }
  };

  const doneCount = items.filter(i => i.done).length;

  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <div className="text-xs text-muted-foreground mb-1">
          {doneCount}/{items.length} concluídos
          {items.length > 0 && (
            <div className="h-1 rounded-full mt-1 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(doneCount / items.length) * 100}%`, background: 'linear-gradient(90deg, #a855f7, #22d3ee)' }}
              />
            </div>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2 group">
            <button
              type="button"
              onClick={() => toggleItem(item.id)}
              className={cn(
                "w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all",
                item.done
                  ? "bg-primary border-primary"
                  : "border-border hover:border-primary/50"
              )}
            >
              {item.done && (
                <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 12 12">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <input
              type="text"
              value={item.text}
              onChange={e => updateText(item.id, e.target.value)}
              className={cn(
                "flex-1 bg-transparent text-sm outline-none border-b border-transparent focus:border-border transition-colors",
                item.done && "line-through text-muted-foreground"
              )}
            />
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-2">
        <Input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Adicionar item..."
          className="h-8 text-sm"
        />
        <button
          type="button"
          onClick={addItem}
          disabled={!newItem.trim()}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-primary border border-primary/30 hover:bg-primary/10 disabled:opacity-30 transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}