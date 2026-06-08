import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { 
  Play, Eye, EyeOff, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusTimer } from '@/context/FocusTimerContext';

const priorityConfig = {
  urgent: { label: '🔴 Urgente', color: '#ef4444', sortOrder: 0 },
  high: { label: '🟠 Alta', color: '#f97316', sortOrder: 1 },
  medium: { label: '🔵 Média', color: '#3b82f6', sortOrder: 2 },
  low: { label: '⚪ Baixa', color: '#6b7280', sortOrder: 3 },
};

export default function DailyTasksWidget() {
  const [hideCompleted, setHideCompleted] = useState(true);
  const { startFocus } = useFocusTimer();
  const today = new Date().toISOString().split('T')[0];

  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks-daily-widget'],
    queryFn: () => base44.entities.Task.list('-created_date', 200),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories-widget'],
    queryFn: () => base44.entities.Category.list(),
  });

  const todayTasks = useMemo(() => {
    return tasks.filter(t => {
      const taskDate = t.due_date || new Date().toISOString().split('T')[0];
      const isToday = taskDate === today;
      const isNotDone = hideCompleted ? t.status !== 'done' : true;
      return isToday && isNotDone;
    });
  }, [tasks, today, hideCompleted]);

  const filteredTasks = useMemo(() => {
    return todayTasks
      .sort((a, b) => priorityConfig[a.priority]?.sortOrder - priorityConfig[b.priority]?.sortOrder)
      .slice(0, 8); // Mostrar apenas top 8
  }, [todayTasks]);

  const getCategoryName = (catId) => categories.find(c => c.id === catId)?.name || 'Sem categoria';

  return (
    <div className="space-y-3">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-white/60">
          Tarefas de Hoje
        </h2>
        <button
          onClick={() => setHideCompleted(!hideCompleted)}
          className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg transition-colors text-white/60 hover:text-white/90 hover:bg-white/5"
        >
          {hideCompleted ? (
            <Eye className="w-3 h-3" />
          ) : (
            <EyeOff className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* Task list */}
      {tasksLoading ? (
        <div className="text-center py-8">
          <div className="inline-block w-6 h-6 border-3 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-xs text-muted-foreground">Nenhuma tarefa para hoje</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {filteredTasks.map((task, idx) => {
            const categoryName = getCategoryName(task.category_id);
            const priority = priorityConfig[task.priority];
            
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: idx * 0.03 }}
                className="group glass-card rounded-lg p-3 hover:bg-primary/5 transition-all duration-200 border border-border/50"
              >
                <div className="flex items-start gap-3">
                  {/* Status indicator */}
                  <div className="flex-shrink-0 mt-0.5">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: priority?.color }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "font-medium text-sm truncate",
                      task.status === 'done' && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {task.description}
                      </p>
                    )}

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[9px] h-5">
                        {priority?.label}
                      </Badge>

                      {task.category_id && (
                        <Badge variant="outline" className="text-[9px] h-5">
                          {categoryName}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {task.status !== 'done' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startFocus(task, () => refetchTasks());
                      }}
                      className="p-1.5 hover:bg-primary/20 rounded-lg transition-colors flex-shrink-0"
                      title="Iniciar foco"
                    >
                      <Play className="w-3.5 h-3.5 text-primary" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}

      {filteredTasks.length > 0 && todayTasks.length > 8 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          +{todayTasks.length - 8} mais tarefas
        </p>
      )}
    </div>
  );
}