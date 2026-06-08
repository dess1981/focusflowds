import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event, body } = await req.json();

    // Get the Google Calendar connection
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

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
      transparency: 'opaque', // Block time
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
  // Map custom colors to Google Calendar color IDs (1-11)
  const colorMap = {
    '#4F6BED': '7', // Blueberry
    '#a855f7': '5', // Grape
    '#22d3ee': '6', // Peacock
    '#ec4899': '4', // Flamingo
    '#f97316': '17', // Tangerine
    '#eab308': '5', // Banana
  };
  return colorMap[hexColor?.toLowerCase()] || '7';
}