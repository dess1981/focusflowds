import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentHour = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${currentHour}:${currentMinutes}`;

    // Buscar medicações ativas
    const medications = await base44.entities.Medication.filter({ active: true });

    // Verificar qual medicação precisa ser tomada nos próximos 10 minutos
    const reminders = [];
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

    medications.forEach(med => {
      if (!med.time_of_day || med.time_of_day.length === 0) return;

      med.time_of_day.forEach(time => {
        const [hours, minutes] = time.split(':').map(Number);
        const medTimeInMinutes = hours * 60 + minutes;
        const timeDifference = medTimeInMinutes - currentTimeInMinutes;

        // Notificar se está entre -5 minutos (atrasado) e +10 minutos (próximo)
        if (timeDifference >= -5 && timeDifference <= 10) {
          reminders.push({
            medication_id: med.id,
            medication_name: med.name,
            dosage: med.dosage,
            scheduled_time: time,
            time_until_minutes: timeDifference,
            status: timeDifference < 0 ? 'overdue' : 'upcoming',
          });
        }
      });
    });

    // Verificar se já foram tomadas hoje
    const todayLogs = await base44.entities.MedicationLog.filter({ date: today });

    const pendingReminders = reminders.filter(reminder => {
      const taken = todayLogs.some(
        log => log.medication_id === reminder.medication_id && log.taken
      );
      return !taken;
    });

    return Response.json({
      current_time: currentTime,
      today,
      pending_reminders: pendingReminders,
      total_pending: pendingReminders.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});