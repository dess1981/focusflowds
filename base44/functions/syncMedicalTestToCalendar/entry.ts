import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { data: test } = body;

    if (!test || !test.date_performed) {
      return Response.json({ message: 'Exame sem data de realização' });
    }

    // Verificar se já existe event_id
    if (test.calendar_event_id) {
      return Response.json({ message: 'Exame já sincronizado' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection('69d7d8d3b259ef293513995d');

    const eventData = {
      summary: `🩺 Exame: ${test.test_name}`,
      description: `
Tipo de Exame: ${test.test_name}
${test.date_performed ? `Data: ${test.date_performed}` : ''}
${test.doctor_requested ? `Solicitado por: ${test.doctor_requested}` : ''}
${test.lab_name ? `Laboratório: ${test.lab_name}` : ''}
${test.result ? `Resultado: ${test.result}` : ''}
${test.notes ? `Notas: ${test.notes}` : ''}
      `.trim(),
      start: {
        date: test.date_performed,
      },
      end: {
        date: test.date_performed,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'notification', minutes: 1440 }, // 1 dia antes
        ],
      },
    };

    const calendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!calendarResponse.ok) {
      const error = await calendarResponse.text();
      return Response.json({ error: `Google Calendar error: ${error}` }, { status: 400 });
    }

    const createdEvent = await calendarResponse.json();

    // Salvar o ID do evento no exame
    await base44.entities.MedicalTest.update(test.id, {
      calendar_event_id: createdEvent.id,
    });

    return Response.json({
      success: true,
      event_id: createdEvent.id,
      message: 'Exame sincronizado com Google Calendar',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});