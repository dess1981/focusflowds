import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

const FALLBACK_COLORS = ['#a855f7','#22d3ee','#f59e0b','#ec4899','#10b981','#3b82f6','#f97316'];

export default function CategoryTimeStats({ tasks }) {
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list(),
  });

  const getCategoryName = (id) => {
    if (!id) return 'Sem categoria';
    const cat = categories.find(c => c.id === id);
    return cat ? cat.name : 'Sem categoria';
  };

  const getCategoryColor = (id) => {
    const cat = categories.find(c => c.id === id);
    return cat?.color || '#6B7280';
  };

  const stats = useMemo(() => {
    const categoryStats = {};
    let totalMinutes = 0;

    tasks.forEach(task => {
      const category = task.category_id || '__none__';
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
      .map(([categoryId, data]) => ({
        categoryId,
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
              {stats.stats.map(({ categoryId, percentage, minutes }, i) => (
                percentage > 0 && (
                  <div
                    key={categoryId}
                    className="flex items-center justify-center text-xs font-semibold text-white transition-all hover:opacity-80"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: getCategoryColor(categoryId !== '__none__' ? categoryId : null),
                      minWidth: percentage > 5 ? 'auto' : '0',
                    }}
                    title={`${getCategoryName(categoryId !== '__none__' ? categoryId : null)}: ${minutes}m (${percentage}%)`}
                  >
                    {percentage > 8 && <span>{percentage}%</span>}
                  </div>
                )
              ))}
            </div>
          )}

          {/* Cards de categoria */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stats.stats.map(({ categoryId, minutes, count, percentage }) => {
              const hours = Math.floor(minutes / 60);
              const mins = minutes % 60;
              const name = getCategoryName(categoryId !== '__none__' ? categoryId : null);
              const color = getCategoryColor(categoryId !== '__none__' ? categoryId : null);
              return (
                <div
                  key={categoryId}
                  className="flex flex-col gap-2 p-3 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <p className="text-xs font-medium truncate flex-1">{name}</p>
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