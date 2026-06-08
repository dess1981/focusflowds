import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';

const TDAH_RESOURCES = [
  {
    title: 'O que é TDAH? Entenda o básico',
    description: 'TDAH é um transtorno neurobiológico que afeta atenção, impulso e hiperatividade. Não é preguiça, é cérebro funcionando diferente! 🧠',
    category: 'Básico',
  },
  {
    title: 'Técnicas de Organização para TDAH',
    description: 'Dicas práticas: use timers, quebra tarefas em passos pequenos, crie rotinas visuais. A repetição é sua amiga!',
    category: 'Prático',
  },
  {
    title: 'Hiperfoco - seu superpoder',
    description: 'TDAH traz hiperfoco: capacidade de concentração extrema em coisas que gostamos. Use isso a seu favor!',
    category: 'Positivo',
  },
  {
    title: 'Lidar com a Procrastinação',
    description: 'TDAH = dificuldade com autorregulação temporal. Solução: comece agora, mesmo que por 5min. O "activation energy" é o desafio.',
    category: 'Desafio',
  },
  {
    title: 'Sono e TDAH - conexão importante',
    description: 'Sono ruim piora os sintomas de TDAH. Mantenha rotina de sono, evite telas 1h antes de dormir.',
    category: 'Saúde',
  },
  {
    title: 'Rejeição Sensível à Crítica',
    description: 'Pessoas com TDAH sofrem mais com críticas. Isso é real! Seja gentil consigo mesmo e com outras pessoas TDAH.',
    category: 'Emocional',
  },
  {
    title: 'Como pedir ajuda efetivamente',
    description: 'Ser específico ajuda: "me lemba às 14h?" funciona melhor que "me lembra depois".',
    category: 'Relacionamento',
  },
  {
    title: 'Exercício físico - medicamento natural',
    description: 'Atividade física melhora muito os sintomas. Mesmo 10min de movimento já ajuda! Escolha algo que goste.',
    category: 'Movimento',
  },
];

export default function TdahResources() {
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
        <CardTitle className="flex items-center gap-2 text-base">
          📚 TDAH Descomplicado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {TDAH_RESOURCES.map((resource, i) => {
          const colors = categoryColors[resource.category] || 'bg-gray-500/10 text-gray-600';
          return (
            <div
              key={i}
              className="p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-all"
            >
              <div className="flex items-start gap-2 mb-2">
                <Badge className={colors} variant="outline">
                  {resource.category}
                </Badge>
              </div>
              <p className="text-sm font-medium mb-1">{resource.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {resource.description}
              </p>
            </div>
          );
        })}

        <div className="pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-2 italic">
            💡 <strong>Lembre-se:</strong> TDAH é neurobiológico. Não é falta de vontade ou inteligência. Você não é "preguiçoso", seu cérebro só processa diferente. Trate-se com compaixão! 💚
          </p>
        </div>
      </CardContent>
    </Card>
  );
}