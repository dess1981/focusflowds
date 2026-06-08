import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const today = new Date().toISOString().split('T')[0];
    const todayDate = new Date();
    const nowHHMM = todayDate.toTimeString().slice(0, 5);

    // Fetch tasks and today's time blocks in parallel
    const [allTasks, todayBlocks] = await Promise.all([
      base44.entities.Task.list('-due_date', 300),
      base44.entities.TimeBlock.filter({ date: today }),
    ]);

    // Only active tasks
    const activeTasks = allTasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');

    // Categorize tasks
    const overdue = activeTasks.filter(t => t.due_date && t.due_date < today);
    const dueToday = activeTasks.filter(t => t.due_date === today);
    const dueSoon = activeTasks.filter(t => {
      if (!t.due_date || t.due_date <= today) return false;
      const daysUntil = Math.ceil((new Date(t.due_date) - todayDate) / (1000 * 60 * 60 * 24));
      return daysUntil <= 3;
    });
    const highPriorityPending = activeTasks.filter(t =>
      (t.priority === 'urgent' || t.priority === 'high') && !t.due_date
    );

    // Compute today's workload in minutes from time blocks
    const scheduledMinutes = todayBlocks.reduce((sum, b) => {
      if (!b.start_time || !b.end_time) return sum;
      const [sh, sm] = b.start_time.split(':').map(Number);
      const [eh, em] = b.end_time.split(':').map(Number);
      return sum + ((eh * 60 + em) - (sh * 60 + sm));
    }, 0);

    // Estimated task load for today
    const todayTaskMinutes = dueToday.reduce((sum, t) => sum + (t.estimated_minutes || 30), 0);

    const prompt = `
Você é um assistente de produtividade para pessoas com TDAH. Analise as tarefas e gere notificações inteligentes em PORTUGUÊS BRASILEIRO. Seja direto, empático e motivador — sem enrolação.

CONTEXTO ATUAL:
- Hora atual: ${nowHHMM}
- Data: ${today}
- Blocos de tempo agendados hoje: ${scheduledMinutes} minutos (${Math.round(scheduledMinutes / 60 * 10) / 10}h)
- Estimativa de tempo para tarefas do dia: ${todayTaskMinutes} minutos

TAREFAS ATRASADAS (${overdue.length}):
${overdue.slice(0, 5).map(t => `• ${t.title} (venceu em ${t.due_date}, prioridade: ${t.priority})`).join('\n') || 'Nenhuma'}

TAREFAS PARA HOJE (${dueToday.length}):
${dueToday.slice(0, 8).map(t => `• ${t.title} (prioridade: ${t.priority}, estimativa: ${t.estimated_minutes || '?'} min)`).join('\n') || 'Nenhuma'}

TAREFAS COM PRAZO EM ATÉ 3 DIAS (${dueSoon.length}):
${dueSoon.slice(0, 5).map(t => `• ${t.title} (vence em ${t.due_date})`).join('\n') || 'Nenhuma'}

ALTA PRIORIDADE SEM PRAZO (${highPriorityPending.length}):
${highPriorityPending.slice(0, 3).map(t => `• ${t.title}`).join('\n') || 'Nenhuma'}

Gere de 2 a 5 notificações inteligentes e priorizadas. Para cada notificação:
- type: "urgent" | "warning" | "info" | "tip"
- title: título curto e claro (máx 8 palavras)
- message: mensagem contextual e empática (máx 2 frases)
- action: ação sugerida ao usuário (ex: "Ver tarefas atrasadas", "Planejar o dia")
- action_link: uma das rotas: "/" | "/tasks" | "/calendar"

Se a carga do dia estiver sobrecarregada (blocos agendados + estimativa de tarefas > 8 horas), inclua uma notificação de aviso sobre isso.
Se não há tarefas atrasadas nem para hoje, gere uma notificação motivacional positiva.
`.trim();

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          notifications: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                title: { type: 'string' },
                message: { type: 'string' },
                action: { type: 'string' },
                action_link: { type: 'string' },
              },
            },
          },
          summary: { type: 'string' },
        },
      },
    });

    return Response.json({
      notifications: result.notifications || [],
      summary: result.summary || '',
      meta: {
        overdue_count: overdue.length,
        due_today_count: dueToday.length,
        due_soon_count: dueSoon.length,
        scheduled_minutes: scheduledMinutes,
        today_task_minutes: todayTaskMinutes,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});