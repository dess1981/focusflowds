import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const COLORS = ['#a855f7', '#22d3ee', '#fb923c', '#10b981', '#ef4444', '#6366f1', '#ec4899', '#14b8a6'];

export default function MonthlyDashboard() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-monthly'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list(),
  });

  // Calculate stats for current month
  const monthStart = useMemo(() => startOfMonth(currentDate), [currentDate]);
  const monthEnd = useMemo(() => endOfMonth(currentDate), [currentDate]);
  const monthDays = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [monthStart, monthEnd]);

  const monthTasks = useMemo(() => {
    return tasks.filter(t => {
      const taskDate = new Date(t.due_date || t.completed_at || t.created_date);
      return taskDate >= monthStart && taskDate <= monthEnd;
    });
  }, [tasks, monthStart, monthEnd]);

  // Stats
  const stats = useMemo(() => {
    const completed = monthTasks.filter(t => t.status === 'done').length;
    const inProgress = monthTasks.filter(t => t.status === 'in_progress').length;
    const todo = monthTasks.filter(t => t.status === 'todo').length;
    const totalFocusSeconds = monthTasks.reduce((sum, t) => sum + (t.total_focus_seconds || 0), 0);
    const totalFocusHours = (totalFocusSeconds / 3600).toFixed(1);
    const completionRate = monthTasks.length > 0 ? ((completed / monthTasks.length) * 100).toFixed(1) : 0;

    return { completed, inProgress, todo, totalFocusHours, completionRate, total: monthTasks.length };
  }, [monthTasks]);

  // Category distribution
  const categoryDistribution = useMemo(() => {
    const map = {};
    monthTasks.forEach(task => {
      const catId = task.category_id;
      const cat = categories.find(c => c.id === catId);
      const name = cat?.name || 'Sem categoria';
      
      if (!map[name]) {
        map[name] = { name, tasks: 0, focus: 0, completed: 0 };
      }
      map[name].tasks += 1;
      map[name].focus += task.total_focus_seconds || 0;
      if (task.status === 'done') map[name].completed += 1;
    });

    return Object.values(map).sort((a, b) => b.focus - a.focus);
  }, [monthTasks, categories]);

  // Daily productivity trend
  const dailyTrend = useMemo(() => {
    return monthDays.map(day => {
      const dayTasks = monthTasks.filter(t => {
        const taskDate = new Date(t.due_date || t.completed_at || t.created_date);
        return taskDate.toDateString() === day.toDateString();
      });
      
      const completed = dayTasks.filter(t => t.status === 'done').length;
      const focus = dayTasks.reduce((sum, t) => sum + (t.total_focus_seconds || 0), 0) / 60;
      
      return {
        day: format(day, 'd', { locale: ptBR }),
        dayName: format(day, 'EEE', { locale: ptBR }).charAt(0).toUpperCase(),
        completed,
        focus: Math.round(focus),
        productivity: dayTasks.length > 0 ? Math.round((completed / dayTasks.length) * 100) : 0,
      };
    });
  }, [monthTasks, monthDays]);

  // Category focus distribution pie
  const categoryFocusPie = useMemo(() => {
    return categoryDistribution.map(cat => ({
      name: cat.name,
      value: Math.round(cat.focus / 3600 * 10) / 10, // hours
    })).filter(c => c.value > 0);
  }, [categoryDistribution]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthLabel = format(currentDate, 'MMMM yyyy', { locale: ptBR });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Produtividade Mensal</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Visualize seu desempenho e distribuição de tempo por categoria</p>
        </div>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between glass-card rounded-xl p-4">
        <button onClick={handlePrevMonth} className="p-2 hover:bg-primary/10 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold capitalize">{monthLabel}</h2>
        </div>
        <button onClick={handleNextMonth} className="p-2 hover:bg-primary/10 rounded-lg transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total de Tarefas</p>
          <p className="text-2xl font-bold text-primary">{stats.total}</p>
          <p className="text-[10px] text-muted-foreground mt-1">neste mês</p>
        </div>

        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Concluídas</p>
          <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{stats.completionRate}% de taxa</p>
        </div>

        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Horas de Foco</p>
          <p className="text-2xl font-bold text-accent">{stats.totalFocusHours}h</p>
          <p className="text-[10px] text-muted-foreground mt-1">tempo total</p>
        </div>

        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Em Progresso</p>
          <p className="text-2xl font-bold text-chart-2">{stats.inProgress}</p>
          <p className="text-[10px] text-muted-foreground mt-1">tarefas</p>
        </div>
      </motion.div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Productivity Trend */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-xl p-4"
        >
          <h3 className="font-semibold text-sm mb-3">📈 Tendência Diária de Conclusão</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="dayName" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ background: 'rgba(10,12,22,0.9)', border: '1px solid rgba(168,85,247,0.3)' }}
                formatter={(value, name) => {
                  if (name === 'completed') return [value, 'Concluídas'];
                  return value;
                }}
              />
              <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Tarefas Concluídas" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category Time Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-xl p-4"
        >
          <h3 className="font-semibold text-sm mb-3">⏱️ Tempo Investido por Categoria</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categoryFocusPie}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={entry => `${entry.name}: ${entry.value}h`}
                dataKey="value"
              >
                {categoryFocusPie.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}h`} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Category Detailed Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-4"
      >
        <h3 className="font-semibold text-sm mb-4">📊 Detalhes por Categoria</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2">Categoria</th>
                <th className="text-right p-2">Tarefas</th>
                <th className="text-right p-2">Concluídas</th>
                <th className="text-right p-2">Taxa</th>
                <th className="text-right p-2">Tempo (horas)</th>
              </tr>
            </thead>
            <tbody>
              {categoryDistribution.map((cat, idx) => {
                const rate = cat.tasks > 0 ? ((cat.completed / cat.tasks) * 100).toFixed(0) : 0;
                const hours = (cat.focus / 3600).toFixed(1);
                return (
                  <tr key={cat.name} className="border-b border-border/50 hover:bg-primary/5">
                    <td className="p-2 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      {cat.name}
                    </td>
                    <td className="text-right p-2">{cat.tasks}</td>
                    <td className="text-right p-2">{cat.completed}</td>
                    <td className="text-right p-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        rate >= 70 ? "bg-green-500/20 text-green-400" : rate >= 50 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"
                      )}>
                        {rate}%
                      </span>
                    </td>
                    <td className="text-right p-2 font-semibold">{hours}h</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Focus Distribution by Productivity */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-4"
      >
        <h3 className="font-semibold text-sm mb-3">🎯 Horas de Foco vs Produtividade Diária</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis type="number" dataKey="focus" name="Tempo de Foco (min)" tick={{ fontSize: 10 }} />
            <YAxis type="number" dataKey="productivity" name="Produtividade (%)" tick={{ fontSize: 10 }} />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ background: 'rgba(10,12,22,0.9)', border: '1px solid rgba(168,85,247,0.3)' }}
              formatter={(value, name) => {
                if (name === 'focus') return [`${value}min`, 'Foco'];
                if (name === 'productivity') return [`${value}%`, 'Produtividade'];
                return value;
              }}
            />
            <Scatter data={dailyTrend.filter(d => d.focus > 0)} fill="#a855f7" />
          </ScatterChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground mt-3">
          💡 Cada ponto representa um dia. Quanto mais à direita e para cima, melhor o equilíbrio entre tempo investido e produtividade.
        </p>
      </motion.div>
    </div>
  );
}