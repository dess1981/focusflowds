import React from 'react';
import { cn } from '@/lib/utils';
import { Clock, Calendar, ChevronRight, Zap } from 'lucide-react';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const energyIcons = {
  high: '⚡',
  medium: '🔋',
  low: '🌿',
};

export default function TaskCard({ task, onStatusChange, onClick, compact = false }) {
  const nextStatus = {
    todo: 'in_progress',
    in_progress: 'done',
    done: 'todo',
    cancelled: 'todo',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "group flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer",
        task.status === 'done' && "opacity-60",
        compact && "py-2"
      )}
    >
      <StatusBadge
        status={task.status}
        onClick={(e) => {
          e.stopPropagation();
          onStatusChange?.(task, nextStatus[task.status]);
        }}
      />

      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          task.status === 'done' && "line-through text-muted-foreground"
        )}>
          {task.title}
        </p>

        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <PriorityBadge priority={task.priority} />
          
          {task.time_block_start && task.time_block_end && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {task.time_block_start} - {task.time_block_end}
            </span>
          )}

          {task.due_date && !compact && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {format(new Date(task.due_date + 'T12:00:00'), 'dd MMM', { locale: ptBR })}
            </span>
          )}

          {task.energy_level && (
            <span className="text-xs" title={`Energia: ${task.energy_level}`}>
              {energyIcons[task.energy_level]}
            </span>
          )}

          {task.estimated_minutes && (
            <span className="text-xs text-muted-foreground">
              {task.estimated_minutes}min
            </span>
          )}
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
    </div>
  );
}