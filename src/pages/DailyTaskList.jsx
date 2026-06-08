import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, X, Play, CheckCircle2, Clock, AlertCircle, 
  Search, Eye, EyeOff, ChevronRight, Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusTimer } from '@/context/FocusTimerContext';
import HealthHub from '@/components/health/HealthHub';

const priorityConfig = {
  urgent: { label: '🔴 Urgente', color: '#ef4444', sortOrder: 0 },
  high: { label: '🟠 Alta', color: '#f97316', sortOrder: 1 },
  medium: { label: '🔵 Média', color: '#3b82f6', sortOrder: 2 },
  low: { label: '⚪ Baixa', color: '#6b7280', sortOrder: 3 },
};

export default function DailyTaskList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriorities, setSelectedPriorities] = useState(['urgent', 'high', 'medium', 'low']);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [hideCompleted, setHideCompleted] = useState(true);
  const { startFocus } = useFocusTimer();
  const today = new Date().toISOString().split('T')[0];

  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks-daily-list'],
    queryFn: () => base44.entities.Task.list('-created_date', 200),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list(),
  });

  // Filter tasks for today and not completed
  const todayTasks = useMemo(() => {
    return tasks.filter(t => {
      const taskDate = t.due_date || new Date().toISOString().split('T')[0];
      const isToday = taskDate === today;
      const isNotDone = hideCompleted ? t.status !== 'done' : true;
      return isToday && isNotDone;
    });
  }, [tasks, today, hideCompleted]);

  // Apply filters
  const filteredTasks = useMemo(() => {
    return todayTasks.filter(task => {
      const matchesPriority = selectedPriorities.includes(task.priority);
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(task.category_id);
      const matchesSearch = !searchTerm || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesPriority && matchesCategory && matchesSearch;
    }).sort((a, b) => priorityConfig[a.priority]?.sortOrder - priorityConfig[b.priority]?.sortOrder);
  }, [todayTasks, selectedPriorities, selectedCategories, searchTerm]);

  const stats = useMemo(() => {
    const done = todayTasks.filter(t => t.status === 'done').length;
    const inProgress = todayTasks.filter(t => t.status === 'in_progress').length;
    const todo = todayTasks.filter(t => t.status === 'todo').length;
    const urgentCount = todayTasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;
    
    return { done, inProgress, todo, total: todayTasks.length, urgentCount };
  }, [todayTasks]);

  const togglePriority = (priority) => {
    setSelectedPriorities(prev =>
      prev.includes(priority)
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    );
  };

  const toggleCategory = (catId) => {
    setSelectedCategories(prev =>
      prev.includes(catId)
        ? prev.filter(c => c !== catId)
        : [...prev, catId]
    );
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedPriorities(['urgent', 'high', 'medium', 'low']);
    setSelectedCategories([]);
  };

  const getCategoryName = (catId) => categories.find(c => c.id === catId)?.name || 'Sem categoria';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Tarefas de Hoje</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(new Date(), 'EEEE, d MMMM', { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {stats.urgentCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="w-3 h-3" />
              {stats.urgentCount} urgente{stats.urgentCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <div className="glass-card rounded-xl p-3">
          <p className="text-xs text-muted-foreground mb-1">Total</p>
          <p className="text-xl font-bold">{stats.total}</p>
        </div>
        <div className="glass-card rounded-xl p-3">
          <p className="text-xs text-muted-foreground mb-1">A Fazer</p>
          <p className="text-xl font-bold text-blue-400">{stats.todo}</p>
        </div>
        <div className="glass-card rounded-xl p-3">
          <p className="text-xs text-muted-foreground mb-1">Em Progresso</p>
          <p className="text-xl font-bold text-yellow-400">{stats.inProgress}</p>
        </div>
        <div className="glass-card rounded-xl p-3">
          <p className="text-xs text-muted-foreground mb-1">Concluídas</p>
          <p className="text-xl font-bold text-green-400">{stats.done}</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar tarefas..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        {/* Priority filter */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Prioridade</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(priorityConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => togglePriority(key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
                  selectedPriorities.includes(key)
                    ? "border-current text-white"
                    : "border-border bg-muted/30 text-muted-foreground hover:border-current/50"
                )}
                style={selectedPriorities.includes(key) ? {
                  background: `${config.color}20`,
                  borderColor: config.color,
                  color: config.color,
                } : {}}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Categorias</p>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
                    selectedCategories.includes(cat.id)
                      ? "border-current text-white"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50"
                  )}
                  style={selectedCategories.includes(cat.id) ? {
                    background: `${cat.color}20`,
                    borderColor: cat.color,
                    color: cat.color,
                  } : {}}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => setHideCompleted(!hideCompleted)}
            className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg hover:bg-muted/30 transition-colors"
          >
            {hideCompleted ? (
              <><Eye className="w-3 h-3" /> Mostrar Concluídas</>
            ) : (
              <><EyeOff className="w-3 h-3" /> Ocultar Concluídas</>
            )}
          </button>
          {(searchTerm || selectedCategories.length > 0 || selectedPriorities.length < 4) && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <X className="w-3 h-3" /> Limpar
            </button>
          )}
        </div>
      </motion.div>

      {/* Health Hub */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <HealthHub />
      </motion.div>

      {/* Task list */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        {tasksLoading ? (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">Nenhuma tarefa encontrada</p>
            <p className="text-xs text-muted-foreground/60">Parabéns! 🎉 Você completou tudo ou não há tarefas com esses filtros.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task, idx) => {
              const categoryName = getCategoryName(task.category_id);
              const priority = priorityConfig[task.priority];
              
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => {}}
                  className="group glass-card rounded-xl p-4 hover:bg-primary/5 transition-all duration-200 border border-border/50"
                >
                  <div className="flex items-start gap-4">
                    {/* Status indicator */}
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: priority?.color }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className={cn(
                            "font-semibold truncate",
                            task.status === 'done' && "line-through text-muted-foreground"
                          )}>
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Meta info */}
                      <div className="flex flex-wrap items-center gap-2 mt-2.5">
                        <Badge variant="outline" className="text-[10px]">
                          {priority?.label}
                        </Badge>

                        {task.category_id && (
                          <Badge variant="outline" className="text-[10px]">
                            {categoryName}
                          </Badge>
                        )}

                        {task.time_block_start && task.time_block_end && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {task.time_block_start} – {task.time_block_end}
                          </span>
                        )}

                        {task.estimated_minutes && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            ~{task.estimated_minutes}min
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {task.status !== 'done' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startFocus(task, () => refetchTasks());
                          }}
                          className="p-2 hover:bg-primary/20 rounded-lg transition-colors"
                          title="Iniciar foco"
                        >
                          <Play className="w-4 h-4 text-primary" />
                        </button>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}