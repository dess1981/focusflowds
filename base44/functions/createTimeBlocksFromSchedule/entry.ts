import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Expects: { blocks: [{ title, start_time, end_time, task_id?, color?, type? }] }
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { blocks = [] } = await req.json();
    const today = new Date().toISOString().split('T')[0];

    const created = [];
    for (const block of blocks) {
      const record = await base44.entities.TimeBlock.create({
        title: block.title,
        date: today,
        start_time: block.start_time,
        end_time: block.end_time,
        task_id: block.task_id || null,
        color: block.color || '#4F6BED',
        type: block.type || 'focus',
        is_template: false,
      });
      created.push(record);
    }

    return Response.json({ created: created.length, blocks: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});