import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, subDays, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Sun, Sunrise, Moon, Sparkles, Search, X, HardDrive } from 'lucide-react';
import TaskCard from '@/components/tasks/TaskCard';
import TaskFormDialog from '@/components/tasks/TaskFormDialog.jsx';
import SmartNotifications from '@/components/SmartNotifications';
import DriveQuickSearch from '@/components/tasks/DriveQuickSearch';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const timeSlots = [
  { start: '06:00', end: '09:00', label: 'Manhã Cedo', icon: Sunrise, accent: 'rgba(255,255,255,0.02)', border: 'rgba(251,191,36,0.25)', iconColor: '#fbbf24' },
  { start: '09:00', end: '12:00', label: 'Manhã', icon: Sun, accent: 'rgba(255,255,255,0.02)', border: 'rgba(249,115,22,0.25)', iconColor: '#f97316' },
  { start: '12:00', end: '14:00', label: 'Almoço', icon: Sun, accent: 'rgba(255,255,255,0.02)', border: 'rgba(34,197,94,0.25)', iconColor: '#22c55e' },
  { start: '14:00', end: '18:00', label: 'Tarde', icon: Sun, accent: 'rgba(255,255,255,0.02)', border: 'rgba(59,130,246,0.25)', iconColor: '#3b82f6' },
  { start: '18:00', end: '21:00', label: 'Noite', icon: Moon, accent: 'rgba(255,255,255,0.02)', border: 'rgba(168,85,247,0.25)', iconColor: '#a855f7' },
  { start: '21:00', end: '23:59', label: 'Noite Tarde', icon: Moon, accent: 'rgba(255,255,255,0.02)', border: 'rgba(99,102,241,0.25)', iconColor: '#6366f1' },
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
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const { data: allTasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 200),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list(),
  });

  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach(c => { map[c.id] = c.name; });
    return map;
  }, [categories]);

  const todayTasks = useMemo(() => 
    allTasks.filter(t => t.due_date === dateStr),
    [allTasks, dateStr]
  );

  const filteredTodayTasks = useMemo(() => {
    if (!search.trim()) return todayTasks;
    const q = search.toLowerCase();
    return todayTasks.filter(t =>
      t.title?.toLowerCase().includes(q) ||
      (t.category_id && categoryMap[t.category_id]?.toLowerCase().includes(q))
    );
  }, [todayTasks, search, categoryMap]);

  const scheduledTasks = useMemo(() => 
    filteredTodayTasks.filter(t => t.time_block_start),
    [filteredTodayTasks]
  );

  const unscheduledTasks = useMemo(() => 
    filteredTodayTasks.filter(t => !t.time_block_start),
    [filteredTodayTasks]
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate(d => subDays(d, 1))}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-3 h-9 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all"
            style={isToday(selectedDate) ? {
              background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(34,211,238,0.15))',
              border: '1px solid rgba(168,85,247,0.4)',
              color: '#a855f7',
            } : {
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            <CalendarDays className="w-4 h-4" />
            Hoje
          </button>
          <button
            onClick={() => setSelectedDate(d => addDays(d, 1))}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setEditTask(null); setShowForm(true); }}
            className="ml-1 px-4 h-9 rounded-xl text-sm font-semibold text-white flex items-center gap-1.5 transition-all"
            style={{
              background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
              boxShadow: '0 4px 20px rgba(168,85,247,0.35)',
            }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova Tarefa</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'rgba(255,255,255,0.35)' }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou categoria..."
          className="w-full h-10 pl-9 pr-9 rounded-xl text-sm outline-none text-white placeholder:text-white/30 transition-all"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: search ? '1px solid rgba(168,85,247,0.45)' : '1px solid rgba(255,255,255,0.1)',
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        )}
      </div>

      {/* Smart Notifications — only on today's view */}
      {isToday(selectedDate) && <SmartNotifications />}

      {/* Quick Drive Search */}
      <DriveQuickSearch />

      {/* Progress Bar */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(168,85,247,0.2)',
          boxShadow: '0 0 30px rgba(168,85,247,0.06)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-white/90">Progresso do Dia</span>
          <span className="text-sm font-mono" style={{ color: '#a855f7' }}>{completedCount}/{totalCount} tarefas</span>
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
          <p className="text-sm font-medium mt-2 flex items-center gap-1" style={{ color: '#22d3ee' }}>
            <Sparkles className="w-4 h-4" /> Parabéns! Todas as tarefas concluídas! 🎉
          </p>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/40 to-accent/20" />
        
        <div className="space-y-4">
          {timeSlots.map((slot, idx) => {
            const slotTasks = scheduledTasks.filter(t => getSlotForTask(t) === idx);
            const Icon = slot.icon;

            return (
              <motion.div
                key={slot.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="relative pl-12"
              >
                {/* Timeline dot */}
                <div className="absolute left-0 top-1.5 w-8 h-8 rounded-full flex items-center justify-center" 
                  style={{ background: 'rgba(255,255,255,0.05)', border: `2px solid ${slot.border}` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: slot.iconColor }} />
                </div>

                {/* Time slot container */}
                <div
                  className="rounded-xl p-3 border"
                  style={{
                    background: slotTasks.length > 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${slot.border}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: slot.iconColor }}>{slot.label}</span>
                    <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>{slot.start}</span>
                  </div>

                  {slotTasks.length > 0 ? (
                    <div className="space-y-1.5">
                      {slotTasks.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          compact
                          onStatusChange={(t, s) => updateStatus.mutate({ task: t, status: s })}
                          onClick={() => { setEditTask(task); setShowForm(true); }}
                          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs py-1" style={{ color: 'rgba(255,255,255,0.2)' }}>—</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Unscheduled Tasks */}
      {unscheduledTasks.length > 0 && (
        <div className="relative mt-8">
          <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-muted/30 to-transparent" />
          <div className="pl-12">
            <div className="absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.15)' }}>
              <span className="text-xs">+</span>
            </div>
            <div
              className="rounded-xl p-3 border"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Sem horário
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(168,85,247,0.2)', color: '#a855f7' }}>
                  {unscheduledTasks.length}
                </span>
              </h3>
              <div className="space-y-1.5">
                {unscheduledTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    compact
                    onStatusChange={(t, s) => updateStatus.mutate({ task: t, status: s })}
                    onClick={() => { setEditTask(task); setShowForm(true); }}
                    onRefresh={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!isLoading && todayTasks.length === 0 && (
        <div className="text-center py-16">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}
          >
            <CalendarDays className="w-8 h-8" style={{ color: '#a855f7' }} />
          </div>
          <h3 className="font-heading font-semibold text-lg text-white/80">Dia livre!</h3>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Nenhuma tarefa para este dia. Que tal adicionar uma?</p>
          <button
            className="mt-4 px-6 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 mx-auto transition-all"
            style={{
              background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
              boxShadow: '0 4px 20px rgba(168,85,247,0.35)',
            }}
            onClick={() => { setEditTask(null); setShowForm(true); }}
          >
            <Plus className="w-4 h-4" />
            Criar Tarefa
          </button>
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