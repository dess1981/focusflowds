import React from 'react';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const priorityColors = {
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#84cc16',
};

const statusIcons = {
  done: CheckCircle2,
  in_progress: AlertCircle,
  todo: Circle,
  cancelled: Circle,
};

export default function DailyTasksList({ tasks, onTaskClick }) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Nenhuma tarefa para este dia
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {tasks.map(task => {
        const StatusIcon = statusIcons[task.status] || Circle;
        const isCompleted = task.status === 'done';
        
        return (
          <button
            key={task.id}
            onClick={() => onTaskClick(task)}
            className="w-full text-left p-3 rounded-lg transition-all hover:bg-white/5 group"
            style={{
              background: isCompleted ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isCompleted ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)'}`,
            }}
          >
            <div className="flex items-start gap-3">
              <StatusIcon
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                style={{
                  color: isCompleted ? '#22c55e' :
                    task.status === 'in_progress' ? '#f97316' :
                    task.priority ? priorityColors[task.priority] : 'rgba(255,255,255,0.5)',
                }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium truncate',
                    isCompleted && 'line-through'
                  )}
                  style={{ color: isCompleted ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.9)' }}
                >
                  {task.title}
                </p>
                {task.time_block_start && (
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {task.time_block_start}
                    {task.time_block_end && ` - ${task.time_block_end}`}
                  </p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}