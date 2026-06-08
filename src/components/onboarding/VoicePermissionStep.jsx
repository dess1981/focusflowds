import React from 'react';
import { Mic, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function VoicePermissionStep({ onComplete }) {
  const requestMicrophonePermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      onComplete();
    } catch (error) {
      console.error('Permissão de microfone negada', error);
      // Continuar mesmo sem permissão
      onComplete();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Mic className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-xl font-heading font-bold">Comandos de Voz</h2>
          <p className="text-sm text-muted-foreground">Dite tarefas enquanto está em movimento</p>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6 space-y-3">
          <div className="flex gap-3">
            <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Funciona com:</p>
              <p className="text-xs text-muted-foreground">Siri, Google Assistant, Web Speech API</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">IA Inteligente:</p>
              <p className="text-xs text-muted-foreground">Extrai prioridade e categoria automaticamente</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Em Português:</p>
              <p className="text-xs text-muted-foreground">Comande em português português natural</p>
            </div>
          </div>

          <div className="bg-background/50 rounded-lg p-3 mt-4">
            <p className="text-xs text-muted-foreground">
              <strong>Exemplo:</strong> "Comprar leite amanhã" → Cria tarefa com prioridade média, categoria compras
            </p>
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={requestMicrophonePermission}
        size="lg"
        className="w-full"
      >
        <Mic className="w-4 h-4 mr-2" />
        Ativar Microfone
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Você pode permitir depois. O botão de voz fica disponível no canto inferior direito.
      </p>
    </div>
  );
}