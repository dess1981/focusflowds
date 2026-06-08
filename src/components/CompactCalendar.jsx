import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, subDays, format, isToday, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CompactCalendar({ selectedDate, onDateSelect }) {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const firstDayOfWeek = monthStart.getDay();
  const emptyDays = Array(firstDayOfWeek).fill(null);
  const allDays = [...emptyDays, ...daysInMonth];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(168,85,247,0.2)',
      }}
    >
      {/* Month header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onDateSelect(subDays(selectedDate, 1))}
          className="p-1.5 rounded-lg transition-all"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-white">
          {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
        </span>
        <button
          onClick={() => onDateSelect(addDays(selectedDate, 1))}
          className="p-1.5 rounded-lg transition-all"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div
            key={day}
            className="text-center text-xs font-semibold"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {allDays.map((day, idx) => {
          const isSelected = day && format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
          const isCurrent = day && isToday(day);

          return (
            <button
              key={idx}
              onClick={() => day && onDateSelect(day)}
              disabled={!day}
              className="aspect-square rounded-lg text-xs font-medium transition-all disabled:opacity-30"
              style={
                isSelected ? {
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.4), rgba(34,211,238,0.2))',
                  color: '#a855f7',
                  border: '1px solid rgba(168,85,247,0.5)',
                } : isCurrent ? {
                  background: 'rgba(34,211,238,0.2)',
                  color: '#22d3ee',
                  border: '1px solid rgba(34,211,238,0.3)',
                } : {
                  background: 'rgba(255,255,255,0.03)',
                  color: 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }
              }
            >
              {day && format(day, 'd')}
            </button>
          );
        })}
      </div>

      {/* Today button */}
      <button
        onClick={() => onDateSelect(new Date())}
        className="w-full mt-3 py-2 rounded-lg text-xs font-medium transition-all"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.7)',
        }}
      >
        Hoje
      </button>
    </div>
  );
}