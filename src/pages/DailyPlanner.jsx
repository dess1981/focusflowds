import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, subDays, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Sun, Sunrise, Moon, Sparkles } from 'lucide-react';
import TaskCard from '@/components/tasks/TaskCard';
import TaskFormDialog from '@/components/tasks/TaskFormDialog';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const timeSlots = [
  { start: '06:00', end: '09:00', label: 'Manhã Cedo', icon: Sunrise, color: 'from-amber-50 to-orange-50 border-amber-200' },
  { start: '09:00', end: '12:00', label: 'Manhã', icon: Sun, color: 'from-yellow-50 to-amber-50 border-yellow-200' },
  { start: '12:00', end: '14:00', label: 'Almoço', icon: Sun, color: 'from-green-50 to-emerald-50 border-green-200' },
  { start: '14:00', end: '18:00', label: 'Tarde', icon: Sun, color: 'from-blue-50 to-sky-50 border-blue-200' },
  { start: '18:00', end: '21:00', label: 'Noite', icon: Moon, color: 'from-indigo-50 to-purple-50 border-indigo-200' },
  { start: '21:00', end: '23:59', label: 'Noite Tarde', icon: Moon, color: 'from-purple-50 to-slate-50 border-purple-200' },
];

function getSlotForTask(task) {
  if (!task.time_block_start) return null;
  const h = parseInt(task.time_block_start.split(':')[0]);
  if (h < 9) return 0;
  if (h < 12) return 1;
  if (h < 14) return 2;
  if (h < 18) return 3;
  if (h < 21) return 4;
  return 5;
}

export default function DailyPlanner() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const queryClient = useQueryClient();
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const { data: allTasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 200),
  });

  const todayTasks = useMemo(() => 
    allTasks.filter(t => t.due_date === dateStr),
    [allTasks, dateStr]
  );

  const scheduledTasks = useMemo(() => 
    todayTasks.filter(t => t.time_block_start),
    [todayTasks]
  );

  const unscheduledTasks = useMemo(() => 
    todayTasks.filter(t => !t.time_block_start),
    [todayTasks]
  );

  const updateStatus = useMutation({
    mutationFn: ({ task, status }) => {
      const data = { status };
      if (status === 'done') data.completed_at = new Date().toISOString();
      return base44.entities.Task.update(task.id, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const completedCount = todayTasks.filter(t => t.status === 'done').length;
  const totalCount = todayTasks.length;
  const progress = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">
            {isToday(selectedDate) ? 'Hoje' : format(selectedDate, "EEEE", { locale: ptBR })}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {format(selectedDate, "d 'de' MMMM, yyyy", { locale: ptBR })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setSelectedDate(d => subDays(d, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button 
            variant={isToday(selectedDate) ? "default" : "outline"} 
            size="sm"
            onClick={() => setSelectedDate(new Date())}
          >
            <CalendarDays className="w-4 h-4 mr-1.5" />
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={() => setSelectedDate(d => addDays(d, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button onClick={() => { setEditTask(null); setShowForm(true); }} className="ml-2">
            <Plus className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Nova Tarefa</span>
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progresso do Dia</span>
          <span className="text-sm text-muted-foreground">{completedCount}/{totalCount} tarefas</span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        {progress === 100 && totalCount > 0 && (
          <p className="text-sm text-green-600 font-medium mt-2 flex items-center gap-1">
            <Sparkles className="w-4 h-4" /> Parabéns! Todas as tarefas concluídas! 🎉
          </p>
        )}
      </div>

      {/* Time Slots */}
      <div className="space-y-3">
        {timeSlots.map((slot, idx) => {
          const slotTasks = scheduledTasks.filter(t => getSlotForTask(t) === idx);
          const Icon = slot.icon;

          return (
            <motion.div
              key={slot.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "rounded-2xl border p-4 bg-gradient-to-r",
                slot.color
              )}
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold">{slot.label}</span>
                <span className="text-xs text-muted-foreground">{slot.start} - {slot.end}</span>
              </div>

              {slotTasks.length > 0 ? (
                <div className="space-y-2">
                  {slotTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      compact
                      onStatusChange={(t, s) => updateStatus.mutate({ task: t, status: s })}
                      onClick={() => { setEditTask(task); setShowForm(true); }}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic py-1">Nenhuma tarefa agendada</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Unscheduled Tasks */}
      {unscheduledTasks.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
            📋 Sem horário definido ({unscheduledTasks.length})
          </h3>
          <div className="space-y-2">
            {unscheduledTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={(t, s) => updateStatus.mutate({ task: t, status: s })}
                onClick={() => { setEditTask(task); setShowForm(true); }}
              />
            ))}
          </div>
        </div>
      )}

      {!isLoading && todayTasks.length === 0 && (
        <div className="text-center py-16">
          <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="font-heading font-semibold text-lg">Dia livre!</h3>
          <p className="text-muted-foreground text-sm mt-1">Nenhuma tarefa para este dia. Que tal adicionar uma?</p>
          <Button className="mt-4" onClick={() => { setEditTask(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-1.5" />
            Criar Tarefa
          </Button>
        </div>
      )}

      <TaskFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        task={editTask}
        onSave={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })}
      />
    </div>
  );
}