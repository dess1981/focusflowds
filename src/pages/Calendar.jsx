import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  format, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isToday
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import TaskFormDialog from '@/components/tasks/TaskFormDialog.jsx';
import TaskListDrawer from '@/components/tasks/TaskListDrawer';
import { useGoogleCalendarEvents, GoogleCalendarConnectButton } from '@/components/calendar/GoogleCalendarEvents';
import { startOfMonth, endOfMonth } from 'date-fns';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';

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

  const { data: timeBlocks = [] } = useQuery({
    queryKey: ['timeblocks'],
    queryFn: () => base44.entities.TimeBlock.list('-created_date', 500),
  });

  // Google Calendar events for current month range
  const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd'T'00:00:00'Z'");
  const monthEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd'T'23:59:59'Z'");
  const { eventsByDate, connected: gcConnected, loading: gcLoading, connect: gcConnect, disconnect: gcDisconnect } = useGoogleCalendarEvents(monthStart, monthEnd);

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

  // Only scheduled (non-template) blocks with a date
  const blocksByDate = useMemo(() => {
    const map = {};
    timeBlocks.filter(b => !b.is_template && b.date).forEach(b => {
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    });
    return map;
  }, [timeBlocks]);

  const handleDayClick = (day) => {
    const key = format(day, 'yyyy-MM-dd');
    const dayTasks = tasksByDate[key] || [];
    const dayBlocks = blocksByDate[key] || [];
    if (dayTasks.length > 0 || dayBlocks.length > 0) {
      setDrawerDate(day);
    } else {
      setSelectedDate(key);
      setShowForm(true);
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const taskId = draggableId.replace('task-', '');
    const newDate = destination.droppableId;
    const task = tasks.find(t => t.id === taskId);

    if (task && source.droppableId !== destination.droppableId) {
      await base44.entities.Task.update(taskId, { due_date: newDate });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  };

  const drawerTasks = drawerDate ? (tasksByDate[format(drawerDate, 'yyyy-MM-dd')] || []) : [];
  const drawerBlocks = drawerDate ? (blocksByDate[format(drawerDate, 'yyyy-MM-dd')] || []) : [];

  const WEEK_LABELS_DESKTOP = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const WEEK_LABELS_MOBILE = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-center min-w-[120px]">
            <h1 className="text-base sm:text-2xl font-heading font-bold tracking-tight capitalize">
              {format(currentMonth, "MMM yyyy", { locale: ptBR })}
            </h1>
          </div>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={() => setCurrentMonth(new Date())}>
            Hoje
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <GoogleCalendarConnectButton
              connected={gcConnected}
              loading={gcLoading}
              onConnect={gcConnect}
              onDisconnect={gcDisconnect}
            />
          </div>
          <Button size="sm" onClick={() => { setSelectedDate(format(new Date(), 'yyyy-MM-dd')); setShowForm(true); }}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Nova Tarefa</span>
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="border border-border rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b border-border" style={{ background: 'rgba(255,255,255,0.06)' }}>
          {WEEK_LABELS_DESKTOP.map((l, i) => (
            <div key={l + i} className="py-2 text-center text-xs font-semibold text-muted-foreground">
              <span className="hidden sm:inline">{l}</span>
              <span className="sm:hidden">{WEEK_LABELS_MOBILE[i]}</span>
            </div>
          ))}
        </div>

        {/* Days grid */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayTasks = tasksByDate[key] || [];
            const dayBlocks = blocksByDate[key] || [];
            const dayGcEvents = eventsByDate[key] || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isCurrentDay = isToday(day);
            const hasBlocks = dayBlocks.length > 0;
            const totalItems = dayGcEvents.length + dayBlocks.length + dayTasks.length;

            // Mobile: show dots only. Desktop: show text labels (max 2)
            const maxVisible = 2;
            const visibleGcEvents = dayGcEvents.slice(0, maxVisible);
            const remainingAfterGc = Math.max(0, maxVisible - visibleGcEvents.length);
            const visibleBlocks = dayBlocks.slice(0, remainingAfterGc);
            const remainingSlots = Math.max(0, remainingAfterGc - visibleBlocks.length);
            const visibleTasks = dayTasks.slice(0, remainingSlots);
            const totalHidden = (dayGcEvents.length - visibleGcEvents.length) + (dayBlocks.length - visibleBlocks.length) + (dayTasks.length - visibleTasks.length);

            return (
              <Droppable droppableId={key} key={key}>
                {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "min-h-[64px] sm:min-h-[90px] p-1 sm:p-1.5 border-b border-r border-border cursor-pointer transition-all",
                  "hover:bg-white/10 active:bg-white/15",
                  snapshot.isDraggingOver && "bg-primary/20 border-primary/50",
                  !isCurrentMonth && "bg-black/10",
                  hasBlocks && "bg-amber-300/10",
                  idx % 7 === 6 && "border-r-0",
                  Math.floor(idx / 7) === Math.floor((calendarDays.length - 1) / 7) && "border-b-0"
                )}
              >
                {/* Day number */}
                <div className={cn(
                  "w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-xs sm:text-sm font-medium mb-1",
                  isCurrentDay && "bg-primary text-primary-foreground",
                  !isCurrentDay && !isCurrentMonth && "text-muted-foreground/40",
                  !isCurrentDay && isCurrentMonth && "text-foreground"
                )}>
                  {format(day, 'd')}
                </div>

                {/* MOBILE: colored dots indicator */}
                {totalItems > 0 && (
                  <div className="flex sm:hidden flex-wrap gap-0.5 mt-1">
                    {dayGcEvents.slice(0, 3).map((ev, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    ))}
                    {dayBlocks.slice(0, 3).map((b, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: b.color || '#4F6BED' }} />
                    ))}
                    {dayTasks.slice(0, 3).map((t, i) => (
                      <div key={i} className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0",
                        t.priority === 'urgent' ? 'bg-red-500' :
                        t.priority === 'high' ? 'bg-orange-400' :
                        t.priority === 'medium' ? 'bg-blue-500' : 'bg-slate-400'
                      )} />
                    ))}
                    {totalItems > 3 && (
                      <span className="text-[9px] text-muted-foreground leading-none">+{totalItems - 3}</span>
                    )}
                  </div>
                )}

                {/* DESKTOP: text labels */}
                <div className="hidden sm:block space-y-0.5">
                  {visibleGcEvents.map(ev => {
                    const startTime = ev.start?.dateTime
                      ? format(new Date(ev.start.dateTime), 'HH:mm')
                      : null;
                    return (
                      <div
                        key={ev.id}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs truncate font-medium opacity-60"
                        style={{ backgroundColor: '#EA433520', color: '#EA4335', border: '1px solid #EA433540' }}
                        title={`📅 ${ev.summary}${startTime ? ` ${startTime}` : ''}`}
                      >
                        <span className="truncate">{ev.summary || '(sem título)'}</span>
                        {startTime && <span className="ml-auto text-[10px] opacity-70 flex-shrink-0">{startTime}</span>}
                      </div>
                    );
                  })}

                  {visibleBlocks.map(block => (
                    <div
                      key={block.id}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs truncate font-medium opacity-60"
                      style={{ backgroundColor: `${block.color || '#4F6BED'}20`, color: block.color || '#4F6BED', border: `1px solid ${block.color || '#4F6BED'}40` }}
                      title={`🔒 ${block.title}`}
                    >
                      <Lock className="w-2.5 h-2.5 flex-shrink-0" />
                      <span className="truncate">{block.title}</span>
                    </div>
                  ))}

                  {visibleTasks.map((task, taskIdx) => (
                    <Draggable key={task.id} draggableId={`task-${task.id}`} index={taskIdx}>
                      {(dragProvided, dragSnapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded text-xs truncate transition-all",
                        dragSnapshot.isDragging && "opacity-50 scale-95",
                        task.status === 'done' ? "bg-muted text-muted-foreground line-through" : "bg-primary/10 text-primary font-medium cursor-move hover:bg-primary/20"
                      )}
                    >
                      <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", priorityColors[task.priority] || 'bg-slate-400')} />
                      <span className="truncate">{task.title}</span>
                    </div>
                      )}
                    </Draggable>
                  ))}

                  {totalHidden > 0 && (
                    <div className="text-xs text-muted-foreground px-1">+{totalHidden} mais</div>
                  )}
                </div>
                {provided.placeholder}
              </div>
                )}
              </Droppable>
            );
          })}
          </div>
        </DragDropContext>
      </div>

      {/* Drawer: tasks + blocks for selected day */}
      <TaskListDrawer
        open={!!drawerDate}
        onOpenChange={(v) => !v && setDrawerDate(null)}
        title={drawerDate ? format(drawerDate, "d 'de' MMMM", { locale: ptBR }) : ''}
        tasks={drawerTasks}
        timeBlocks={drawerBlocks}
        defaultDate={drawerDate ? format(drawerDate, 'yyyy-MM-dd') : null}
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