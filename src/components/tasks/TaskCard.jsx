import React from 'react';
import { cn } from '@/lib/utils';
import { Clock, Calendar, ChevronRight, Video, CheckSquare, GitBranch } from 'lucide-react';
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
        "group flex items-start gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer",
        task.status === 'done' && "opacity-50",
        compact && "py-2"
      )}
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.09)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(168,85,247,0.1)';
        e.currentTarget.style.border = '1px solid rgba(168,85,247,0.25)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
        e.currentTarget.style.border = '1px solid rgba(255,255,255,0.09)';
      }}
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
          "text-sm font-medium truncate text-white/90",
          task.status === 'done' && "line-through text-white/40"
        )}>
          {task.title}
        </p>

        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <PriorityBadge priority={task.priority} />
          
          {task.time_block_start && task.time_block_end && (
            <span className="inline-flex items-center gap-1 text-xs" style={{ color: '#22d3ee' }}>
              <Clock className="w-3 h-3" />
              {task.time_block_start} – {task.time_block_end}
            </span>
          )}

          {task.due_date && !compact && (
            <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
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
            <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {task.estimated_minutes}min
            </span>
          )}
        </div>

        {/* Checklist progress */}
        {task.checklist?.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <CheckSquare className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {task.checklist.filter(i => i.done).length}/{task.checklist.length}
            </span>
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(task.checklist.filter(i => i.done).length / task.checklist.length) * 100}%`,
                  background: 'linear-gradient(90deg, #a855f7, #22d3ee)'
                }}
              />
            </div>
          </div>
        )}

        {task.task_type === 'meeting' && task.meet_link && (
          <a
            href={task.meet_link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors"
            style={{
              background: 'rgba(34,211,238,0.12)',
              color: '#22d3ee',
              border: '1px solid rgba(34,211,238,0.25)',
            }}
          >
            <Video className="w-3 h-3" />
            Entrar na reunião
          </a>
        )}
      </div>

      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
    </div>
  );
}