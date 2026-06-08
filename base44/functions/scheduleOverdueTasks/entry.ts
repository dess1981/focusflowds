import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Find all overdue tasks (due_date < today, not done/cancelled)
    const allTasks = await base44.asServiceRole.entities.Task.list('-due_date', 500);
    const overdueTasks = allTasks.filter(t =>
      t.due_date &&
      t.due_date < today &&
      t.status !== 'done' &&
      t.status !== 'cancelled'
    );

    if (overdueTasks.length === 0) {
      return Response.json({ message: 'No overdue tasks found', created: 0 });
    }

    // Get existing TimeBlocks for today to avoid duplicates
    const existingBlocks = await base44.asServiceRole.entities.TimeBlock.filter({ date: today });
    const existingTaskIds = new Set(existingBlocks.map(b => b.task_id).filter(Boolean));

    // Create one TimeBlock per overdue task that doesn't already have one today
    const toCreate = overdueTasks.filter(t => !existingTaskIds.has(t.id));

    let created = 0;
    for (const task of toCreate) {
      await base44.asServiceRole.entities.TimeBlock.create({
        title: `⚠️ Atrasada: ${task.title}`,
        date: today,
        task_id: task.id,
        color: task.priority === 'urgent' ? '#ef4444' :
               task.priority === 'high'   ? '#f97316' :
               task.priority === 'medium' ? '#4F6BED' : '#94a3b8',
        type: 'task',
        is_template: false,
      });
      created++;
    }

    return Response.json({
      message: `Created ${created} TimeBlock(s) for overdue tasks`,
      created,
      skipped: overdueTasks.length - created,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});