import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { stats, reportType } = await req.json();

    if (!stats) {
      return Response.json({ error: 'Missing stats' }, { status: 400 });
    }

    const reportLabel = reportType === 'daily' ? 'diário' : reportType === 'weekly' ? 'semanal' : 'mensal';

    const audioScript = generateAudioScript(stats, reportLabel);

    // Generate speech using Core integration
    const audioResponse = await base44.integrations.Core.GenerateSpeech({
      text: audioScript,
      language: 'pt-BR',
    });

    return Response.json({ 
      success: true, 
      audioUrl: audioResponse.url,
      script: audioScript,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateAudioScript(stats, reportLabel) {
  return `
    Seu relatório de produtividade ${reportLabel}.
    
    Taxa de conclusão: ${stats.completionRate} por cento.
    Você completou ${stats.completed} de ${stats.total} tarefas.
    
    Horas de foco total: ${stats.totalFocusHours} horas.
    Tempo médio por tarefa: ${stats.avgFocusMinutes} minutos.
    
    ${stats.completionRate > 70 
      ? 'Parabéns! Você teve uma produtividade excelente neste período. Continue assim!' 
      : stats.completionRate > 50 
      ? 'Boa produtividade. Você está no caminho certo. Tente melhorar um pouco mais na próxima semana.' 
      : 'Sua produtividade foi baixa este período. Considere ajustar sua estratégia de foco e priorização.'}
    
    Dica: ${stats.avgFocusMinutes < 20 
      ? 'Você parece estar tendo dificuldade de manter o foco. Tente usar blocos de tempo mais curtos e fazer pausas frequentes.' 
      : 'Continue mantendo seus sessões de foco focadas. Seu padrão atual é muito produtivo.'}
    
    Até o próximo relatório!
  `;
}