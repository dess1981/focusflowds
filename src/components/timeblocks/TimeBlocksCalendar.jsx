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

  // Agrupa blocos por data
  const blocksByDate = blocks.reduce((acc, block) => {
    if (block.date) {
      if (!acc[block.date]) acc[block.date] = [];
      acc[block.date].push(block);
    }
    return acc;
  }, {});

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
            const dayBlocks = blocksByDate[dateStr] || [];
            const isCurrentDay = isToday(day);

            return (
              <button
                key={dateStr}
                onClick={() => onDateClick(day)}
                className={`aspect-square p-1.5 rounded-lg border transition-all flex flex-col items-center justify-start text-center ${
                  isCurrentDay
                    ? 'border-primary/50 bg-primary/10'
                    : !isSameMonth(day, selectedDate)
                    ? 'opacity-30 cursor-default'
                    : 'border-border hover:border-primary/30 hover:bg-muted/50'
                }`}
              >
                <span className="text-xs font-medium">{format(day, 'd')}</span>
                {dayBlocks.length > 0 && (
                  <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                    {dayBlocks.slice(0, 3).map((block, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: typeConfig[block.type]?.hex || '#6B7280' }}
                        title={block.title}
                      />
                    ))}
                    {dayBlocks.length > 3 && (
                      <span className="text-[8px] text-muted-foreground">+{dayBlocks.length - 3}</span>
                    )}
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