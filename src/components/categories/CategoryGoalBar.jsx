import React from 'react';
import { cn } from '@/lib/utils';

export default function CategoryGoalBar({ category, currentHours, showLabel = true }) {
  // Suporte a daily_goal_minutes (novo) e daily_goal_hours (legado)
  const goalMinutes = category.daily_goal_minutes || (category.daily_goal_hours ? category.daily_goal_hours * 60 : 0);
  const currentMinutes = currentHours * 60;

  if (goalMinutes === 0) return null;

  const percentage = Math.min((currentMinutes / goalMinutes) * 100, 100);

  let bgColor = '#10B981'; // verde
  let statusText = 'Meta atingida!';

  if (percentage < 50) {
    bgColor = '#EF4444';
    statusText = 'Abaixo da meta';
  } else if (percentage < 80) {
    bgColor = '#F59E0B';
    statusText = 'Quase lá';
  }

  const formatTime = (mins) => {
    if (mins >= 60) return `${Math.floor(mins / 60)}h${mins % 60 > 0 ? ` ${mins % 60}min` : ''}`;
    return `${mins}min`;
  };

  return (
    <div className="space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground">Meta diária</span>
          <span className={cn('font-semibold', {
            'text-green-500': percentage >= 80,
            'text-amber-500': percentage >= 50 && percentage < 80,
            'text-red-500': percentage < 50,
          })}>
            {formatTime(Math.round(currentMinutes))} / {formatTime(goalMinutes)}
          </span>
        </div>
      )}
      <div className="w-full h-2 rounded-full bg-muted/30 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${percentage}%`, backgroundColor: bgColor }}
        />
      </div>
      {showLabel && (
        <p className="text-[10px] text-muted-foreground">{statusText}</p>
      )}
    </div>
  );
}