import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Clock, ChevronLeft, ChevronRight, Trash2, RefreshCw, Layers, Calendar, BarChart3 } from 'lucide-react';
import { format, addDays, subDays, isToday, addWeeks, addMonths, parseISO, isBefore, isAfter, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import TimeBlocksCalendar from '@/components/timeblocks/TimeBlocksCalendar';
import TimeBlocksAnalytics from '@/components/timeblocks/TimeBlocksAnalytics';

const typeConfig = {
  task: { label: 'Tarefa', color: 'bg-blue-100 text-blue-700 border-blue-200', hex: '#3B82F6' },
  break: { label: 'Pausa', color: 'bg-green-100 text-green-700 border-green-200', hex: '#10B981' },
  focus: { label: 'Foco', color: 'bg-purple-100 text-purple-700 border-purple-200', hex: '#A855F7' },
  meeting: { label: 'Reunião', color: 'bg-amber-100 text-amber-700 border-amber-200', hex: '#F59E0B' },
  personal: { label: 'Pessoal', color: 'bg-rose-100 text-rose-700 border-rose-200', hex: '#F43F5E' },
  sleep: { label: 'Sono', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', hex: '#6366F1' },
};

const WEEK_DAYS = [
  { label: 'Dom', value: 0 },
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sáb', value: 6 },
];

const defaultForm = {
  title: '',
  date: '',
  start_time: '',
  end_time: '',
  type: 'task',
  color: '#4F6BED',
  is_template: false,
  recurrence: 'none',
  recurrence_end_date: '',
  recurrence_days: [],
};

function generateRecurringDates(startDate, recurrence, recurrenceDays, endDate) {
  const dates = [];
  const start = parseISO(startDate);
  const end = endDate ? parseISO(endDate) : addMonths(start, 3); // default 3 months max
  let current = start;

  while (!isAfter(current, end)) {
    const dateStr = format(current, 'yyyy-MM-dd');
    if (recurrence === 'daily') {
      dates.push(dateStr);
      current = addDays(current, 1);
    } else if (recurrence === 'weekly') {
      const days = recurrenceDays.length > 0 ? recurrenceDays : [getDay(start)];
      if (days.includes(getDay(current))) {
        dates.push(dateStr);
      }
      current = addDays(current, 1);
    } else if (recurrence === 'monthly') {
      dates.push(dateStr);
      current = addMonths(current, 1);
    } else {
      break;
    }
    if (dates.length > 90) break; // safety limit
  }

  return dates;
}

export default function TimeBlocks() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editBlock, setEditBlock] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteScope, setDeleteScope] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const queryClient = useQueryClient();
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const { data: blocks = [] } = useQuery({
    queryKey: ['timeblocks'],
    queryFn: () => base44.entities.TimeBlock.list('-created_date', 500),
  });

  const dayBlocks = useMemo(() =>
    blocks.filter(b => b.date === dateStr).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')),
    [blocks, dateStr]
  );

  const getDuration = (start, end) => {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  };

  // Calcula percentuais por tipo de bloco para o dia
  const dayStats = useMemo(() => {
    const stats = {};
    let totalMinutes = 0;

    dayBlocks.forEach(block => {
      const type = block.type || 'task';
      if (!stats[type]) stats[type] = 0;
      
      if (block.start_time && block.end_time) {
        const minutes = getDuration(block.start_time, block.end_time);
        stats[type] += minutes;
        totalMinutes += minutes;
      }
    });

    const percentages = {};
    Object.keys(stats).forEach(type => {
      percentages[type] = totalMinutes > 0 ? Math.round((stats[type] / totalMinutes) * 100) : 0;
    });

    return { stats, totalMinutes, percentages };
  }, [dayBlocks]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editBlock) {
        // Save single block edit
        const { recurrence, recurrence_end_date, recurrence_days, ...blockData } = data;
        await base44.entities.TimeBlock.update(editBlock.id, {
          ...blockData,
          recurrence: editBlock.recurrence,
          recurrence_end_date: editBlock.recurrence_end_date,
          recurrence_days: editBlock.recurrence_days,
          recurrence_group_id: editBlock.recurrence_group_id,
        });
      } else if (data.is_template) {
       // Save as activity block template with optional recurrence
       if (data.recurrence && data.recurrence !== 'none') {
         // Create recurring template blocks
         const groupId = crypto.randomUUID();
         const dates = generateRecurringDates(
           data.date || format(new Date(), 'yyyy-MM-dd'),
           data.recurrence,
           data.recurrence_days || [],
           data.recurrence_end_date
         );
         await base44.entities.TimeBlock.bulkCreate(
           dates.map(d => ({
             title: data.title,
             date: d,
             start_time: data.start_time,
             end_time: data.end_time,
             type: data.type,
             color: data.color,
             is_template: false,
             recurrence: data.recurrence,
             recurrence_end_date: data.recurrence_end_date,
             recurrence_days: data.recurrence_days,
             recurrence_group_id: groupId,
           }))
         );
       } else {
         // Save as simple template (no recurrence)
         await base44.entities.TimeBlock.create({
           title: data.title,
           type: data.type,
           color: data.color,
           start_time: data.start_time,
           end_time: data.end_time,
           is_template: true,
         });
       }
      } else if (data.recurrence && data.recurrence !== 'none') {
        // Create recurring blocks
        const groupId = crypto.randomUUID();
        const dates = generateRecurringDates(
          data.date,
          data.recurrence,
          data.recurrence_days || [],
          data.recurrence_end_date
        );
        await base44.entities.TimeBlock.bulkCreate(
          dates.map(d => ({
            title: data.title,
            date: d,
            start_time: data.start_time,
            end_time: data.end_time,
            type: data.type,
            color: data.color,
            recurrence: data.recurrence,
            recurrence_end_date: data.recurrence_end_date,
            recurrence_days: data.recurrence_days,
            recurrence_group_id: groupId,
          }))
        );
      } else {
        await base44.entities.TimeBlock.create({
          ...data,
          recurrence: 'none',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeblocks'] });
      setShowForm(false);
    },
    onError: (err) => {
      console.error('Erro ao salvar bloco:', err);
      alert('Erro ao salvar: ' + (err?.message || 'Tente novamente'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ block, scope }) => {
      if (scope === 'all' && block.recurrence_group_id) {
        const group = blocks.filter(b => b.recurrence_group_id === block.recurrence_group_id);
        await Promise.all(group.map(b => base44.entities.TimeBlock.delete(b.id)));
      } else {
        await base44.entities.TimeBlock.delete(block.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeblocks'] });
      setDeleteScope(null);
    },
  });

  const openForm = (block = null) => {
    if (block) {
      setEditBlock(block);
      setForm({
        title: block.title,
        date: block.date || '',
        start_time: block.start_time || '',
        end_time: block.end_time || '',
        type: block.type || 'task',
        color: block.color || '#4F6BED',
        is_template: block.is_template || false,
        recurrence: block.recurrence || 'none',
        recurrence_end_date: block.recurrence_end_date || '',
        recurrence_days: block.recurrence_days || [],
      });
    } else {
      setEditBlock(null);
      setForm({ ...defaultForm, date: dateStr });
    }
    setShowForm(true);
  };

  const handleDelete = (e, block) => {
    e.stopPropagation();
    if (block.recurrence_group_id) {
      setDeleteScope({ block, scope: 'one' });
    } else {
      deleteMutation.mutate({ block, scope: 'one' });
    }
  };

  const toggleWeekDay = (day) => {
    setForm(f => ({
      ...f,
      recurrence_days: f.recurrence_days.includes(day)
        ? f.recurrence_days.filter(d => d !== day)
        : [...f.recurrence_days, day],
    }));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Blocos de Tempo</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            📅 Organize seu dia com blocos de atividade
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Abas */}
          <div className="flex items-center border border-border rounded-lg p-1 bg-muted/50">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'list'
                  ? 'bg-background shadow-sm text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Timeline
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'calendar'
                  ? 'bg-background shadow-sm text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Calendário
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-background shadow-sm text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Análise
            </button>
          </div>

          {/* Navegação de data */}
          <Button variant="outline" size="icon" onClick={() => setSelectedDate(d => subDays(d, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant={isToday(selectedDate) ? "default" : "outline"} size="sm" onClick={() => setSelectedDate(new Date())}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={() => setSelectedDate(d => addDays(d, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button className="ml-2" onClick={() => openForm()}>
            <Plus className="w-4 h-4 mr-1.5" />
            Novo Bloco
          </Button>
        </div>
      </div>

      <p className="text-sm font-medium text-muted-foreground">
        {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
      </p>

      {/* Conteúdo por Aba */}
      {activeTab === 'calendar' && (
        <TimeBlocksCalendar
          blocks={blocks}
          selectedDate={selectedDate}
          onDateClick={setSelectedDate}
          onPrevMonth={() => setSelectedDate(d => subDays(d, 30))}
          onNextMonth={() => setSelectedDate(d => addDays(d, 30))}
        />
      )}

      {activeTab === 'analytics' && (
        <TimeBlocksAnalytics blocks={blocks} selectedDate={selectedDate} />
      )}

      {activeTab === 'list' && (
        <>
          {/* Dashboard de Equilíbrio */}
          {dayBlocks.length > 0 && dayStats.totalMinutes > 0 && (
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
          <CardContent className="p-6">
            <h3 className="font-semibold text-sm mb-4">Equilíbrio do Dia</h3>
            <div className="space-y-3">
              {/* Barra visual horizontal */}
              <div className="flex h-8 rounded-lg overflow-hidden gap-0.5 bg-muted/30">
                {Object.entries(dayStats.percentages)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, percentage]) => {
                    const config = typeConfig[type];
                    return percentage > 0 ? (
                      <div
                        key={type}
                        className="flex items-center justify-center text-xs font-semibold text-white transition-all hover:opacity-80"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: config?.hex,
                          minWidth: percentage > 5 ? 'auto' : '0',
                        }}
                        title={`${config?.label}: ${dayStats.stats[type]} min (${percentage}%)`}
                      >
                        {percentage > 8 && <span>{percentage}%</span>}
                      </div>
                    ) : null;
                  })}
              </div>

              {/* Legenda com minutos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(dayStats.stats)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, minutes]) => {
                    const config = typeConfig[type];
                    const hours = Math.floor(minutes / 60);
                    const mins = minutes % 60;
                    return (
                      <div key={type} className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config?.hex }} />
                        <div>
                          <p className="font-medium">{config?.label}</p>
                          <p className="text-muted-foreground">
                            {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Total do dia */}
              <div className="text-center pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  Total: <span className="font-semibold text-foreground">
                    {Math.floor(dayStats.totalMinutes / 60)}h {dayStats.totalMinutes % 60}m
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

          {/* Timeline de Blocos */}
          <div className="space-y-2">
        {dayBlocks.map((block, i) => {
          const config = typeConfig[block.type] || typeConfig.task;
          const duration = block.start_time && block.end_time ? getDuration(block.start_time, block.end_time) : null;

          return (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="cursor-pointer hover:shadow-md transition-all group relative overflow-hidden"
                onClick={() => openForm(block)}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: block.color || '#4F6BED' }} />
                <CardContent className="p-4 pl-5 flex items-center gap-4">
                  <div className="text-center min-w-[80px]">
                    <p className="text-sm font-semibold">{block.start_time}</p>
                    <p className="text-xs text-muted-foreground">{block.end_time}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm flex items-center gap-1.5">
                      {block.title}
                      {block.recurrence && block.recurrence !== 'none' && (
                        <RefreshCw className="w-3 h-3 text-muted-foreground" />
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full border", config.color)}>
                        {config.label}
                      </span>
                      {duration !== null && <span className="text-xs text-muted-foreground">{duration} min</span>}
                      {block.recurrence && block.recurrence !== 'none' && (
                        <span className="text-xs text-muted-foreground">
                          · {{ daily: 'Diário', weekly: 'Semanal', monthly: 'Mensal' }[block.recurrence]}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, block)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-destructive transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

            {dayBlocks.length === 0 && (
              <div className="text-center py-16">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Nenhum bloco de tempo para este dia</p>
                <Button className="mt-4" variant="outline" onClick={() => openForm(null)}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Criar Bloco
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Create/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editBlock ? 'Editar Bloco' : 'Novo Bloco de Tempo'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Título *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder='O que você vai fazer?' className="mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task">📋 Tarefa</SelectItem>
                    <SelectItem value="focus">🎯 Foco Profundo</SelectItem>
                    <SelectItem value="meeting">📅 Reunião</SelectItem>
                    <SelectItem value="break">☕ Pausa</SelectItem>
                    <SelectItem value="personal">🏠 Pessoal</SelectItem>
                    <SelectItem value="sleep">😴 Sono</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cor</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    className="w-9 h-9 rounded-md border border-input cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground">{form.color}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Início *</Label>
                <Input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Fim *</Label>
                <Input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Data *</Label>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="mt-1" />
            </div>

            {/* Recurrence section */}
            {!editBlock && (
              <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-semibold">Recorrência</Label>
                </div>
                <Select value={form.recurrence} onValueChange={v => setForm(f => ({ ...f, recurrence: v, recurrence_days: [] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem recorrência</SelectItem>
                    <SelectItem value="daily">Diário</SelectItem>
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
                            form.recurrence_days.includes(d.value)
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
                    <Label className="text-xs text-muted-foreground">Até quando (opcional)</Label>
                    <Input
                      type="date"
                      value={form.recurrence_end_date}
                      onChange={e => setForm(f => ({ ...f, recurrence_end_date: e.target.value }))}
                      className="mt-1"
                      min={form.date || format(new Date(), 'yyyy-MM-dd')}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Se não definida, repete por até 3 meses
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button
              onClick={() => saveMutation.mutate(form)}
              disabled={!form.title.trim() || !form.start_time || !form.end_time || !form.date || saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Salvando...'
                : editBlock ? 'Salvar'
                : form.recurrence !== 'none' ? 'Criar Série'
                : 'Criar Bloco'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete recurrence scope dialog */}
      <Dialog open={!!deleteScope} onOpenChange={() => setDeleteScope(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir Bloco Recorrente</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Este bloco faz parte de uma série recorrente. O que deseja excluir?
          </p>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDeleteScope(null)}>Cancelar</Button>
            <Button variant="outline" onClick={() => deleteMutation.mutate({ block: deleteScope?.block, scope: 'one' })}>
              Só este
            </Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate({ block: deleteScope?.block, scope: 'all' })}>
              Toda a série
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}