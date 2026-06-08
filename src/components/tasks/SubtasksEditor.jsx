import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Plus, Trash2, ChevronRight, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import TaskFormDialog from './TaskFormDialog';

export default function SubtasksEditor({ parentTaskId }) {
  const [newTitle, setNewTitle] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
  });

  const subtasks = allTasks.filter(t => t.parent_task_id === parentTaskId);

  const createSub = useMutation({
    mutationFn: (title) => base44.entities.Task.create({ title, parent_task_id: parentTaskId, status: 'todo', priority: 'medium' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); setNewTitle(''); },
  });

  const toggleSub = useMutation({
    mutationFn: (task) => base44.entities.Task.update(task.id, {
      status: task.status === 'done' ? 'todo' : 'done',
      ...(task.status !== 'done' ? { completed_at: new Date().toISOString() } : {}),
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteSub = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && newTitle.trim()) { e.preventDefault(); createSub.mutate(newTitle.trim()); }
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const doneCount = subtasks.filter(t => t.status === 'done').length;

  return (
    <>
      <div className="space-y-2">
        {subtasks.length > 0 && (
          <div className="text-xs text-muted-foreground mb-1">
            {doneCount}/{subtasks.length} concluídas
            <div className="h-1 rounded-full mt-1 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${subtasks.length ? (doneCount / subtasks.length) * 100 : 0}%`, background: 'linear-gradient(90deg, #22d3ee, #a855f7)' }}
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          {subtasks.map(task => (
            <div key={task.id} className="flex items-center gap-2 group">
              <ChevronRight className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
              <button
                type="button"
                onClick={() => toggleSub.mutate(task)}
                className={cn(
                  "w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all",
                  task.status === 'done' ? "bg-primary border-primary" : "border-border hover:border-primary/50"
                )}
              >
                {task.status === 'done' && (
                  <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

              {/* Title — click to open full form */}
              <button
                type="button"
                onClick={() => openEdit(task)}
                className={cn(
                  "flex-1 text-sm text-left hover:text-primary transition-colors truncate",
                  task.status === 'done' && "line-through text-muted-foreground"
                )}
                title="Abrir detalhes da subtarefa"
              >
                {task.title}
              </button>

              {/* Edit icon */}
              <button
                type="button"
                onClick={() => openEdit(task)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                title="Editar subtarefa"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={() => deleteSub.mutate(task.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                title="Excluir subtarefa"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-2">
          <Input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Adicionar subtarefa..."
            className="h-8 text-sm"
            disabled={createSub.isPending}
          />
          <button
            type="button"
            onClick={() => newTitle.trim() && createSub.mutate(newTitle.trim())}
            disabled={!newTitle.trim() || createSub.isPending}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/10 disabled:opacity-30 transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Full task form dialog for editing subtask */}
      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        onSave={() => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          setDialogOpen(false);
        }}
      />
    </>
  );
}