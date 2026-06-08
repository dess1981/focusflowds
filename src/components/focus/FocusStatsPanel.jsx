import React, { useMemo } from 'react';
import { Flame, Calendar, TrendingUp, Clock } from 'lucide-react';

function formatDuration(seconds) {
  if (!seconds) return '0min';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export default function FocusStatsPanel({ tasks }) {
  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);

    let todaySeconds = 0;
    let weekSeconds = 0;
    let monthSeconds = 0;
    let totalSessions = 0;

    // For weekly breakdown (last 7 days)
    const dailyMap = {};

    tasks.forEach(task => {
      const sessions = task.focus_sessions || [];
      sessions.forEach(session => {
        if (!session.ended_at || !session.duration_seconds) return;
        const date = new Date(session.ended_at);
        const dur = session.duration_seconds;

        if (isSameDay(date, now)) todaySeconds += dur;
        if (date >= weekStart) weekSeconds += dur;
        if (date >= monthStart) monthSeconds += dur;
        totalSessions++;

        // Daily map for last 7 days
        const key = date.toISOString().split('T')[0];
        dailyMap[key] = (dailyMap[key] || 0) + dur;
      });
    });

    // Last 7 days bars
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('pt-BR', { weekday: 'short' });
      days.push({ key, label, seconds: dailyMap[key] || 0, isToday: i === 0 });
    }

    const maxDay = Math.max(...days.map(d => d.seconds), 1);
    const avgWeekSeconds = weekSeconds / 7;

    return { todaySeconds, weekSeconds, monthSeconds, totalSessions, days, maxDay, avgWeekSeconds };
  }, [tasks]);

  const statCards = [
    { label: 'Hoje', value: formatDuration(stats.todaySeconds), icon: Flame, color: '#f59e0b' },
    { label: 'Esta semana', value: formatDuration(stats.weekSeconds), icon: Calendar, color: '#a855f7' },
    { label: 'Este mês', value: formatDuration(stats.monthSeconds), icon: TrendingUp, color: '#22d3ee' },
    { label: 'Média/dia', value: formatDuration(Math.round(stats.avgWeekSeconds)), icon: Clock, color: '#22c55e' },
  ];

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map(card => (
          <div
            key={card.label}
            className="rounded-xl p-3 flex flex-col gap-1.5"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex items-center gap-1.5">
              <card.icon className="w-3.5 h-3.5" style={{ color: card.color }} />
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <p className="text-lg font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Weekly bar chart */}
      <div
        className="rounded-xl p-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Foco nos últimos 7 dias</p>
        <div className="flex items-end gap-1.5 h-20">
          {stats.days.map(day => {
            const heightPct = stats.maxDay > 0 ? (day.seconds / stats.maxDay) * 100 : 0;
            return (
              <div key={day.key} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: '60px' }}>
                  <div
                    className="w-full rounded-t-sm transition-all duration-500"
                    style={{
                      height: `${Math.max(heightPct, day.seconds > 0 ? 4 : 0)}%`,
                      minHeight: day.seconds > 0 ? '4px' : '0',
                      background: day.isToday
                        ? 'linear-gradient(180deg, #a855f7, #22d3ee)'
                        : 'rgba(168,85,247,0.35)',
                    }}
                    title={formatDuration(day.seconds)}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{day.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}