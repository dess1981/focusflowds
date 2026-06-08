import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Get pending tasks from today
    const tasks = await base44.entities.Task.filter({
      due_date: today,
      status: { $ne: 'done' }
    });

    // Get overdue tasks
    const overdueTasks = await base44.entities.Task.filter({
      due_date: { $lt: today },
      status: { $ne: 'done' }
    });

    // Get tomorrow's tasks to show what's coming
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const tomorrowTasks = await base44.entities.Task.filter({
      due_date: tomorrow
    });

    // Calculate stats
    const pendingToday = tasks.filter(t => t.status !== 'done').length;
    const pendingOverdue = overdueTasks.length;
    const urgentTasks = tasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length;

    // Build reminder message
    const summary = {
      date: today,
      user_name: user.full_name,
      pending_today: pendingToday,
      overdue_count: pendingOverdue,
      urgent_count: urgentTasks,
      tomorrow_total: tomorrowTasks.length,
      tasks_today: tasks.map(t => ({
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
      tomorrow_preview: tomorrowTasks.slice(0, 3).map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
      })),
    };

    // Store review data for the user (optional)
    if (pendingToday > 0 || pendingOverdue > 0) {
      // Could integrate with notifications here
      console.log(`Daily Review Reminder for ${user.full_name}:`, summary);
    }

    return Response.json({
      success: true,
      reminder_generated: true,
      summary,
      message: `Olá ${user.full_name}! 📋\n\nResumo do dia:\n- ${pendingToday} tarefa(s) pendente(s) hoje\n- ${pendingOverdue} tarefa(s) atrasada(s)\n- ${urgentTasks} tarefa(s) urgente(s)\n\nAmanhã você tem ${tomorrowTasks.length} tarefa(s) programadas.`,
    });
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});