import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, FolderKanban, Trash2, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import TaskListDrawer from '@/components/tasks/TaskListDrawer';

const COLORS = ['#4F6BED', '#2ECC94', '#F4A940', '#FF6B6B', '#9B59B6', '#1ABC9C', '#E74C3C', '#3498DB'];

const statusLabels = {
  active: 'Ativo',
  paused: 'Pausado',
  completed: 'Concluído',
  archived: 'Arquivado',
};

export default function Projects() {
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', color: '#4F6BED', status: 'active' });
  const [drawerProject, setDrawerProject] = useState(null);
  const queryClient = useQueryClient();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
  });

  // Dedicated query for drawer tasks — always fetches fresh data when a project drawer opens
  const { data: drawerTasks = [] } = useQuery({
    queryKey: ['tasks', 'project', drawerProject?.id],
    queryFn: () => base44.entities.Task.filter({ project_id: drawerProject.id }),
    enabled: !!drawerProject,
    staleTime: 0,
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editProject) {
        await base44.entities.Project.update(editProject.id, data);
      } else {
        await base44.entities.Project.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const openForm = (project) => {
    if (project) {
      setEditProject(project);
      setForm({ name: project.name, description: project.description || '', color: project.color || '#4F6BED', status: project.status || 'active' });
    } else {
      setEditProject(null);
      setForm({ name: '', description: '', color: '#4F6BED', status: 'active' });
    }
    setShowForm(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Projetos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{projects.length} projeto{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => openForm(null)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Novo Projeto
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project, i) => {
          const projectTasks = tasks.filter(t => t.project_id === project.id);
          const done = projectTasks.filter(t => t.status === 'done').length;
          const total = projectTasks.length;
          const pct = total ? Math.round((done / total) * 100) : 0;

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="cursor-pointer hover:shadow-md transition-all group relative overflow-hidden"
                onClick={() => setDrawerProject(project)}
              >
                <div className="h-1.5 w-full" style={{ backgroundColor: project.color || '#4F6BED' }} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{project.name}</h3>
                      {project.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {statusLabels[project.status] || project.status}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{done}/{total} tarefas</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: project.color }}
                      />
                    </div>
                  </div>

                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={(e) => { e.stopPropagation(); openForm(project); }}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(project.id); }}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {projects.length === 0 && (
          <div className="col-span-full text-center py-16">
            <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhum projeto criado ainda</p>
          </div>
        )}
      </div>

      <TaskListDrawer
        open={!!drawerProject}
        onOpenChange={(v) => !v && setDrawerProject(null)}
        title={drawerProject?.name || ''}
        color={drawerProject?.color}
        tasks={drawerTasks}
        projectId={drawerProject?.id}
        onEdit={() => { openForm(drawerProject); setDrawerProject(null); }}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editProject ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do projeto" className="mt-1" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Cor</Label>
              <div className="flex gap-2 mt-1.5">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={!form.name.trim()}>
              {editProject ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}