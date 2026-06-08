// DEPRECATED: Use syncEventToGoogleCalendar.js instead
// Keeping for backwards compatibility with existing automations

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CONNECTOR_ID = '69d7d8d3b259ef293513995d';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event } = await req.json();

    // Get the Google Calendar connection (use app user connection)
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);

    // Create event in Google Calendar
    const calendarEvent = {
      summary: event.title,
      description: event.description || `Bloco de atividade: ${event.type}`,
      start: {
        dateTime: event.startDateTime,
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: event.endDateTime,
        timeZone: 'America/New_York',
      },
      colorId: mapColorToGoogleColorId(event.color),
      transparency: 'opaque',
      visibility: 'private',
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calendarEvent),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Google Calendar API error:', error);
      return Response.json({ error: 'Failed to create calendar event' }, { status: 500 });
    }

    const gcEvent = await response.json();

    // Save the calendar event ID back to the TimeBlock
    await base44.entities.TimeBlock.update(event.id, {
      calendar_event_id: gcEvent.id,
    });

    return Response.json({ success: true, eventId: gcEvent.id });
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

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