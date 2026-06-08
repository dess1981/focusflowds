import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday, parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import TaskFormDialog from '@/components/tasks/TaskFormDialog';
import TaskListDrawer from '@/components/tasks/TaskListDrawer';

const priorityColors = {
  urgent: 'bg-red-500',
  high: 'bg-orange-400',
  medium: 'bg-blue-500',
  low: 'bg-slate-400',
};

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [drawerDate, setDrawerDate] = useState(null);
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
  });

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    const days = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      if (t.due_date) {
        const key = t.due_date;
        if (!map[key]) map[key] = [];
        map[key].push(t);
      }
    });
    return map;
  }, [tasks]);

  const handleDayClick = (day) => {
    const key = format(day, 'yyyy-MM-dd');
    const dayTasks = tasksByDate[key] || [];
    if (dayTasks.length > 0) {
      setDrawerDate(day);
    } else {
      setSelectedDate(key);
      setShowForm(true);
    }
  };

  const drawerTasks = drawerDate ? (tasksByDate[format(drawerDate, 'yyyy-MM-dd')] || []) : [];

  const WEEK_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Calendário</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button className="ml-2" onClick={() => { setSelectedDate(format(new Date(), 'yyyy-MM-dd')); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-1.5" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEK_LABELS.map(l => (
            <div key={l} className="py-2 text-center text-xs font-semibold text-muted-foreground">
              {l}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayTasks = tasksByDate[key] || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isCurrentDay = isToday(day);
            const maxVisible = 3;

            return (
              <div
                key={key}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "min-h-[90px] p-1.5 border-b border-r border-border cursor-pointer transition-colors",
                  "hover:bg-muted/50",
                  !isCurrentMonth && "bg-muted/20",
                  idx % 7 === 6 && "border-r-0",
                  Math.floor(idx / 7) === Math.floor((calendarDays.length - 1) / 7) && "border-b-0"
                )}
              >
                {/* Day number */}
                <div className={cn(
                  "w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1",
                  isCurrentDay && "bg-primary text-primary-foreground",
                  !isCurrentDay && !isCurrentMonth && "text-muted-foreground/50",
                  !isCurrentDay && isCurrentMonth && "text-foreground"
                )}>
                  {format(day, 'd')}
                </div>

                {/* Tasks */}
                <div className="space-y-0.5">
                  {dayTasks.slice(0, maxVisible).map(task => (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded text-xs truncate",
                        task.status === 'done'
                          ? "bg-muted text-muted-foreground line-through"
                          : "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", priorityColors[task.priority] || 'bg-slate-400')} />
                      <span className="truncate">{task.title}</span>
                    </div>
                  ))}
                  {dayTasks.length > maxVisible && (
                    <div className="text-xs text-muted-foreground px-1">
                      +{dayTasks.length - maxVisible} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drawer: tasks for selected day */}
      <TaskListDrawer
        open={!!drawerDate}
        onOpenChange={(v) => !v && setDrawerDate(null)}
        title={drawerDate ? format(drawerDate, "d 'de' MMMM", { locale: ptBR }) : ''}
        tasks={drawerTasks}
      />

      {/* Form: new task on selected date */}
      <TaskFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        task={selectedDate ? { due_date: selectedDate } : null}
        onSave={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })}
      />
    </div>
  );
}