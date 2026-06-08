import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function OverloadWarning() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkOverload();
    const interval = setInterval(checkOverload, 120000); // Check every 2 minutes
    return () => clearInterval(interval);
  }, []);

  const checkOverload = async () => {
    try {
      setError(null);
      const res = await base44.functions.invoke('detectOverload', {});
      if (res?.data) {
        setAnalysis(res.data);
      }
    } catch (error) {
      console.error('Error detecting overload:', error);
      setError(error.message);
      // Set a neutral analysis state to avoid breaking the component
      setAnalysis({ status: 'balanced', suggestions: [], overloadedDays: [], avgCompletion: 0 });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!analysis || error || analysis.status === 'balanced') {
    return null;
  }

  const isBusy = analysis.status === 'busy';
  const isOverloaded = analysis.status === 'overloaded';

  return (
    <Card className={cn(
      "border-l-4 m-4 mt-0",
      isOverloaded ? "border-destructive bg-destructive/5" : "border-warning bg-warning/5"
    )}>
      <div className="p-4">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className={cn(
              "w-5 h-5 flex-shrink-0",
              isOverloaded ? "text-destructive" : "text-warning"
            )} />
            <div className="text-left">
              <h3 className={cn(
                "font-semibold text-sm",
                isOverloaded ? "text-destructive" : "text-warning"
              )}>
                {isOverloaded ? '⚠️ Você está sobrecarregado!' : '📊 Atenção: Semana com carga alta'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {analysis.overloadedDays.length} dia(s) com excesso de tarefas
              </p>
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {/* Expanded Content */}
        {expanded && (
          <div className="mt-4 space-y-3 border-t border-border/50 pt-4">
            {/* Overloaded Days */}
            {analysis.overloadedDays && analysis.overloadedDays.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Dias com sobrecarga:</p>
                <div className="space-y-1.5">
                  {analysis.overloadedDays.map(day => (
                    <div key={day.date} className="flex items-center justify-between text-sm p-2 rounded bg-destructive/10">
                      <span>{format(new Date(day.date + 'T00:00:00'), 'EEEE, d MMM', { locale: ptBR })}</span>
                      <span className="font-semibold">{day.count} tarefas</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {analysis.suggestions && analysis.suggestions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">💡 Sugestões:</p>
                <div className="space-y-2">
                  {analysis.suggestions.map((suggestion, idx) => (
                    <div key={idx} className="p-2.5 rounded bg-muted/40 border border-primary/20 text-xs">
                      <p className="mb-1.5">{suggestion.reason}</p>
                      <div className="space-y-1">
                        {suggestion.tasksToMove && suggestion.tasksToMove.map(task => (
                          <div key={task.id} className="flex items-center gap-2 text-foreground/80">
                            <span className="text-xs opacity-60">→</span>
                            <span className="truncate">{task.title}</span>
                            <span className="text-xs opacity-50 flex-shrink-0">({task.priority})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            <Button
              onClick={() => {
                window.location.href = '/tasks';
              }}
              className="w-full text-xs"
              variant="outline"
            >
              Revisar Tarefas
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}