import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar preferências
    const prefs = await base44.entities.NotificationPreference.list();
    const preferences = prefs.length > 0 ? prefs[0] : {};

    const notifications = [];

    // Medicamentos
    if (preferences.medication_reminders !== false) {
      const medications = await base44.entities.Medication.filter({ active: true });

      for (const med of medications) {
        if (!med.time_of_day || med.time_of_day.length === 0) continue;

        const now = new Date();
        const currentTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

        for (const medTime of med.time_of_day) {
          const advanceMinutes = preferences.medication_advance_minutes || 10;
          const reminderTime = new Date(now.getTime() - advanceMinutes * 60000);
          const reminderTimeStr = String(reminderTime.getHours()).padStart(2, '0') + ':' + String(reminderTime.getMinutes()).padStart(2, '0');

          if (currentTime >= reminderTimeStr && currentTime <= medTime) {
            // Verificar se já foi tomado hoje
            const today = now.toISOString().split('T')[0];
            const logs = await base44.entities.MedicationLog.filter({
              medication_id: med.id,
              date: today,
              taken: true,
            });

            if (logs.length === 0) {
              notifications.push({
                type: 'medication',
                title: `💊 Hora de tomar ${med.name}`,
                description: `${med.dosage} - ${medTime}`,
                time: medTime,
                data: { medication_id: med.id, medication_name: med.name },
              });
            }
          }
        }
      }
    }

    // Consultas
    if (preferences.appointment_reminders !== false) {
      const today = new Date().toISOString().split('T')[0];
      const appointments = await base44.entities.MedicalAppointment.filter({
        status: 'agendada',
      });

      for (const apt of appointments) {
        if (apt.date === today) {
          notifications.push({
            type: 'appointment',
            title: `🏥 Consulta com ${apt.doctor_name}`,
            description: `${apt.time}${apt.clinic_name ? ` - ${apt.clinic_name}` : ''}`,
            data: { appointment_id: apt.id },
          });
        }
      }
    }

    // Exames
    if (preferences.test_reminders !== false) {
      const today = new Date().toISOString().split('T')[0];
      const tests = await base44.entities.MedicalTest.filter({
        status: 'pendente',
      });

      for (const test of tests) {
        if (test.date_performed === today) {
          notifications.push({
            type: 'test',
            title: `🩺 Exame: ${test.test_name}`,
            description: test.lab_name ? `${test.lab_name}` : 'Agendado para hoje',
            data: { test_id: test.id },
          });
        }
      }
    }

    return Response.json({ notifications, count: notifications.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});