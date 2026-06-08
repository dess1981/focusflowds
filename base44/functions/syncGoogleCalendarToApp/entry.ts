import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { automation, data, event } = await req.json();

    // Event from Google Calendar webhook
    const gcEvent = data;

    if (!gcEvent || !gcEvent.id) {
      return Response.json({ error: 'Invalid event data' }, { status: 400 });
    }

    // Check if we already have this event synced
    const existingTasks = await base44.entities.Task.filter({ calendar_event_id: gcEvent.id });
    const existingBlocks = await base44.entities.TimeBlock.filter({ calendar_event_id: gcEvent.id });

    const alreadySynced = existingTasks.length > 0 || existingBlocks.length > 0;

    // Handle deletion
    if (gcEvent.status === 'cancelled') {
      if (existingTasks.length > 0) {
        await base44.entities.Task.delete(existingTasks[0].id);
      }
      if (existingBlocks.length > 0) {
        await base44.entities.TimeBlock.delete(existingBlocks[0].id);
      }
      return Response.json({ success: true, action: 'deleted' });
    }

    // Skip if already synced (prevent duplicates from our own sync)
    if (alreadySynced) {
      const existingItem = existingTasks[0] || existingBlocks[0];
      // Update existing if it changed
      const updated = await updateSyncedEvent(base44, existingItem, gcEvent, existingTasks.length > 0);
      return Response.json({ success: true, action: 'updated', synced: true });
    }

    // Create new task from Google Calendar event
    const taskData = {
      title: gcEvent.summary || '(sem título)',
      description: gcEvent.description || '',
      calendar_event_id: gcEvent.id,
      status: 'todo',
      priority: 'medium',
    };

    // Parse date and time from Google Calendar event
    const startDateTime = gcEvent.start?.dateTime || gcEvent.start?.date;
    if (startDateTime) {
      const [date, time] = startDateTime.split('T');
      taskData.due_date = date;
      if (time) {
        taskData.time_block_start = time.slice(0, 5);
      }
    }

    if (gcEvent.end?.dateTime || gcEvent.end?.date) {
      const endDateTime = gcEvent.end.dateTime || gcEvent.end.date;
      const [, time] = endDateTime.split('T');
      if (time) {
        taskData.time_block_end = time.slice(0, 5);
      }
    }

    // Create the task
    await base44.entities.Task.create(taskData);

    return Response.json({ success: true, action: 'created', synced: false });
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function updateSyncedEvent(base44, existingItem, gcEvent, isTask) {
  const updateData = {
    title: gcEvent.summary || existingItem.title,
    description: gcEvent.description || existingItem.description,
  };

  if (gcEvent.start?.dateTime || gcEvent.start?.date) {
    const startDateTime = gcEvent.start.dateTime || gcEvent.start.date;
    const [date, time] = startDateTime.split('T');
    updateData.due_date = date;
    if (time) updateData.time_block_start = time.slice(0, 5);
  }

  if (isTask) {
    await base44.entities.Task.update(existingItem.id, updateData);
  } else {
    await base44.entities.TimeBlock.update(existingItem.id, updateData);
  }
}