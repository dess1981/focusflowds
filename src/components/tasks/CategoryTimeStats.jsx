import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, TrendingUp } from 'lucide-react';

const categoryColors = {
  'Financeiro': '#F59E0B',
  'Estudo': '#8B5CF6',
  'Trabalho': '#3B82F6',
  'Pessoal': '#EC4899',
  'Saúde': '#10B981',
  'Social': '#06B6D4',
};

export default function CategoryTimeStats({ tasks }) {
  const stats = useMemo(() => {
    const categoryStats = {};
    let totalMinutes = 0;

    // Calcula tempo estimado por categoria
    tasks.forEach(task => {
      const category = task.category_id || 'Sem categoria';
      if (!categoryStats[category]) {
        categoryStats[category] = { minutes: 0, count: 0 };
      }
      
      if (task.estimated_minutes) {
        categoryStats[category].minutes += task.estimated_minutes;
        totalMinutes += task.estimated_minutes;
      }
      categoryStats[category].count += 1;
    });

    // Calcula percentuais
    const sorted = Object.entries(categoryStats)
      .map(([category, data]) => ({
        category,
        ...data,
        percentage: totalMinutes > 0 ? Math.round((data.minutes / totalMinutes) * 100) : 0,
      }))
      .sort((a, b) => b.minutes - a.minutes);

    return { stats: sorted, totalMinutes };
  }, [tasks]);

  if (stats.totalMinutes === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm">Distribuição de Tempo por Categoria</h3>
        </div>

        <div className="space-y-4">
          {/* Barra visual horizontal */}
          {stats.stats.length > 0 && (
            <div className="flex h-8 rounded-lg overflow-hidden gap-0.5 bg-muted/30">
              {stats.stats.map(({ category, percentage, minutes }) => (
                percentage > 0 && (
                  <div
                    key={category}
                    className="flex items-center justify-center text-xs font-semibold text-white transition-all hover:opacity-80"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: categoryColors[category] || '#6B7280',
                      minWidth: percentage > 5 ? 'auto' : '0',
                    }}
                    title={`${category}: ${minutes}m (${percentage}%)`}
                  >
                    {percentage > 8 && <span>{percentage}%</span>}
                  </div>
                )
              ))}
            </div>
          )}

          {/* Cards de categoria */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stats.stats.map(({ category, minutes, count, percentage }) => {
              const hours = Math.floor(minutes / 60);
              const mins = minutes % 60;
              return (
                <div
                  key={category}
                  className="flex flex-col gap-2 p-3 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: categoryColors[category] || '#6B7280' }}
                    />
                    <p className="text-xs font-medium truncate flex-1">{category}</p>
                    <span className="text-xs font-semibold text-primary">{percentage}%</span>
                  </div>
                  <div className="flex items-baseline gap-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}
                    </span>
                    <span>· {count} {count === 1 ? 'tarefa' : 'tarefas'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="text-center pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Total estimado: <span className="font-semibold text-foreground">
                {Math.floor(stats.totalMinutes / 60)}h {stats.totalMinutes % 60}m
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}