import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // Usar service role pois é automação agendada (sem usuário autenticado)
    const tasks = await base44.asServiceRole.entities.Task.filter({
      due_date: today,
      status: { $ne: 'done' },
    });

    const overdueTasks = await base44.asServiceRole.entities.Task.filter({
      due_date: { $lt: today },
      status: { $ne: 'done' },
    });

    const cancelledTasks = await base44.asServiceRole.entities.Task.filter({
      status: 'cancelled',
      due_date: today,
    });

    const tomorrowTasks = await base44.asServiceRole.entities.Task.filter({
      due_date: tomorrow,
    });

    const pendingToday = tasks.length;
    const pendingOverdue = overdueTasks.length;
    const urgentTasks = tasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length;

    const summary = {
      date: today,
      pending_today: pendingToday,
      overdue_count: pendingOverdue,
      urgent_count: urgentTasks,
      tomorrow_total: tomorrowTasks.length,
      cancelled_today: cancelledTasks.length,
      tasks_today: tasks.slice(0, 10).map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        status: t.status,
        estimated_minutes: t.estimated_minutes,
      })),
      overdue_tasks: overdueTasks.slice(0, 5).map(t => ({
        id: t.id,
        title: t.title,
        due_date: t.due_date,
        priority: t.priority,
      })),
      tomorrow_preview: tomorrowTasks.slice(0, 5).map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
      })),
    };

    console.log(`[DailyReview] ${today} — ${pendingToday} pending today, ${pendingOverdue} overdue, ${urgentTasks} urgent, ${tomorrowTasks.length} tomorrow`);

    return Response.json({
      success: true,
      reminder_generated: true,
      summary,
      message: `📋 Resumo do dia (${today}):\n- ${pendingToday} tarefa(s) pendente(s) hoje\n- ${pendingOverdue} tarefa(s) atrasada(s)\n- ${urgentTasks} tarefa(s) urgente(s)\n\nAmanhã: ${tomorrowTasks.length} tarefa(s) programadas.`,
    });
  } catch (error) {
    console.error('[DailyReview] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});