import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Pencil, Lock, Clock, Plus } from 'lucide-react';
import TaskCard from './TaskCard';
import TaskFormDialog from './TaskFormDialog';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function TaskListDrawer({ open, onOpenChange, title, color, tasks, timeBlocks = [], onEdit, defaultDate }) {
  const [editTask, setEditTask] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: ({ task, status }) => {
      const data = { status };
      if (status === 'done') data.completed_at = new Date().toISOString();
      return base44.entities.Task.update(task.id, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const done = tasks.filter(t => t.status === 'done').length;
  const total = tasks.length;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="pb-4">
            <div className="flex items-center gap-3">
              {color && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />}
              <SheetTitle>{title}</SheetTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              {done}/{total} tarefa{total !== 1 ? 's' : ''} concluída{done !== 1 ? 's' : ''}
            </p>
            {total > 0 && (
              <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${total ? Math.round((done / total) * 100) : 0}%`, backgroundColor: color || 'hsl(var(--primary))' }}
                />
              </div>
            )}
          </SheetHeader>

          {/* Protected time blocks */}
          {timeBlocks.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> Blocos Reservados
              </p>
              {timeBlocks.map(block => (
                <div
                  key={block.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm"
                  style={{
                    backgroundColor: `${block.color || '#4F6BED'}12`,
                    borderColor: `${block.color || '#4F6BED'}30`,
                    color: block.color || '#4F6BED',
                  }}
                >
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: block.color || '#4F6BED' }} />
                  <span className="font-medium flex-1">{block.title}</span>
                  {block.start_time && (
                    <span className="flex items-center gap-1 text-xs opacity-70">
                      <Clock className="w-3 h-3" />
                      {block.start_time}{block.end_time ? `–${block.end_time}` : ''}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 mt-4">
            {tasks.length === 0 && timeBlocks.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Nenhuma tarefa vinculada
              </div>
            )}
            {tasks.length > 0 && (
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tarefas</p>
            )}
            {tasks.map(task => (
              <div key={task.id} className="relative group">
                <TaskCard
                  task={task}
                  onStatusChange={(t, s) => updateStatus.mutate({ task: t, status: s })}
                  onClick={() => {
                    setEditTask(task);
                    setShowTaskForm(true);
                  }}
                />
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-border space-y-2">
            <Button size="sm" className="w-full" onClick={() => { setEditTask(null); setShowTaskForm(true); }}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Nova Tarefa
            </Button>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit} className="w-full">
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Editar
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <TaskFormDialog
        open={showTaskForm}
        onOpenChange={setShowTaskForm}
        task={editTask || (defaultDate ? { due_date: defaultDate } : null)}
        onSave={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })}
      />
    </>
  );
}