import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { data: appointment } = body;

    if (!appointment || appointment.status === 'cancelada') {
      return Response.json({ message: 'Consulta cancelada ou inválida' });
    }

    // Verificar se já existe event_id (já foi sincronizado)
    if (appointment.calendar_event_id) {
      return Response.json({ message: 'Consulta já sincronizada' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection('69d7d8d3b259ef293513995d');

    const eventData = {
      summary: `💊 Consulta: ${appointment.doctor_name}${appointment.specialty ? ` (${appointment.specialty})` : ''}`,
      description: `
Médico: ${appointment.doctor_name}
${appointment.specialty ? `Especialidade: ${appointment.specialty}` : ''}
${appointment.clinic_name ? `Clínica: ${appointment.clinic_name}` : ''}
${appointment.reason ? `Motivo: ${appointment.reason}` : ''}
${appointment.phone ? `Telefone: ${appointment.phone}` : ''}
${appointment.location ? `Endereço: ${appointment.location}` : ''}
${appointment.health_insurance ? `Plano: ${appointment.health_insurance}` : ''}
${appointment.notes ? `Notas: ${appointment.notes}` : ''}
      `.trim(),
      start: {
        dateTime: `${appointment.date}T${appointment.time}:00`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: `${appointment.date}T${String(parseInt(appointment.time.split(':')[0]) + 1).padStart(2, '0')}:00:00`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      location: appointment.location || appointment.clinic_name || '',
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'notification', minutes: 1440 }, // 1 dia antes
          { method: 'notification', minutes: 60 }, // 1 hora antes
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

    // Salvar o ID do evento na consulta
    await base44.entities.MedicalAppointment.update(appointment.id, {
      calendar_event_id: createdEvent.id,
    });

    return Response.json({
      success: true,
      event_id: createdEvent.id,
      message: 'Consulta sincronizada com Google Calendar',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});