import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CONNECTOR_ID = '69d7d8d3b259ef293513995d';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);

    // Buscar eventos dos próximos 60 dias + 7 dias atrás
    const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

    const params = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '100',
      timeMin,
      timeMax,
    });

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) {
      const err = await res.json();
      console.error('Google API error:', err);
      return Response.json({ error: err.error?.message || 'Google API error' }, { status: res.status });
    }

    const data = await res.json();
    const gcEvents = data.items || [];

    // Buscar tarefas existentes com calendar_event_id para evitar duplicatas
    const existingTasks = await base44.entities.Task.filter({ created_by_id: user.id });
    const syncedIds = new Set(existingTasks.filter(t => t.calendar_event_id).map(t => t.calendar_event_id));

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const ev of gcEvents) {
      if (!ev.id || ev.status === 'cancelled') { skipped++; continue; }

      // Só importar eventos que têm data futura ou foram criados externamente
      const startDateTime = ev.start?.dateTime || ev.start?.date;
      if (!startDateTime) { skipped++; continue; }

      const [dateStr, timeStr] = startDateTime.includes('T')
        ? startDateTime.split('T')
        : [startDateTime, null];

      const endDateTime = ev.end?.dateTime || ev.end?.date;
      const endTimeStr = endDateTime?.includes('T') ? endDateTime.split('T')[1]?.slice(0, 5) : null;

      if (syncedIds.has(ev.id)) {
        // Atualizar tarefa existente com dados do Google
        const existing = existingTasks.find(t => t.calendar_event_id === ev.id);
        if (existing) {
          await base44.entities.Task.update(existing.id, {
            title: ev.summary || existing.title,
            due_date: dateStr,
            time_block_start: timeStr ? timeStr.slice(0, 5) : existing.time_block_start,
            time_block_end: endTimeStr || existing.time_block_end,
            description: ev.description || existing.description,
          });
          updated++;
        }
        continue;
      }

      // Criar nova tarefa a partir do evento do Google
      const taskData = {
        title: ev.summary || '(sem título)',
        description: ev.description || '',
        calendar_event_id: ev.id,
        due_date: dateStr,
        status: 'todo',
        priority: 'medium',
        task_type: ev.hangoutLink ? 'meeting' : 'task',
      };

      if (timeStr) taskData.time_block_start = timeStr.slice(0, 5);
      if (endTimeStr) taskData.time_block_end = endTimeStr;
      if (ev.hangoutLink) taskData.meet_link = ev.hangoutLink;
      if (ev.location) taskData.location_address = ev.location;

      await base44.entities.Task.create(taskData);
      created++;
    }

    return Response.json({ success: true, created, updated, skipped, total: gcEvents.length });
  } catch (error) {
    console.error('importGoogleCalendarEvents error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});