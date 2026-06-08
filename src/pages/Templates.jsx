import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Pencil, ClipboardList, Layers, Zap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import ChecklistEditor from '@/components/tasks/ChecklistEditor';

const PRIORITY_LABELS = { urgent: '🔴 Urgente', high: '🟠 Alta', medium: '🔵 Média', low: '⚪ Baixa' };
const ENERGY_LABELS = { high: '⚡ Alta', medium: '🔋 Média', low: '🌿 Baixa' };
const TYPE_LABELS = { task: '📋 Tarefa', meeting: '📹 Reunião Online', in_person: '📍 Presencial' };

const defaultForm = {
  name: '', emoji: '📋', title: '', description: '', priority: 'medium',
  task_type: 'task', energy_level: 'medium', estimated_minutes: '',
  time_block_start: '', time_block_end: '', category_id: '', project_id: '',
  checklist: [], notes: '',
};

const EMOJIS = ['📋', '🎯', '⚡', '📞', '✉️', '📊', '🏃', '💡', '🔧', '📝', '🌟', '🔴', '💼', '🏠', '🎓', '💰', '🤝', '🛒'];

export default function Templates() {
  const [tab, setTab] = useState('tasks'); // 'tasks' | 'blocks'
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const queryClient = useQueryClient();

  // Task templates
  const { data: taskTemplates = [] } = useQuery({
    queryKey: ['task-templates'],
    queryFn: () => base44.entities.TaskTemplate.list('-use_count', 100),
  });

  // Block templates (is_template = true)
  const { data: allBlocks = [] } = useQuery({
    queryKey: ['timeblocks'],
    queryFn: () => base44.entities.TimeBlock.list('-created_date', 200),
  });
  const blockTemplates = allBlocks.filter(b => b.is_template);

  // Categories & Projects for form
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => base44.entities.Category.list() });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list() });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data };
      if (payload.estimated_minutes) payload.estimated_minutes = Number(payload.estimated_minutes);
      else delete payload.estimated_minutes;
      Object.keys(payload).forEach(k => { if (payload[k] === '') delete payload[k]; });

      if (editItem) {
        await base44.entities.TaskTemplate.update(editItem.id, payload);
      } else {
        await base44.entities.TaskTemplate.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      setDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TaskTemplate.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task-templates'] }),
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (id) => base44.entities.TimeBlock.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timeblocks'] }),
  });

  const openNew = () => {
    setEditItem(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (t) => {
    setEditItem(t);
    setForm({
      name: t.name || '', emoji: t.emoji || '📋', title: t.title || '',
      description: t.description || '', priority: t.priority || 'medium',
      task_type: t.task_type || 'task', energy_level: t.energy_level || 'medium',
      estimated_minutes: t.estimated_minutes || '',
      time_block_start: t.time_block_start || '', time_block_end: t.time_block_end || '',
      category_id: t.category_id || '', project_id: t.project_id || '',
      checklist: t.checklist || [], notes: t.notes || '',
    });
    setDialogOpen(true);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Modelos reutilizáveis para tarefas e blocos de tempo</p>
        </div>
        {tab === 'tasks' && (
          <Button onClick={openNew}>
            <Plus className="w-4 h-4 mr-1.5" /> Novo Template de Tarefa
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('tasks')}
          className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            tab === 'tasks' ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          <ClipboardList className="w-4 h-4" /> Templates de Tarefa
          {taskTemplates.length > 0 && (
            <span className="bg-primary/10 text-primary text-xs px-1.5 rounded-full">{taskTemplates.length}</span>
          )}
        </button>
        <button
          onClick={() => setTab('blocks')}
          className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            tab === 'blocks' ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          <Layers className="w-4 h-4" /> Blocos de Atividade
          {blockTemplates.length > 0 && (
            <span className="bg-primary/10 text-primary text-xs px-1.5 rounded-full">{blockTemplates.length}</span>
          )}
        </button>
      </div>

      {/* Task Templates */}
      {tab === 'tasks' && (
        <div className="space-y-2">
          {taskTemplates.length === 0 && (
            <div className="text-center py-16">
              <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Nenhum template criado</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Crie templates para tarefas que você repete com frequência — reuniões semanais, relatórios, rotinas, etc.
              </p>
              <Button className="mt-4" variant="outline" onClick={openNew}>
                <Plus className="w-4 h-4 mr-1.5" /> Criar Template
              </Button>
            </div>
          )}

          {taskTemplates.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
              <div className="glass-card rounded-xl p-4 flex items-center gap-4 group hover:border-primary/30 transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-primary/10">
                  {t.emoji || '📋'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{t.name}</p>
                  {t.title && <p className="text-xs text-muted-foreground truncate mt-0.5">Título: "{t.title}"</p>}
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {t.priority && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{PRIORITY_LABELS[t.priority]}</span>
                    )}
                    {t.task_type && t.task_type !== 'task' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{TYPE_LABELS[t.task_type]}</span>
                    )}
                    {t.estimated_minutes && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />{t.estimated_minutes}min
                      </span>
                    )}
                    {t.checklist?.length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        ✅ {t.checklist.length} itens
                      </span>
                    )}
                    {t.use_count > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" />Usado {t.use_count}x
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteMutation.mutate(t.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Block Templates */}
      {tab === 'blocks' && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Gerencie os blocos de atividade em <strong>Blocos de Tempo → Blocos de Atividade</strong>. Aqui você visualiza os existentes.</p>
          {blockTemplates.length === 0 && (
            <div className="text-center py-16">
              <Layers className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Nenhum bloco de atividade criado</p>
            </div>
          )}
          {blockTemplates.map((b, i) => (
            <motion.div key={b.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
              <div className="glass-card rounded-xl p-4 flex items-center gap-4 group relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: b.color || '#4F6BED' }} />
                <div className="w-8 h-8 rounded-lg flex items-center justify-center ml-1" style={{ backgroundColor: `${b.color || '#4F6BED'}20` }}>
                  <Layers className="w-4 h-4" style={{ color: b.color || '#4F6BED' }} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{b.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{b.type}</p>
                </div>
                <button
                  onClick={() => deleteBlockMutation.mutate(b.id)}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Task Template Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Editar Template' : 'Novo Template de Tarefa'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name + Emoji */}
            <div className="flex gap-3">
              <div>
                <Label>Emoji</Label>
                <Select value={form.emoji} onValueChange={v => set('emoji', v)}>
                  <SelectTrigger className="mt-1 w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EMOJIS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label>Nome do Template *</Label>
                <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Reunião Semanal, Relatório..." className="mt-1" />
              </div>
            </div>

            {/* Task title */}
            <div>
              <Label>Título padrão da tarefa</Label>
              <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Pode deixar vazio para preencher ao usar" className="mt-1" />
            </div>

            {/* Description */}
            <div>
              <Label>Descrição padrão</Label>
              <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Detalhes..." className="mt-1 h-16" />
            </div>

            {/* Type + Priority + Energy */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Tipo</Label>
                <Select value={form.task_type} onValueChange={v => set('task_type', v)}>
                  <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task">📋 Tarefa</SelectItem>
                    <SelectItem value="meeting">📹 Reunião</SelectItem>
                    <SelectItem value="in_person">📍 Presencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Prioridade</Label>
                <Select value={form.priority} onValueChange={v => set('priority', v)}>
                  <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">🔴 Urgente</SelectItem>
                    <SelectItem value="high">🟠 Alta</SelectItem>
                    <SelectItem value="medium">🔵 Média</SelectItem>
                    <SelectItem value="low">⚪ Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Energia</Label>
                <Select value={form.energy_level} onValueChange={v => set('energy_level', v)}>
                  <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">⚡ Alta</SelectItem>
                    <SelectItem value="medium">🔋 Média</SelectItem>
                    <SelectItem value="low">🌿 Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Time + Estimated */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Início</Label>
                <Input type="time" value={form.time_block_start} onChange={e => set('time_block_start', e.target.value)} className="mt-1 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Fim</Label>
                <Input type="time" value={form.time_block_end} onChange={e => set('time_block_end', e.target.value)} className="mt-1 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Duração (min)</Label>
                <Input type="number" value={form.estimated_minutes} onChange={e => set('estimated_minutes', e.target.value)} placeholder="30" className="mt-1 text-xs" />
              </div>
            </div>

            {/* Project + Category */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Projeto padrão</Label>
                <Select value={form.project_id || 'none'} onValueChange={v => set('project_id', v === 'none' ? '' : v)}>
                  <SelectTrigger className="mt-1 text-xs"><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Categoria padrão</Label>
                <Select value={form.category_id || 'none'} onValueChange={v => set('category_id', v === 'none' ? '' : v)}>
                  <SelectTrigger className="mt-1 text-xs"><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Checklist */}
            <div className="border border-border rounded-xl p-3 bg-muted/30">
              <Label className="text-sm font-semibold mb-2 block">✅ Checklist padrão</Label>
              <ChecklistEditor items={form.checklist} onChange={items => set('checklist', items)} />
            </div>

            {/* Notes */}
            <div>
              <Label>Notas padrão</Label>
              <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Observações que sempre aparecem nesta tarefa..." className="mt-1 h-16" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={!form.name.trim() || saveMutation.isPending}>
              {saveMutation.isPending ? 'Salvando...' : editItem ? 'Salvar' : 'Criar Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}