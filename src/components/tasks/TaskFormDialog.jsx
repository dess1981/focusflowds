import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { RefreshCw, Clock, Video, ExternalLink, Copy, CheckSquare, GitBranch, MapPin, AlertCircle } from 'lucide-react';
import ChecklistEditor from './ChecklistEditor';
import SubtasksEditor from './SubtasksEditor';
import InPersonEventSection from './InPersonEventSection';

const WEEK_DAYS = [
  { label: 'Dom', value: 0 },
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sáb', value: 6 },
];

const defaultTask = {
  title: '', description: '', status: 'todo', priority: 'medium',
  task_type: 'task', meet_link: '',
  location_address: '', location_name: '', travel_minutes: '', travel_origin: 'ultimo_evento',
  departure_reminder_minutes: 15,
  due_date: '', time_block_start: '', time_block_end: '',
  estimated_minutes: '', energy_level: 'medium', category_id: '',
  project_id: '', recurrence: 'none', recurrence_days: [], recurrence_end_date: '', parent_task_id: '',
  activity_block_id: '', checklist: [],
};

function generateMeetLink() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const seg = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `https://meet.google.com/${seg(3)}-${seg(4)}-${seg(3)}`;
}

export default function TaskFormDialog({ open, onOpenChange, task, onSave }) {
  const [form, setForm] = useState(defaultTask);
  const isEdit = !!task?.id;

  // Meeting is "complete" when it has date + start time
  const meetingIsComplete = !!(form.due_date && form.time_block_start);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: allTimeBlocks = [] } = useQuery({
    queryKey: ['timeblocks-all'],
    queryFn: () => base44.entities.TimeBlock.list('-created_date', 200),
  });

  const activityBlocks = allTimeBlocks.filter(b =>
    b.is_template || (form.due_date && b.date === form.due_date)
  );

  useEffect(() => {
    if (task) {
      setForm({ ...defaultTask, ...task });
    } else {
      setForm({ ...defaultTask, due_date: new Date().toISOString().split('T')[0] });
    }
  }, [task, open]);

  // Auto-generate meet link when meeting becomes complete (date + time filled)
  useEffect(() => {
    if (form.task_type === 'meeting' && meetingIsComplete && !form.meet_link) {
      setForm(f => ({ ...f, meet_link: generateMeetLink() }));
    }
  }, [form.task_type, form.due_date, form.time_block_start]);

  const handleSave = async () => {
    const data = { ...form };
    if (data.estimated_minutes) data.estimated_minutes = Number(data.estimated_minutes);
    else delete data.estimated_minutes;

    Object.keys(data).forEach(k => {
      if (data[k] === '') delete data[k];
    });

    if (isEdit) {
      await base44.entities.Task.update(task.id, data);
    } else {
      await base44.entities.Task.create(data);
    }
    onSave?.();
    onOpenChange(false);
  };

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleWeekDay = (day) => {
    setForm(f => ({
      ...f,
      recurrence_days: f.recurrence_days?.includes(day)
        ? f.recurrence_days.filter(d => d !== day)
        : [...(f.recurrence_days || []), day],
    }));
  };

  const selectTaskType = (type) => {
    setForm(f => ({ ...f, task_type: type }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div>
            <Label>Título *</Label>
            <Input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="O que precisa ser feito?"
              className="mt-1"
            />
          </div>

          {/* Task type selector — 3 options */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => selectTaskType('task')}
              className={cn(
                "flex-1 py-2 rounded-xl text-sm font-medium border transition-all",
                form.task_type === 'task'
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/30 border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              📋 Tarefa
            </button>
            <button
              type="button"
              onClick={() => selectTaskType('meeting')}
              className={cn(
                "flex-1 py-2 rounded-xl text-sm font-medium border transition-all flex items-center justify-center gap-1.5",
                form.task_type === 'meeting'
                  ? "border-[#22d3ee] text-[#22d3ee]"
                  : "bg-muted/30 border-border text-muted-foreground hover:border-[#22d3ee]/50"
              )}
              style={form.task_type === 'meeting' ? { background: 'rgba(34,211,238,0.1)' } : {}}
            >
              <Video className="w-3.5 h-3.5" /> Reunião Online
            </button>
            <button
              type="button"
              onClick={() => selectTaskType('in_person')}
              className={cn(
                "flex-1 py-2 rounded-xl text-sm font-medium border transition-all flex items-center justify-center gap-1.5",
                form.task_type === 'in_person'
                  ? "border-orange-400 text-orange-400"
                  : "bg-muted/30 border-border text-muted-foreground hover:border-orange-400/50"
              )}
              style={form.task_type === 'in_person' ? { background: 'rgba(251,146,60,0.1)' } : {}}
            >
              <MapPin className="w-3.5 h-3.5" /> Presencial
            </button>
          </div>

          {/* Online meeting details */}
          {form.task_type === 'meeting' && (
            <div
              className="rounded-xl p-3 space-y-3"
              style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.25)' }}
            >
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4" style={{ color: '#22d3ee' }} />
                <span className="text-sm font-semibold" style={{ color: '#22d3ee' }}>Link Google Meet</span>
              </div>

              {!meetingIsComplete ? (
                /* Warning: needs date + time first */
                <div
                  className="flex items-start gap-2 rounded-lg p-2.5 text-xs"
                  style={{ background: 'rgba(34,211,238,0.06)', border: '1px dashed rgba(34,211,238,0.3)' }}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'rgba(34,211,238,0.6)' }} />
                  <span style={{ color: 'rgba(34,211,238,0.7)' }}>
                    Preencha a <strong>data</strong> e o <strong>horário de início</strong> abaixo para gerar o link da reunião automaticamente.
                  </span>
                </div>
              ) : (
                /* Link available */
                <>
                  <div className="flex items-center gap-2">
                    <Input
                      value={form.meet_link}
                      onChange={e => set('meet_link', e.target.value)}
                      className="font-mono text-xs h-8"
                      placeholder="https://meet.google.com/..."
                    />
                    <button
                      type="button"
                      title="Copiar link"
                      onClick={() => navigator.clipboard.writeText(form.meet_link)}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                    >
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <a
                      href={form.meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                      title="Abrir reunião"
                    >
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => set('meet_link', generateMeetLink())}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    🔄 Gerar novo link
                  </button>
                </>
              )}
            </div>
          )}

          {/* In-person event details */}
          {form.task_type === 'in_person' && (
            <InPersonEventSection form={form} set={set} />
          )}

          {/* Description */}
          <div>
            <Label>Descrição</Label>
            <Textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Detalhes adicionais..."
              className="mt-1 h-20"
            />
          </div>

          {/* Priority + Energy */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={v => set('priority', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">🔴 Urgente</SelectItem>
                  <SelectItem value="high">🟠 Alta</SelectItem>
                  <SelectItem value="medium">🔵 Média</SelectItem>
                  <SelectItem value="low">⚪ Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Energia Necessária</Label>
              <Select value={form.energy_level} onValueChange={v => set('energy_level', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">⚡ Alta</SelectItem>
                  <SelectItem value="medium">🔋 Média</SelectItem>
                  <SelectItem value="low">🌿 Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date + Estimated */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data</Label>
              <Input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Tempo Estimado (min)</Label>
              <Input type="number" value={form.estimated_minutes} onChange={e => set('estimated_minutes', e.target.value)} placeholder="30" className="mt-1" />
            </div>
          </div>

          {/* Scheduling */}
          <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-semibold">Agendamento</Label>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Bloco de atividade</Label>
              <Select
                value={form.activity_block_id || 'none'}
                onValueChange={v => set('activity_block_id', v === 'none' ? '' : v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Nenhum bloco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum bloco</SelectItem>
                  {activityBlocks.map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: b.color || '#4F6BED' }} />
                        {b.title}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Horário {form.task_type === 'meeting' ? '(obrigatório para gerar o link)' : '(opcional)'}
              </Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Input type="time" value={form.time_block_start} onChange={e => set('time_block_start', e.target.value)} placeholder="Início" />
                <Input type="time" value={form.time_block_end} onChange={e => set('time_block_end', e.target.value)} placeholder="Fim" />
              </div>
            </div>
          </div>

          {/* Project + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Projeto</Label>
              <Select value={form.project_id || 'none'} onValueChange={v => set('project_id', v === 'none' ? '' : v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.category_id || 'none'} onValueChange={v => set('category_id', v === 'none' ? '' : v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Recurrence */}
          <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-semibold">Recorrência</Label>
            </div>
            <Select value={form.recurrence} onValueChange={v => set('recurrence', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem recorrência</SelectItem>
                <SelectItem value="daily">Diária</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
              </SelectContent>
            </Select>
            {form.recurrence === 'weekly' && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Repetir nos dias</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {WEEK_DAYS.map(d => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleWeekDay(d.value)}
                      className={cn(
                        "w-9 h-9 rounded-full text-xs font-medium border transition-colors",
                        form.recurrence_days?.includes(d.value)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-primary/50"
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {form.recurrence !== 'none' && (
              <div>
                <Label className="text-xs text-muted-foreground">Repetir até (opcional)</Label>
                <Input
                  type="date"
                  value={form.recurrence_end_date || ''}
                  onChange={e => set('recurrence_end_date', e.target.value)}
                  className="mt-1"
                  min={form.due_date}
                />
              </div>
            )}
          </div>

          {/* Checklist */}
          <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-semibold">Checklist</Label>
            </div>
            <ChecklistEditor
              items={form.checklist || []}
              onChange={items => set('checklist', items)}
            />
          </div>

          {/* Subtasks */}
          {isEdit && (
            <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm font-semibold">Subtarefas</Label>
              </div>
              <SubtasksEditor parentTaskId={task.id} />
            </div>
          )}
          {!isEdit && (
            <p className="text-xs text-muted-foreground px-1">
              💡 Salve a tarefa primeiro para adicionar subtarefas.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!form.title.trim()}>
            {isEdit ? 'Salvar' : 'Criar Tarefa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}