import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const typeConfig = {
  task: { hex: '#3B82F6' },
  break: { hex: '#10B981' },
  focus: { hex: '#A855F7' },
  meeting: { hex: '#F59E0B' },
  personal: { hex: '#F43F5E' },
  sleep: { hex: '#6366F1' },
};

export default function TimeBlocksCalendar({ blocks, selectedDate, onDateClick, onPrevMonth, onNextMonth }) {
  const start = startOfMonth(selectedDate);
  const end = endOfMonth(selectedDate);
  const days = eachDayOfInterval({ start, end });

  // Agrupa blocos por data e calcula estatísticas
  const blocksByDate = blocks.reduce((acc, block) => {
    if (block.date) {
      if (!acc[block.date]) acc[block.date] = [];
      acc[block.date].push(block);
    }
    return acc;
  }, {});

  // Calcula distribuição percentual por dia
  const dayStats = (dateStr) => {
    const dayBlocks = blocksByDate[dateStr] || [];
    const stats = {};
    let totalMinutes = 0;

    dayBlocks.forEach(block => {
      const type = block.type || 'task';
      if (!stats[type]) stats[type] = 0;
      
      if (block.start_time && block.end_time) {
        const [sh, sm] = block.start_time.split(':').map(Number);
        const [eh, em] = block.end_time.split(':').map(Number);
        const minutes = (eh * 60 + em) - (sh * 60 + sm);
        stats[type] += minutes;
        totalMinutes += minutes;
      }
    });

    const percentages = {};
    Object.keys(stats).forEach(type => {
      percentages[type] = totalMinutes > 0 ? Math.round((stats[type] / totalMinutes) * 100) : 0;
    });

    return { stats, totalMinutes, percentages };
  };

  // Começa com domingo
  const firstDayOfWeek = days[0].getDay();
  const emptyDays = Array(firstDayOfWeek).fill(null);
  const calendarDays = [...emptyDays, ...days];

  return (
    <div className="space-y-4">
      {/* Header com navegação */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={onPrevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendário */}
      <Card className="p-4">
        {/* Dias da semana */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Dias do calendário */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }

            const dateStr = format(day, 'yyyy-MM-dd');
            const stats = dayStats(dateStr);
            const isCurrentDay = isToday(day);
            const hasBlocks = stats.totalMinutes > 0;

            return (
              <button
                key={dateStr}
                onClick={() => onDateClick(day)}
                className={`aspect-square p-1.5 rounded-lg border transition-all flex flex-col justify-between ${
                  isCurrentDay
                    ? 'border-primary/50 bg-primary/10'
                    : !isSameMonth(day, selectedDate)
                    ? 'opacity-30 cursor-default'
                    : 'border-border hover:border-primary/30 hover:bg-muted/50'
                }`}
              >
                <span className="text-xs font-medium text-start">{format(day, 'd')}</span>
                
                {hasBlocks ? (
                  <div className="space-y-1 w-full">
                    <div className="flex h-1.5 rounded-full overflow-hidden gap-0 bg-muted/30 w-full">
                      {Object.entries(stats.percentages)
                        .sort((a, b) => b[1] - a[1])
                        .map(([type, percentage]) => 
                          percentage > 0 ? (
                            <div
                              key={type}
                              className="transition-all"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: typeConfig[type]?.hex || '#6B7280',
                              }}
                              title={`${type}: ${percentage}%`}
                            />
                          ) : null
                        )}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {Math.floor(stats.totalMinutes / 60)}h {stats.totalMinutes % 60}m
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1 w-full">
                    <div className="h-1.5 rounded-full bg-muted/20 w-full" />
                    <span className="text-[10px] text-muted-foreground">0h</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}