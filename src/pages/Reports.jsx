import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Eye, Code, Table, Type, Volume2, Mail, Download, Settings, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const FORMATS = [
  { id: 'visual', label: '📊 Visual', icon: Eye, description: 'Gráficos e dashboards' },
  { id: 'data', label: '📈 Dados Puros', icon: Code, description: 'Números e estatísticas' },
  { id: 'spreadsheet', label: '📋 Planilha', icon: Table, description: 'Tabela baixável' },
  { id: 'text', label: '📄 Texto', icon: Type, description: 'Resumo formatado' },
  { id: 'audio', label: '🎙️ Áudio', icon: Volume2, description: 'Narração gerada' },
];

const REPORT_TYPES = [
  { id: 'daily', label: 'Diária', period: 'hoje' },
  { id: 'weekly', label: 'Semanal', period: 'esta semana' },
  { id: 'monthly', label: 'Mensal', period: 'este mês' },
];

const COLORS = ['#a855f7', '#22d3ee', '#fb923c', '#10b981', '#ef4444', '#6366f1'];

function generateMockData(reportType) {
  const days = reportType === 'daily' ? 1 : reportType === 'weekly' ? 7 : 30;
  const data = Array.from({ length: days }, (_, i) => ({
    day: `Dia ${i + 1}`,
    focus: Math.floor(Math.random() * 480) + 60,
    completed: Math.floor(Math.random() * 12) + 2,
    productivity: Math.floor(Math.random() * 100) + 20,
  }));
  return data;
}

function generateStats(tasks) {
  const completed = tasks.filter(t => t.status === 'done').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const total = tasks.length;
  const totalFocusSeconds = tasks.reduce((sum, t) => sum + (t.total_focus_seconds || 0), 0);
  const avgFocus = total > 0 ? totalFocusSeconds / total / 60 : 0;

  return {
    completed,
    inProgress,
    total,
    completionRate: total > 0 ? (completed / total * 100).toFixed(1) : 0,
    totalFocusHours: (totalFocusSeconds / 3600).toFixed(1),
    avgFocusMinutes: avgFocus.toFixed(1),
  };
}

export default function Reports() {
  const [selectedFormat, setSelectedFormat] = useState('visual');
  const [selectedType, setSelectedType] = useState('weekly');
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();

  // Fetch tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-reports'],
    queryFn: () => base44.entities.Task.list('-created_date', 200),
  });

  // Fetch user preferences
  const { data: userPrefs = null } = useQuery({
    queryKey: ['report-preferences'],
    queryFn: async () => {
      const prefs = await base44.entities.ReportPreference.list();
      return prefs?.[0] || null;
    },
  });

  // Save preferences
  const savePrefsMutation = useMutation({
    mutationFn: async (data) => {
      if (userPrefs?.id) {
        await base44.entities.ReportPreference.update(userPrefs.id, data);
      } else {
        await base44.entities.ReportPreference.create(data);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['report-preferences'] }),
  });

  // Send email
  const sendEmailMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('sendReportEmail', data),
    onSuccess: () => {
      setEmailDialogOpen(false);
      setEmailAddress('');
      setSending(false);
    },
  });

  const stats = generateStats(tasks);
  const chartData = generateMockData(selectedType);

  const handleSendEmail = async () => {
    setSending(true);
    await sendEmailMutation.mutateAsync({
      email: emailAddress,
      format: selectedFormat,
      reportType: selectedType,
      stats,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Visualize seus dados de produtividade do jeito que funciona melhor para você</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreferencesOpen(true)}>
            <Settings className="w-4 h-4 mr-1.5" /> Preferências
          </Button>
          <Button onClick={() => setEmailDialogOpen(true)}>
            <Mail className="w-4 h-4 mr-1.5" /> Enviar por Email
          </Button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex gap-2 flex-wrap">
        {REPORT_TYPES.map(type => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              selectedType === type.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {type.label} ({type.period})
          </button>
        ))}
      </div>

      {/* Format Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {FORMATS.map(fmt => {
          const Icon = fmt.icon;
          return (
            <motion.button
              key={fmt.id}
              onClick={() => setSelectedFormat(fmt.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "p-3 rounded-xl transition-all border-2 text-center",
                selectedFormat === fmt.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-muted/30 hover:border-primary/50"
              )}
            >
              <Icon className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xs font-semibold">{fmt.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{fmt.description}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Content Area */}
      <motion.div
        key={selectedFormat}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Visual Format */}
        {selectedFormat === 'visual' && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="glass-card rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Taxa de Conclusão</p>
                <p className="text-3xl font-bold text-primary">{stats.completionRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.completed} de {stats.total} tarefas</p>
              </div>
              <div className="glass-card rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Horas de Foco</p>
                <p className="text-3xl font-bold text-accent">{stats.totalFocusHours}h</p>
                <p className="text-xs text-muted-foreground mt-1">Total neste período</p>
              </div>
              <div className="glass-card rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Média de Foco</p>
                <p className="text-3xl font-bold text-chart-1">{stats.avgFocusMinutes}min</p>
                <p className="text-xs text-muted-foreground mt-1">Por tarefa</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="glass-card rounded-xl p-4">
                <p className="font-semibold text-sm mb-3">Produtividade</p>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'rgba(10,12,22,0.9)', border: '1px solid rgba(168,85,247,0.3)' }} />
                    <Line type="monotone" dataKey="productivity" stroke="#a855f7" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card rounded-xl p-4">
                <p className="font-semibold text-sm mb-3">Tempo de Foco (min)</p>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'rgba(10,12,22,0.9)', border: '1px solid rgba(168,85,247,0.3)' }} />
                    <Bar dataKey="focus" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card rounded-xl p-4">
                <p className="font-semibold text-sm mb-3">Tarefas Concluídas</p>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'rgba(10,12,22,0.9)', border: '1px solid rgba(168,85,247,0.3)' }} />
                    <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card rounded-xl p-4">
                <p className="font-semibold text-sm mb-3">Status das Tarefas</p>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={[
                      { name: 'Concluídas', value: stats.completed, fill: COLORS[0] },
                      { name: 'Em Progresso', value: stats.inProgress, fill: COLORS[1] },
                      { name: 'A Fazer', value: stats.total - stats.completed - stats.inProgress, fill: COLORS[2] },
                    ]} cx="50%" cy="50%" labelLine={false} label={entry => `${entry.name}: ${entry.value}`} dataKey="value">
                      {COLORS.map((color, i) => <Cell key={i} fill={color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Data Format */}
        {selectedFormat === 'data' && (
          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.entries(stats).map(([key, value]) => (
                <div key={key} className="border border-border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground capitalize mb-1">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xl font-bold text-primary">{value}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-sm font-semibold mb-2">Dados Detalhados por Dia</p>
              <div className="space-y-1 text-xs">
                {chartData.slice(0, 10).map((day, i) => (
                  <div key={i} className="flex justify-between p-2 bg-muted/30 rounded">
                    <span>{day.day}</span>
                    <span>Foco: {day.focus}min | Tarefas: {day.completed} | Prod: {day.productivity}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Spreadsheet Format */}
        {selectedFormat === 'spreadsheet' && (
          <div className="glass-card rounded-xl p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2">Dia</th>
                  <th className="text-right p-2">Foco (min)</th>
                  <th className="text-right p-2">Tarefas</th>
                  <th className="text-right p-2">Produtividade</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-primary/5">
                    <td className="p-2">{row.day}</td>
                    <td className="text-right p-2">{row.focus}</td>
                    <td className="text-right p-2">{row.completed}</td>
                    <td className="text-right p-2">{row.productivity}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button variant="outline" className="mt-4" onClick={() => {
              const csv = [
                ['Dia', 'Foco (min)', 'Tarefas', 'Produtividade'],
                ...chartData.map(r => [r.day, r.focus, r.completed, r.productivity])
              ].map(row => row.join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `relatorio-${selectedType}.csv`;
              a.click();
            }}>
              <Download className="w-4 h-4 mr-1.5" /> Baixar CSV
            </Button>
          </div>
        )}

        {/* Text Format */}
        {selectedFormat === 'text' && (
          <div className="glass-card rounded-xl p-6 space-y-4 whitespace-pre-wrap font-mono text-sm">
            <div>
              <p className="font-bold text-base mb-2">📊 RELATÓRIO DE PRODUTIVIDADE</p>
              <p className="text-xs text-muted-foreground">Período: {selectedType === 'daily' ? 'Diário' : selectedType === 'weekly' ? 'Semanal' : 'Mensal'}</p>
            </div>
            
            <div className="border-t border-border pt-4">
              <p className="font-bold mb-1">RESUMO EXECUTIVO</p>
              <p>• Taxa de Conclusão: {stats.completionRate}%</p>
              <p>• Tarefas Concluídas: {stats.completed} de {stats.total}</p>
              <p>• Horas de Foco Total: {stats.totalFocusHours}h</p>
              <p>• Tempo Médio por Tarefa: {stats.avgFocusMinutes}min</p>
            </div>

            <div className="border-t border-border pt-4">
              <p className="font-bold mb-1">ANÁLISE</p>
              <p>Este período foi marcado por {stats.completionRate > 70 ? 'alta produtividade' : stats.completionRate > 50 ? 'produtividade moderada' : 'produtividade baixa'}.</p>
              <p>Você dedicou {stats.totalFocusHours} horas em foco concentrado, mantendo uma média de {stats.avgFocusMinutes}min por tarefa.</p>
            </div>

            <div className="border-t border-border pt-4">
              <p className="font-bold mb-1">PRÓXIMOS PASSOS</p>
              <p>1. Revisar as tarefas ainda em progresso</p>
              <p>2. Aproveitar sua média de foco para melhorar planejamento</p>
              <p>3. Considerar tempo de descanso adequado</p>
            </div>
          </div>
        )}

        {/* Audio Format */}
        {selectedFormat === 'audio' && (
          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="text-center py-8">
              <Volume2 className="w-12 h-12 mx-auto text-primary/50 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">Gere uma narração de áudio do seu relatório</p>
              <Button onClick={async () => {
                const audioData = await base44.functions.invoke('generateReportAudio', {
                  stats,
                  reportType: selectedType,
                });
                // Create audio element
                const audio = new Audio(audioData.audioUrl);
                audio.play();
              }}>
                <Volume2 className="w-4 h-4 mr-2" /> Gerar e Ouvir Áudio
              </Button>
            </div>
            <div className="border-t border-border pt-4 text-xs text-muted-foreground">
              <p>💡 O áudio será gerado com base no seu relatório de {selectedType === 'daily' ? 'hoje' : selectedType === 'weekly' ? 'esta semana' : 'este mês'}.</p>
              <p>Velocidade de reprodução: {(userPrefs?.audio_speed || 1).toFixed(2)}x</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Relatório por Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={emailAddress}
                onChange={e => setEmailAddress(e.target.value)}
                placeholder="seu@email.com"
                className="mt-2"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Formato: <strong>{FORMATS.find(f => f.id === selectedFormat)?.label}</strong></p>
              <p>Tipo: <strong>{REPORT_TYPES.find(t => t.id === selectedType)?.label}</strong></p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSendEmail} disabled={!emailAddress || sending}>
              {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {sending ? 'Enviando...' : 'Enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preferences Dialog */}
      <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preferências de Relatório</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Formato Padrão</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {FORMATS.map(fmt => (
                  <button
                    key={fmt.id}
                    onClick={() => savePrefsMutation.mutate({ format: fmt.id })}
                    className={cn(
                      "p-2 rounded-lg text-xs font-medium transition-all border",
                      userPrefs?.format === fmt.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/30"
                    )}
                  >
                    {fmt.id}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" defaultChecked={userPrefs?.include_charts} onChange={e => savePrefsMutation.mutate({ include_charts: e.target.checked })} />
                Incluir gráficos
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" defaultChecked={userPrefs?.include_stats} onChange={e => savePrefsMutation.mutate({ include_stats: e.target.checked })} />
                Incluir estatísticas
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" defaultChecked={userPrefs?.include_summary} onChange={e => savePrefsMutation.mutate({ include_summary: e.target.checked })} />
                Incluir resumo
              </label>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}