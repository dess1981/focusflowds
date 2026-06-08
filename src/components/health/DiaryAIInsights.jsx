import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function DiaryAIInsights() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('generateDiaryInsights', {});
      setInsights(response.data.insights);
      toast.success('Insights gerados com sucesso!');
    } catch (err) {
      setError('Erro ao gerar insights. Tente novamente.');
      toast.error('Erro ao gerar insights');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Insights & Sugestões de IA
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!insights ? (
          <Button
            onClick={generateInsights}
            disabled={loading}
            className="w-full"
            variant="outline"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analisando seu histórico...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Análise e Recomendações
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            {insights.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum insight disponível no momento. Tente novamente depois de alguns dias de registros.
              </p>
            ) : (
              insights.map((insight, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-muted/30 border border-primary/20 space-y-2">
                  <h4 className="font-semibold text-sm text-primary">{insight.title}</h4>

                  {insight.observation && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">📊 Observação:</p>
                      <p className="text-sm">{insight.observation}</p>
                    </div>
                  )}

                  {insight.suggestion && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">💡 Sugestão:</p>
                      <p className="text-sm">{insight.suggestion}</p>
                    </div>
                  )}

                  {insight.action && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">⚡ Quick Win:</p>
                      <p className="text-sm">{insight.action}</p>
                    </div>
                  )}
                </div>
              ))
            )}

            <Button
              onClick={generateInsights}
              disabled={loading}
              variant="outline"
              size="sm"
              className="w-full mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                  Regenerando...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 mr-1.5" />
                  Regenerar Insights
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}