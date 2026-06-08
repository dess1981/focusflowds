import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fetch diary entries from last 7 days
    const diaryEntries = await base44.entities.DailyEntry.list('-created_date', 50);
    const recentEntries = diaryEntries.filter(e => e.date >= sevenDaysAgo);

    // Fetch medication logs
    const medLogs = await base44.entities.MedicationLog.list('-created_date', 100);
    const recentMedLogs = medLogs.filter(m => m.date >= sevenDaysAgo);

    // Fetch active medications
    const medications = await base44.entities.Medication.filter({ active: true });

    // Fetch upcoming appointments
    const appointments = await base44.entities.MedicalAppointment.filter({ status: 'agendada' });

    // Fetch tasks
    const tasks = await base44.entities.Task.list('-created_date', 100);
    const nextSevenDaysDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const pendingTasks = tasks.filter(t => 
      t.status !== 'done' && 
      t.due_date && 
      t.due_date <= nextSevenDaysDate &&
      t.due_date >= today
    );

    // Fetch time blocks
    const timeBlocks = await base44.entities.TimeBlock.list('-created_date', 100);
    const nextWeekBlocks = timeBlocks.filter(tb => tb.date && tb.date <= nextSevenDaysDate && tb.date >= today);

    // Construct context for LLM
    const context = {
      diaryEntries: recentEntries.map(e => ({
        date: e.date,
        diary: e.diary_text,
        goals: e.goals_text,
        mood: e.mood,
      })),
      medications: medications.map(m => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
      })),
      medicationAdherence: {
        total: recentMedLogs.length,
        taken: recentMedLogs.filter(m => m.taken).length,
      },
      upcomingAppointments: appointments.slice(0, 3).map(a => ({
        doctor: a.doctor_name,
        specialty: a.specialty,
        date: a.date,
        time: a.time,
      })),
      pendingTasks: pendingTasks.slice(0, 10).map(t => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.due_date,
        estimatedMinutes: t.estimated_minutes,
        energyLevel: t.energy_level,
      })),
      timeBlocks: nextWeekBlocks.slice(0, 15).map(tb => ({
        title: tb.title,
        date: tb.date,
        startTime: tb.start_time,
        endTime: tb.end_time,
        type: tb.type,
      })),
    };

    const prompt = `You are a compassionate productivity coach analyzing a user's diary, health records, pending tasks, and weekly time blocks.

Based on the following information, provide personalized insights and a strategic time-blocking recommendation:

**Diary Entries & Moods (Last 7 days):**
${context.diaryEntries.map(e => `- ${e.date} (${e.mood}): "${e.diary?.substring(0, 80)}..."`).join('\n')}

**Medications:**
${context.medications.map(m => `- ${m.name} ${m.dosage} (${m.frequency})`).join('\n')} | Adherence: ${context.medicationAdherence.taken}/${context.medicationAdherence.total}

**Upcoming Appointments (Next 7 days):**
${context.upcomingAppointments.map(a => `- ${a.date} ${a.time}: ${a.doctor} (${a.specialty})`).join('\n') || 'Nenhuma agendada'}

**Pending Tasks (Due this week):**
${context.pendingTasks.map(t => `- [${t.priority}] ${t.title} (Due: ${t.dueDate}, Energy: ${t.energyLevel || 'medium'}, ~${t.estimatedMinutes || '?'} min)`).join('\n') || 'Nenhuma tarefa pendente'}

**Current Time Blocks (Next 7 days):**
${context.timeBlocks.map(tb => `- ${tb.date} ${tb.startTime || 'TBD'}: ${tb.title} (${tb.type})`).join('\n') || 'Nenhum bloco agendado'}

Provide insights and time-blocking recommendations in Portuguese:

1. **📊 Priority Analysis:** Analyze which pending tasks should be tackled first based on priority and deadline.
2. **⏰ Time-Blocking Strategy:** Suggest how to distribute these tasks across the next 7 days, considering energy levels, appointments, and medication times.
3. **⚡ Energy-Optimized Schedule:** Recommend when high-energy vs. low-energy tasks should be scheduled based on the user's mood patterns.

Keep each section to 2-3 sentences. Be specific with day suggestions and energy-task matching. Be encouraging!`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          insights: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                content: { type: 'string' },
              },
            },
          },
        },
      },
    });

    return Response.json({
      success: true,
      insights: response.insights || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});