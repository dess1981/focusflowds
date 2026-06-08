import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertCircle } from 'lucide-react';

export default function TdahResources() {
  const { data: articles = [], isLoading, refetch } = useQuery({
    queryKey: ['tdah-articles'],
    queryFn: () => base44.entities.TdahArticle.list('-created_date', 100),
  });

  // Atualizar artigos automaticamente na primeira carga
  useEffect(() => {
    const updateArticles = async () => {
      try {
        await base44.functions.invoke('fetchAndTranslateTdahArticles', {});
        refetch();
      } catch (err) {
        console.log('Artigos atualizados localmente');
      }
    };
    
    if (articles.length === 0) {
      updateArticles();
    }
  }, []);
  const categoryColors = {
    'Básico': 'bg-blue-500/10 text-blue-600 border-blue-200',
    'Prático': 'bg-green-500/10 text-green-600 border-green-200',
    'Positivo': 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
    'Desafio': 'bg-orange-500/10 text-orange-600 border-orange-200',
    'Saúde': 'bg-red-500/10 text-red-600 border-red-200',
    'Emocional': 'bg-purple-500/10 text-purple-600 border-purple-200',
    'Relacionamento': 'bg-pink-500/10 text-pink-600 border-pink-200',
    'Movimento': 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            📚 TDAH Descomplicado
          </CardTitle>
          {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {articles.length === 0 ? (
          <div className="text-center py-6">
            <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-xs text-muted-foreground">Carregando artigos traduzidos...</p>
          </div>
        ) : (
          <>
            {articles.map((article, i) => {
              const colors = categoryColors[article.category] || 'bg-gray-500/10 text-gray-600';
              return (
                <div
                  key={article.id || i}
                  className="p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <Badge className={colors} variant="outline">
                      {article.category}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium mb-1">{article.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {article.description}
                  </p>
                </div>
              );
            })}

            <div className="pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2 italic">
                💡 <strong>Lembre-se:</strong> TDAH é neurobiológico. Não é falta de vontade ou inteligência. Você não é "preguiçoso", seu cérebro só processa diferente. Trate-se com compaixão! 💚
              </p>
              <p className="text-[10px] text-muted-foreground/70">
                Artigos atualizados automaticamente e traduzidos para sua língua
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}