import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, LayoutList, Kanban } from 'lucide-react';
import TaskCard from '@/components/tasks/TaskCard';
import TaskFormDialog from '@/components/tasks/TaskFormDialog.jsx';
import KanbanBoard from '@/components/tasks/KanbanBoard';
import { AnimatePresence, motion } from 'framer-motion';

export default function Tasks() {
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [view, setView] = useState('list');
  const queryClient = useQueryClient();

  // Check for ?new=true
  const urlParams = new URLSearchParams(window.location.search);
  React.useEffect(() => {
    if (urlParams.get('new') === 'true') {
      setEditTask(null);
      setShowForm(true);
      window.history.replaceState({}, '', '/tasks');
    }
  }, []);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const updateStatus = useMutation({
    mutationFn: ({ task, status }) => {
      const data = { status };
      if (status === 'done') data.completed_at = new Date().toISOString();
      return base44.entities.Task.update(task.id, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteTask = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  const projectMap = useMemo(() => {
    const map = {};
    projects.forEach(p => { map[p.id] = p; });
    return map;
  }, [projects]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Tarefas</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{filtered.length} tarefa{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center border border-border rounded-lg p-1 bg-muted/50">
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`p-1.5 rounded-md transition-colors ${view === 'kanban' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Kanban className="w-4 h-4" />
            </button>
          </div>
          <Button onClick={() => { setEditTask(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-1.5" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="todo">A Fazer</SelectItem>
            <SelectItem value="in_progress">Em Progresso</SelectItem>
            <SelectItem value="done">Concluídas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Prioridade</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task Views */}
      {view === 'kanban' ? (
        <KanbanBoard
          tasks={filtered}
          onStatusChange={(t, s) => updateStatus.mutate({ task: t, status: s })}
          onTaskClick={(task) => { setEditTask(task); setShowForm(true); }}
          onNewTask={() => { setEditTask(null); setShowForm(true); }}
        />
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.02 }}
              >
                <TaskCard
                  task={task}
                  onStatusChange={(t, s) => updateStatus.mutate({ task: t, status: s })}
                  onClick={() => { setEditTask(task); setShowForm(true); }}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Nenhuma tarefa encontrada</p>
            </div>
          )}
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