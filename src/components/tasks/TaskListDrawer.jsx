import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import TaskCard from './TaskCard';
import TaskFormDialog from './TaskFormDialog';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function TaskListDrawer({ open, onOpenChange, title, color, tasks, onEdit }) {
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

          <div className="space-y-2 mt-2">
            {tasks.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Nenhuma tarefa vinculada
              </div>
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

          {onEdit && (
            <div className="mt-6 pt-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={onEdit} className="w-full">
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Editar
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <TaskFormDialog
        open={showTaskForm}
        onOpenChange={setShowTaskForm}
        task={editTask}
        onSave={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })}
      />
    </>
  );
}