import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function CategoryPieChart() {
  const today = new Date().toISOString().split('T')[0];

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-pie'],
    queryFn: () => base44.entities.Task.list('-created_date', 200),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories-pie'],
    queryFn: () => base44.entities.Category.list(),
  });

  const data = useMemo(() => {
    const map = {};
    tasks
      .filter(t => t.due_date === today && t.estimated_minutes > 0)
      .forEach(t => {
        const key = t.category_id || '__none__';
        map[key] = (map[key] || 0) + t.estimated_minutes;
      });

    return Object.entries(map)
      .map(([id, minutes]) => {
        const cat = categories.find(c => c.id === id);
        return {
          name: cat?.name || 'Sem categoria',
          value: minutes,
          color: cat?.color || '#6b7280',
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [tasks, categories, today]);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) return null;

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
        Tempo Planejado Hoje
      </p>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={80} height={80}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={22} outerRadius={38} dataKey="value" strokeWidth={0}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-1.5">
          {data.map((d, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-white/70 truncate max-w-[100px]">{d.name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/40">
                <span>{d.value}m</span>
                <span className="text-primary font-semibold">
                  {Math.round((d.value / total) * 100)}%
                </span>
              </div>
            </div>
          ))}
          <div className="pt-1 border-t border-white/5 text-xs text-white/30 flex justify-between">
            <span>Total</span>
            <span>{total >= 60 ? `${Math.floor(total/60)}h${total%60 > 0 ? ` ${total%60}m` : ''}` : `${total}m`}</span>
          </div>
        </div>
      </div>
    </div>
  );
}