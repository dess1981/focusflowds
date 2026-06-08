import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, CheckCircle2, Lightbulb } from 'lucide-react';

export default function WeeklySummaryModal({ open, onOpenChange }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const generateSummary = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('generateWeeklySummary', {});
      setSummary(res.data);
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProductivityColor = (level) => {
    const colors = {
      muito_baixa: 'text-red-500',
      baixa: 'text-orange-500',
      media: 'text-yellow-500',
      alta: 'text-green-500',
      muito_alta: 'text-emerald-500',
    };
    return colors[level] || 'text-muted-foreground';
  };

  const getProductivityLabel = (level) => {
    const labels = {
      muito_baixa: 'Muito Baixa',
      baixa: 'Baixa',
      media: 'Média',
      alta: 'Alta',
      muito_alta: 'Muito Alta',
    };
    return labels[level] || 'Desconhecida';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Resumo da Semana
          </DialogTitle>
        </DialogHeader>

        {!summary ? (
          <div className="py-8 text-center">
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <p className="text-muted-foreground">Analisando sua semana...</p>
              </div>
            ) : (
              <Button onClick={generateSummary} size="lg">
                Gerar Resumo Semanal
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Tarefas Concluídas</p>
                <p className="text-2xl font-bold">{summary.stats.tasksCompleted}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Média/Dia</p>
                <p className="text-2xl font-bold">{summary.stats.avgPerDay}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Entradas Diário</p>
                <p className="text-2xl font-bold">{summary.stats.diaryEntries}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Produtividade</p>
                <p className={`text-lg font-bold ${getProductivityColor(summary.summary.productivityLevel)}`}>
                  {getProductivityLabel(summary.summary.productivityLevel)}
                </p>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Resumo
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {summary.summary.executiveSummary}
              </p>
            </div>

            {/* Patterns */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                Padrões Identificados
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {summary.summary.patterns}
              </p>
            </div>

            {/* Suggestions */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                Sugestões para Próxima Semana
              </h3>
              <ul className="space-y-2">
                {summary.summary.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex gap-3 text-sm">
                    <span className="text-primary font-bold flex-shrink-0">{idx + 1}.</span>
                    <span className="text-foreground/80">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Priority Breakdown */}
            <div className="space-y-2 p-3 rounded-lg bg-muted/50">
              <h4 className="font-semibold text-xs text-muted-foreground">Distribuição por Prioridade</h4>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Urgentes</p>
                  <p className="text-lg font-bold text-red-500">{summary.stats.priorityStats.urgent}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Altas</p>
                  <p className="text-lg font-bold text-orange-500">{summary.stats.priorityStats.high}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Médias</p>
                  <p className="text-lg font-bold text-yellow-500">{summary.stats.priorityStats.medium}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Baixas</p>
                  <p className="text-lg font-bold text-green-500">{summary.stats.priorityStats.low}</p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => {
                setSummary(null);
                onOpenChange(false);
              }}
              className="w-full"
              variant="outline"
            >
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}