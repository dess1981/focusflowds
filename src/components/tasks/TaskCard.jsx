import React from 'react';
import { cn } from '@/lib/utils';
import { Clock, Calendar, ChevronRight, Video, CheckSquare, MapPin, Play, Timer, Focus } from 'lucide-react';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFocusTimer } from '@/context/FocusTimerContext';
import { useFocusMode } from '@/context/FocusModeContext';

const energyIcons = {
  high: '⚡',
  medium: '🔋',
  low: '🌿',
};

function formatFocusTime(seconds) {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min de foco`;
  if (m > 0) return `${m}min de foco`;
  return `${seconds}s de foco`;
}

export default function TaskCard({ task, onStatusChange, onClick, onRefresh, compact = false, parentTask = null }) {
  const { startFocus, activeTask } = useFocusTimer();
  const { startFocusMode } = useFocusMode();
  const isActive = activeTask?.id === task.id;

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
        "group flex flex-col sm:flex-row sm:items-start gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer",
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
      <div className="flex items-start gap-3 flex-1 min-w-0 sm:flex-1">
        <StatusBadge
          status={task.status}
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange?.(task, nextStatus[task.status]);
          }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 sm:flex-wrap">
            <p className={cn(
              "text-sm font-medium text-white/90",
              task.status === 'done' && "line-through text-white/40"
            )}>
              {task.title}
            </p>
            {task.parent_task_id && parentTask && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 whitespace-nowrap flex-shrink-0 w-fit">
                📌 {parentTask.title}
              </span>
            )}
          </div>

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

        {/* In-person location badge */}
        {task.task_type === 'in_person' && task.location_address && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs" style={{ color: '#fb923c' }}>
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{task.location_name || task.location_address}</span>
            {task.travel_minutes && (
              <span className="flex-shrink-0 opacity-70">· {task.travel_minutes}min</span>
            )}
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
          </div>

          {/* Right side: focus buttons + chevron */}
          <div className="flex flex-col sm:items-end gap-1.5 self-start sm:self-center">
          {task.status !== 'done' && task.status !== 'cancelled' && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={e => {
                e.stopPropagation();
                startFocus(task, onRefresh);
              }}
              title="Iniciar foco com timer"
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all",
                isActive
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              )}
              style={isActive ? {
                background: 'rgba(168,85,247,0.25)',
                border: '1px solid rgba(168,85,247,0.5)',
                color: '#a855f7',
              } : {
                background: 'rgba(168,85,247,0.12)',
                border: '1px solid rgba(168,85,247,0.25)',
                color: '#a855f7',
              }}
            >
              {isActive ? <Timer className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {isActive ? 'Ativo' : 'Focar'}
            </button>
            
            <button
              onClick={e => {
                e.stopPropagation();
                startFocusMode(task.id);
              }}
              title="Modo de foco fullscreen"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
              style={{
                background: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.25)',
                color: '#3b82f6',
              }}
            >
              <Focus className="w-3 h-3" />
            </button>
          </div>
      )}

      {/* Focus time badge */}
      {task.total_focus_seconds > 0 && (
        <span className="text-[10px] flex items-center gap-0.5" style={{ color: 'rgba(168,85,247,0.6)' }}>
          <Timer className="w-2.5 h-2.5" />
          {formatFocusTime(task.total_focus_seconds)}
        </span>
      )}

      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
    </div>
    </div>
  );
}