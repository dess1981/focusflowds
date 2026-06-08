import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get last 7 days data
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const todayStr = today.toISOString().split('T')[0];
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    // Fetch diary entries
    const allEntries = await base44.entities.DailyEntry.list('-date', 100);
    const weeklyEntries = allEntries.filter(e => 
      e.date >= sevenDaysAgoStr && e.date <= todayStr
    );

    // Fetch completed tasks
    const allTasks = await base44.entities.Task.list('-completed_at', 500);
    const completedTasks = allTasks.filter(t =>
      t.status === 'done' &&
      t.completed_at &&
      t.completed_at.split('T')[0] >= sevenDaysAgoStr &&
      t.completed_at.split('T')[0] <= todayStr
    );

    // Aggregate data
    const completionByDay = {};
    completedTasks.forEach(t => {
      const date = t.completed_at.split('T')[0];
      completionByDay[date] = (completionByDay[date] || 0) + 1;
    });

    const priorityStats = {
      urgent: completedTasks.filter(t => t.priority === 'urgent').length,
      high: completedTasks.filter(t => t.priority === 'high').length,
      medium: completedTasks.filter(t => t.priority === 'medium').length,
      low: completedTasks.filter(t => t.priority === 'low').length,
    };

    const categoryStats = {};
    completedTasks.forEach(t => {
      if (t.category_id) {
        categoryStats[t.category_id] = (categoryStats[t.category_id] || 0) + 1;
      }
    });

    const moodEmojis = weeklyEntries.map(e => e.mood).filter(Boolean);
    const moodMap = {
      '😍': 'Excelente',
      '😊': 'Bom',
      '😐': 'Neutro',
      '😔': 'Ruim',
      '😢': 'Muito ruim',
    };

    // Build context for LLM
    const context = `
Dados da Semana (${sevenDaysAgoStr} a ${todayStr}):

📊 Resumo de Conclusões:
- Total de tarefas concluídas: ${completedTasks.length}
- Média por dia: ${(completedTasks.length / 7).toFixed(1)}
- Distribuição: ${JSON.stringify(completionByDay)}

🎯 Por Prioridade:
- Urgentes: ${priorityStats.urgent}
- Altas: ${priorityStats.high}
- Médias: ${priorityStats.medium}
- Baixas: ${priorityStats.low}

😊 Humor da Semana:
${weeklyEntries.length > 0 
  ? weeklyEntries.map(e => `- ${e.date}: ${moodMap[e.mood] || e.mood}`).join('\n')
  : 'Sem registros de humor'}

📝 Notas do Diário:
${weeklyEntries.length > 0
  ? weeklyEntries.map(e => `[${e.date}] ${e.diary_text || 'Sem anotações'}`).join('\n\n')
  : 'Sem entradas de diário'}

🎯 Objetivos Registrados:
${weeklyEntries.length > 0
  ? weeklyEntries.map(e => `[${e.date}] ${e.goals_text || 'Sem objetivos'}`).filter(l => !l.includes('Sem objetivos')).join('\n')
  : 'Nenhum objetivo registrado'}

Baseado nesses dados, gere:
1. Um resumo executivo da semana (2-3 frases)
2. Padrões identificados (o que funcionou bem, o que não funcionou)
3. 3-4 sugestões práticas de ajustes de hábitos para próxima semana
4. Uma métrica de produtividade geral (muito baixa, baixa, média, alta, muito alta)

Seja conciso, motivador e prático nas sugestões.
    `.trim();

    // Generate summary with LLM
    let llmResponse;
    try {
      llmResponse = await base44.integrations.Core.InvokeLLM({
        prompt: context,
        response_json_schema: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            patterns: { type: 'string' },
            suggestions: {
              type: 'array',
              items: { type: 'string' },
            },
            productivityLevel: {
              type: 'string',
              enum: ['muito_baixa', 'baixa', 'media', 'alta', 'muito_alta'],
            },
          },
          required: ['executiveSummary', 'patterns', 'suggestions', 'productivityLevel'],
        },
      });
    } catch (llmError) {
      console.error('LLM Error:', llmError.message);
      // Return fallback response if LLM fails
      llmResponse = {
        executiveSummary: 'Semana analisada com sucesso.',
        patterns: 'Dados coletados do seu histórico.',
        suggestions: ['Continue acompanhando suas tarefas', 'Mantenha a rotina de diário'],
        productivityLevel: 'media',
      };
    }

    return Response.json({
      week: { start: sevenDaysAgoStr, end: todayStr },
      stats: {
        tasksCompleted: completedTasks.length,
        avgPerDay: (completedTasks.length / 7).toFixed(1),
        priorityStats,
        diaryEntries: weeklyEntries.length,
        moodCount: moodEmojis.length,
      },
      summary: llmResponse,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Function Error:', error.message, error.stack);
    return Response.json({ error: error.message, details: error.stack }, { status: 500 });
  }
});