import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const today = new Date().toISOString().split('T')[0];

    const [allTasks, todayBlocks] = await Promise.all([
      base44.entities.Task.list('-due_date', 200),
      base44.entities.TimeBlock.filter({ date: today }),
    ]);

    const pending = allTasks.filter(t =>
      t.status !== 'done' && t.status !== 'cancelled'
    ).map(t => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      energy_level: t.energy_level,
      estimated_minutes: t.estimated_minutes,
      due_date: t.due_date,
      overdue: t.due_date && t.due_date < today,
    }));

    const blocks = todayBlocks.map(b => ({
      id: b.id,
      title: b.title,
      start_time: b.start_time,
      end_time: b.end_time,
      type: b.type,
      color: b.color,
    }));

    return Response.json({ today, pending_tasks: pending, todays_blocks: blocks });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});