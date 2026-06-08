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
    const recentTasks = tasks.filter(t => t.due_date >= sevenDaysAgo);

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
      recentTasks: recentTasks.slice(0, 10).map(t => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.due_date,
      })),
    };

    const prompt = `You are a compassionate and insightful wellness coach analyzing a user's diary, health records, and productivity patterns.

Based on the following 7-day history, provide personalized insights and actionable suggestions:

**Diary Entries & Moods:**
${context.diaryEntries.map(e => `- ${e.date} (${e.mood}): "${e.diary?.substring(0, 100)}..."`).join('\n')}

**Medications:**
${context.medications.map(m => `- ${m.name} ${m.dosage} (${m.frequency})`).join('\n')}

**Medication Adherence:** ${context.medicationAdherence.taken}/${context.medicationAdherence.total} doses taken

**Upcoming Appointments:**
${context.upcomingAppointments.map(a => `- ${a.date} ${a.time}: ${a.doctor} (${a.specialty})`).join('\n')}

**Recent Tasks:** ${context.recentTasks.length} tasks (${context.recentTasks.filter(t => t.status === 'done').length} completed)

Provide 2-3 concise, actionable insights in Portuguese. Format as:
1. **Observation:** [What you notice about patterns]
2. **Suggestion:** [A specific, practical recommendation]
3. **Quick Win:** [One easy action they can take today/this week]

Keep each insight to 2 sentences max. Be encouraging and supportive.`;

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
                observation: { type: 'string' },
                suggestion: { type: 'string' },
                action: { type: 'string' },
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