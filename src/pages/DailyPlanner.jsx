import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isToday, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, CalendarDays, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import TaskFormDialog from '@/components/tasks/TaskFormDialog.jsx';
import SmartNotifications from '@/components/SmartNotifications';
import CompactCalendar from '@/components/CompactCalendar';
import DailyTasksList from '@/components/DailyTasksList';
import DailyNotes from '@/components/planner/DailyNotes';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';



export default function DailyPlanner() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [search, setSearch] = useState('');
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

  const sortedTasks = useMemo(() => {
    const sorted = [...todayTasks];
    sorted.sort((a, b) => {
      if (a.time_block_start && b.time_block_start) {
        return a.time_block_start.localeCompare(b.time_block_start);
      }
      return a.time_block_start ? -1 : 1;
    });
    return sorted;
  }, [todayTasks]);

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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-heading font-bold tracking-tight text-white"
            style={{ textShadow: '0 0 30px rgba(168,85,247,0.4)' }}
          >
            {isToday(selectedDate) ? 'Hoje' : format(selectedDate, "EEEE", { locale: ptBR })}
          </h1>
          <p className="text-sm mt-0.5 capitalize" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {format(selectedDate, "d 'de' MMMM, yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSelectedDate(d => subDays(d, 1))}
            className="p-2 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {!isToday(selectedDate) && (
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)' }}
            >
              Hoje
            </button>
          )}
          <button
            onClick={() => setSelectedDate(d => addDays(d, 1))}
            className="p-2 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Two-column layout: Calendar on left, Tasks on right (stack on mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar — left column, 1/3 width on desktop */}
        <div className="lg:col-span-1">
          <CompactCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
        </div>

        {/* Tasks — right column, 2/3 width on desktop */}
        <div className="lg:col-span-2 space-y-4">
          {/* Add Task Button */}
          <button
            onClick={() => { setEditTask(null); setShowForm(true); }}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5 transition-all lg:hidden"
            style={{
              background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
              boxShadow: '0 4px 20px rgba(168,85,247,0.35)',
            }}
          >
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </button>

          {/* Progress Bar */}
          <div
            className="rounded-xl p-4"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(168,85,247,0.2)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-white/90">Progresso</span>
              <span className="text-xs font-mono" style={{ color: '#a855f7' }}>
                {completedCount}/{totalCount} {totalCount === 1 ? 'tarefa' : 'tarefas'}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #a855f7, #22d3ee)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            {progress === 100 && totalCount > 0 && (
              <p className="text-xs font-medium mt-2 flex items-center gap-1" style={{ color: '#22d3ee' }}>
                <Sparkles className="w-3 h-3" /> Parabéns! 🎉
              </p>
            )}
          </div>

          {/* Smart Notifications */}
          {isToday(selectedDate) && <SmartNotifications />}

          {/* Tasks List */}
          {!isLoading && (
            <>
              {todayTasks.length === 0 ? (
                <div className="text-center py-8">
                  <div
                    className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                    style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}
                  >
                    <CalendarDays className="w-6 h-6" style={{ color: '#a855f7' }} />
                  </div>
                  <h3 className="font-heading font-semibold text-white/80">Dia livre!</h3>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Nenhuma tarefa para este dia</p>
                </div>
              ) : (
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    Tarefas do dia
                  </h2>
                  <DailyTasksList
                    tasks={sortedTasks}
                    onTaskClick={(task) => { setEditTask(task); setShowForm(true); }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <DailyNotes selectedDate={selectedDate} />

      <TaskFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        task={editTask}
        onSave={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })}
      />
    </div>
  );
}