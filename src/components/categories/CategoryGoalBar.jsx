import React from 'react';
import { cn } from '@/lib/utils';

export default function CategoryGoalBar({ category, currentHours, showLabel = true }) {
  const goal = category.daily_goal_hours || 0;
  
  if (goal === 0) return null;

  const percentage = Math.min((currentHours / goal) * 100, 100);
  let bgColor = '#10B981'; // verde
  let statusText = 'Meta atingida';

  if (percentage < 50) {
    bgColor = '#EF4444'; // vermelho
    statusText = 'Abaixo da meta';
  } else if (percentage < 80) {
    bgColor = '#F59E0B'; // amarelo
    statusText = 'Quase lá';
  }

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
            {currentHours.toFixed(1)}h / {goal.toFixed(1)}h
          </span>
        </div>
      )}
      <div className="w-full h-2 rounded-full bg-muted/30 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: bgColor,
          }}
        />
      </div>
      {showLabel && (
        <p className="text-[10px] text-muted-foreground">{statusText}</p>
      )}
    </div>
  );
}