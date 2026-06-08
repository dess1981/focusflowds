import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CONNECTOR_ID = '69d7d8d3b259ef293513995d';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entityType, entity, action } = await req.json();

    // Get Google Calendar connection
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);

    // For Tasks and TimeBlocks
    const isTask = entityType === 'Task';
    const isTimeBlock = entityType === 'TimeBlock';

    if (!isTask && !isTimeBlock) {
      return Response.json({ error: 'Invalid entity type' }, { status: 400 });
    }

    // Handle delete
    if (action === 'delete' && entity.calendar_event_id) {
      const deleteRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${entity.calendar_event_id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!deleteRes.ok && deleteRes.status !== 404) {
        console.error('Failed to delete calendar event');
      }

      return Response.json({ success: true, action: 'deleted' });
    }

    // Handle create/update
    if (!entity.due_date) {
      return Response.json({ error: 'Entity must have due_date' }, { status: 400 });
    }

    // Build start/end times
    let startDateTime, endDateTime;

    if (isTask) {
      // Task: use due_date + time_block_start/end or default 09:00-10:00
      const date = entity.due_date;
      const startTime = entity.time_block_start || '09:00';
      const endTime = entity.time_block_end || '10:00';
      startDateTime = `${date}T${startTime}:00`;
      endDateTime = `${date}T${endTime}:00`;
    } else if (isTimeBlock) {
      // TimeBlock: use date + start_time/end_time or default to all-day
      const date = entity.date;
      if (entity.start_time && entity.end_time) {
        startDateTime = `${date}T${entity.start_time}:00`;
        endDateTime = `${date}T${entity.end_time}:00`;
      } else {
        // All-day event (no specific times)
        startDateTime = null;
        endDateTime = null;
      }
    }

    const calendarEvent = {
      summary: entity.title,
      description: buildDescription(entity, entityType),
      ...getTimeFormat(startDateTime, endDateTime),
      colorId: mapColorToGoogleColorId(entity.color),
      transparency: 'opaque',
      visibility: 'private',
    };

    // Create or update
    const method = entity.calendar_event_id ? 'PATCH' : 'POST';
    const eventUrl = entity.calendar_event_id
      ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${entity.calendar_event_id}`
      : 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

    const response = await fetch(eventUrl, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calendarEvent),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Google Calendar API error:', error);
      return Response.json({ error: 'Failed to sync calendar event' }, { status: 500 });
    }

    const gcEvent = await response.json();

    // Save calendar event ID back to entity
    if (isTask) {
      await base44.entities.Task.update(entity.id, {
        calendar_event_id: gcEvent.id,
      });
    } else if (isTimeBlock) {
      await base44.entities.TimeBlock.update(entity.id, {
        calendar_event_id: gcEvent.id,
      });
    }

    return Response.json({ success: true, eventId: gcEvent.id, action: method === 'POST' ? 'created' : 'updated' });
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getTimeFormat(startDateTime, endDateTime) {
  if (!startDateTime || !endDateTime) {
    // All-day event
    const [date] = startDateTime?.split('T') || ['2026-06-08'];
    return {
      start: { date },
      end: { date: new Date(date + 'T00:00:00').toISOString().split('T')[0] },
    };
  }

  return {
    start: {
      dateTime: startDateTime,
      timeZone: 'America/New_York',
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'America/New_York',
    },
  };
}

function buildDescription(entity, entityType) {
  if (entityType === 'Task') {
    return entity.description || `Tarefa: ${entity.status}`;
  } else if (entityType === 'TimeBlock') {
    return entity.type ? `Bloco de atividade: ${entity.type}` : 'Bloco de atividade';
  }
  return '';
}

function mapColorToGoogleColorId(hexColor) {
  const colorMap = {
    '#4F6BED': '7',
    '#a855f7': '5',
    '#22d3ee': '6',
    '#ec4899': '4',
    '#f97316': '17',
    '#eab308': '5',
  };
  return colorMap[hexColor?.toLowerCase()] || '7';
}