import React, { useMemo, useState } from 'react';
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isBefore, isAfter, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const typeConfig = {
  task: { label: 'Tarefa', color: '#3B82F6' },
  break: { label: 'Pausa', color: '#10B981' },
  focus: { label: 'Foco', color: '#A855F7' },
  meeting: { label: 'Reunião', color: '#F59E0B' },
  personal: { label: 'Pessoal', color: '#F43F5E' },
  sleep: { label: 'Sono', color: '#6366F1' },
};

function getDuration(start, end) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

export default function TimeBlocksAnalytics({ blocks, selectedDate }) {
  const [period, setPeriod] = React.useState('week');
  const [customStart, setCustomStart] = React.useState('');
  const [customEnd, setCustomEnd] = React.useState('');

  const dateRange = useMemo(() => {
    let start, end;
    
    if (period === 'day') {
      start = startOfDay(selectedDate);
      end = endOfDay(selectedDate);
    } else if (period === 'week') {
      start = startOfWeek(selectedDate, { weekStartsOn: 0 });
      end = endOfWeek(selectedDate, { weekStartsOn: 0 });
    } else if (period === 'month') {
      start = startOfMonth(selectedDate);
      end = endOfMonth(selectedDate);
    } else if (period === 'custom' && customStart && customEnd) {
      start = parseISO(customStart);
      end = parseISO(customEnd);
    } else {
      return null;
    }

    return { start, end };
  }, [period, selectedDate, customStart, customEnd]);

  const periodBlocks = useMemo(() => {
    if (!dateRange) return [];
    
    return blocks.filter(b => {
      if (!b.date) return false;
      const blockDate = parseISO(b.date);
      return !isBefore(blockDate, dateRange.start) && !isAfter(blockDate, dateRange.end);
    });
  }, [blocks, dateRange]);

  const stats = useMemo(() => {
    const data = {};
    let totalMinutes = 0;

    periodBlocks.forEach(block => {
      const type = block.type || 'task';
      if (!data[type]) data[type] = 0;
      
      const minutes = getDuration(block.start_time, block.end_time);
      data[type] += minutes;
      totalMinutes += minutes;
    });

    const chartData = Object.entries(data)
      .map(([type, minutes]) => ({
        name: typeConfig[type]?.label || type,
        value: Math.round((minutes / 60) * 10) / 10, // horas com 1 decimal
        minutes,
        color: typeConfig[type]?.color || '#6B7280',
      }))
      .sort((a, b) => b.minutes - a.minutes);

    return { chartData, totalMinutes };
  }, [periodBlocks]);

  if (!dateRange) {
    return <div className="text-center py-4 text-muted-foreground">Selecione um período válido</div>;
  }

  const hours = Math.floor(stats.totalMinutes / 60);
  const mins = stats.totalMinutes % 60;

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <Label className="text-xs">Período</Label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Hoje</SelectItem>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="custom">Customizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {period === 'custom' && (
          <>
            <div>
              <Label className="text-xs">De</Label>
              <Input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Até</Label>
              <Input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="mt-1"
              />
            </div>
          </>
        )}
      </div>

      {/* Resumo */}
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{stats.chartData.length}</p>
              <p className="text-xs text-muted-foreground">Tipos de blocos</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{periodBlocks.length}</p>
              <p className="text-xs text-muted-foreground">Blocos total</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{hours}h {mins}m</p>
              <p className="text-xs text-muted-foreground">Tempo acumulado</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {stats.chartData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Pizza */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-4">Distribuição por Tipo</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `${value.toFixed(1)}h`}
                    contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tabela detalhada */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-4">Detalhes</h3>
              <div className="space-y-2">
                {stats.chartData.map(({ name, value, color, minutes }) => {
                  const mins = Math.round(minutes % 60);
                  const hrs = Math.floor(minutes / 60);
                  return (
                    <div key={name} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-sm">{name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{hrs}h {mins}m</p>
                        <p className="text-xs text-muted-foreground">{value.toFixed(1)}h</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum bloco de tempo neste período
        </div>
      )}
    </div>
  );
}