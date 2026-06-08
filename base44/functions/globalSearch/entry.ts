import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await req.json();
    if (!query || query.trim().length === 0) {
      return Response.json({ results: {} });
    }

    const q = query.toLowerCase();
    const results = {};

    // Search Tasks
    const tasks = await base44.entities.Task.list('-updated_date', 100);
    results.tasks = tasks
      .filter(t => 
        t.title?.toLowerCase().includes(q) || 
        t.description?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        due_date: t.due_date,
      }));

    // Search Diary Entries
    const diaryEntries = await base44.entities.DailyEntry.list('-updated_date', 50);
    results.diary = diaryEntries
      .filter(d => 
        d.diary_text?.toLowerCase().includes(q) || 
        d.goals_text?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map(d => ({
        id: d.id,
        date: d.date,
        diary_text: d.diary_text?.substring(0, 100),
        goals_text: d.goals_text?.substring(0, 100),
        mood: d.mood,
      }));

    // Search Medical Appointments
    const appointments = await base44.entities.MedicalAppointment.list('-updated_date', 50);
    results.appointments = appointments
      .filter(a => 
        a.doctor_name?.toLowerCase().includes(q) || 
        a.specialty?.toLowerCase().includes(q) ||
        a.reason?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map(a => ({
        id: a.id,
        doctor_name: a.doctor_name,
        specialty: a.specialty,
        date: a.date,
        time: a.time,
        reason: a.reason,
      }));

    // Search Medical Tests
    const tests = await base44.entities.MedicalTest.list('-updated_date', 50);
    results.tests = tests
      .filter(t => 
        t.test_name?.toLowerCase().includes(q) || 
        t.lab_name?.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        test_name: t.test_name,
        lab_name: t.lab_name,
        date_requested: t.date_requested,
        status: t.status,
      }));

    // Search Medications
    const medications = await base44.entities.Medication.list('-updated_date', 50);
    results.medications = medications
      .filter(m => 
        m.name?.toLowerCase().includes(q) || 
        m.doctor?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map(m => ({
        id: m.id,
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        active: m.active,
      }));

    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});