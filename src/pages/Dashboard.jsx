import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, startOfWeek, endOfWeek, isToday, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CheckCircle2, Clock, AlertTriangle, TrendingUp, 
  Flame, Target, ListTodo, CalendarDays
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import PriorityBadge from '@/components/tasks/PriorityBadge';
import CategoryGoalBar from '@/components/categories/CategoryGoalBar';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const COLORS = ['#4F6BED', '#2ECC94', '#F4A940', '#FF6B6B', '#9B59B6'];

function StatCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
              <p className="text-3xl font-heading font-bold mt-1">{value}</p>
              {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            <div className={`p-2.5 rounded-xl ${color}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Dashboard() {
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list(),
  });

  const { data: timeBlocks = [] } = useQuery({
    queryKey: ['timeblocks'],
    queryFn: () => base44.entities.TimeBlock.list('-created_date', 500),
  });

  const today = format(new Date(), 'yyyy-MM-dd');

  const categoryHours = useMemo(() => {
    const hours = {};
    categories.forEach(cat => { hours[cat.id] = 0; });

    timeBlocks.filter(b => b.date === today).forEach(block => {
      const category = categories.find(c => 
        tasks.some(t => t.id === block.task_id && t.category_id === c.id)
      );

      if (category && block.start_time && block.end_time) {
        const [sh, sm] = block.start_time.split(':').map(Number);
        const [eh, em] = block.end_time.split(':').map(Number);
        const minutes = (eh * 60 + em) - (sh * 60 + sm);
        hours[category.id] = (hours[category.id] || 0) + minutes / 60;
      }
    });

    return hours;
  }, [timeBlocks, categories, tasks, today]);

  const stats = useMemo(() => {
    const todayTasks = tasks.filter(t => t.due_date === today);
    const completed = tasks.filter(t => t.status === 'done');
    const overdue = tasks.filter(t => t.due_date && t.due_date < today && t.status !== 'done' && t.status !== 'cancelled');
    const urgent = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done');
    const todayCompleted = todayTasks.filter(t => t.status === 'done').length;
    
    // Streak calculation (simple: consecutive days with completed tasks)
    let streak = 0;
    const completedDates = new Set(completed.filter(t => t.completed_at).map(t => format(new Date(t.completed_at), 'yyyy-MM-dd')));
    let checkDate = new Date();
    while (completedDates.has(format(checkDate, 'yyyy-MM-dd'))) {
      streak++;
      checkDate = new Date(checkDate.getTime() - 86400000);
    }

    return {
      total: tasks.filter(t => t.status !== 'cancelled').length,
      todayTotal: todayTasks.length,
      todayCompleted,
      completed: completed.length,
      overdue: overdue.length,
      urgent: urgent.length,
      streak,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
    };
  }, [tasks, today]);

  const weekData = useMemo(() => {
    const days = [];
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart.getTime() + i * 86400000);
      const ds = format(d, 'yyyy-MM-dd');
      const dayTasks = tasks.filter(t => t.due_date === ds);
      days.push({
        day: format(d, 'EEE', { locale: ptBR }),
        total: dayTasks.length,
        done: dayTasks.filter(t => t.status === 'done').length,
      });
    }
    return days;
  }, [tasks]);

  const priorityData = useMemo(() => {
    const active = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');
    return [
      { name: 'Urgente', value: active.filter(t => t.priority === 'urgent').length },
      { name: 'Alta', value: active.filter(t => t.priority === 'high').length },
      { name: 'Média', value: active.filter(t => t.priority === 'medium').length },
      { name: 'Baixa', value: active.filter(t => t.priority === 'low').length },
    ].filter(d => d.value > 0);
  }, [tasks]);

  const upcomingTasks = useMemo(() =>
    tasks
      .filter(t => t.due_date && t.due_date >= today && t.status !== 'done' && t.status !== 'cancelled')
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 5),
    [tasks, today]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Visão geral das suas tarefas e produtividade</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Hoje" value={`${stats.todayCompleted}/${stats.todayTotal}`} subtitle="tarefas concluídas" icon={CalendarDays} color="bg-primary" />
        <StatCard title="Em Progresso" value={stats.inProgress} subtitle="tarefas ativas" icon={Clock} color="bg-amber-500" />
        <StatCard title="Atrasadas" value={stats.overdue} subtitle="precisam de atenção" icon={AlertTriangle} color="bg-red-500" />
        <StatCard title="Sequência" value={`${stats.streak}🔥`} subtitle="dias consecutivos" icon={Flame} color="bg-green-500" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Tarefas da Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weekData}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" name="Total" fill="hsl(var(--primary) / 0.2)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="done" name="Concluídas" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Por Prioridade</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={priorityData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {priorityData.map((_, idx) => (
                      <Cell key={idx} fill={['#FF6B6B', '#F4A940', '#4F6BED', '#94A3B8'][idx]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Sem tarefas pendentes</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Goals */}
      {categories.some(c => c.daily_goal_hours > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Metas Diárias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categories
                .filter(c => c.daily_goal_hours > 0)
                .map(cat => (
                  <div key={cat.id} className="space-y-2">
                    <p className="text-sm font-medium">{cat.name}</p>
                    <CategoryGoalBar 
                      category={cat} 
                      currentHours={categoryHours[cat.id] || 0}
                      showLabel={false}
                    />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming Tasks */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Próximas Tarefas</CardTitle>
              <Link to="/tasks" className="text-xs text-primary hover:underline">Ver todas</Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <PriorityBadge priority={task.priority} />
                    <span className="text-sm truncate">{task.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {isToday(parseISO(task.due_date)) ? 'Hoje' : format(parseISO(task.due_date), 'dd/MM')}
                  </span>
                </div>
              ))}
              {upcomingTasks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa futura</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Projetos</CardTitle>
              <Link to="/projects" className="text-xs text-primary hover:underline">Ver todos</Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projects.filter(p => p.status === 'active').slice(0, 5).map(project => {
                const projectTasks = tasks.filter(t => t.project_id === project.id);
                const done = projectTasks.filter(t => t.status === 'done').length;
                const total = projectTasks.length;
                const pct = total ? Math.round((done / total) * 100) : 0;

                return (
                  <div key={project.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                        <span className="text-sm font-medium">{project.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{done}/{total}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: project.color }} />
                    </div>
                  </div>
                );
              })}
              {projects.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum projeto criado</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}