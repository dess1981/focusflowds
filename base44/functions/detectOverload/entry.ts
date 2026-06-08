import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const nextSevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get all tasks
    const tasks = await base44.entities.Task.list('-created_date', 500);
    
    // Analyze completion history (last 30 days)
    const completedTasks = tasks.filter(t => 
      t.status === 'done' && 
      t.completed_at && 
      t.completed_at.split('T')[0] >= thirtyDaysAgo
    );

    // Group by date
    const completionByDate = {};
    completedTasks.forEach(t => {
      const date = t.completed_at.split('T')[0];
      completionByDate[date] = (completionByDate[date] || 0) + 1;
    });

    // Calculate average daily completion
    const avgCompletion = Object.keys(completionByDate).length > 0
      ? Object.values(completionByDate).reduce((a, b) => a + b, 0) / Math.max(Object.keys(completionByDate).length, 1)
      : 3;

    // Get pending tasks for next 7 days grouped by date
    const pendingTasks = tasks.filter(t => 
      t.status !== 'done' && 
      t.due_date && 
      t.due_date >= today &&
      t.due_date <= nextSevenDays
    );

    const tasksByDate = {};
    pendingTasks.forEach(t => {
      const date = t.due_date;
      if (!tasksByDate[date]) {
        tasksByDate[date] = [];
      }
      tasksByDate[date].push(t);
    });

    // Find overloaded days and underloaded days
    const dateRange = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      dateRange.push(dateStr);
    }

    const analysis = {};
    dateRange.forEach(date => {
      const count = tasksByDate[date]?.length || 0;
      analysis[date] = {
        count,
        isOverloaded: count > avgCompletion * 1.3, // 30% above average
        isUnderloaded: count < avgCompletion * 0.7 && count > 0,
      };
    });

    // Find overloaded and underloaded days
    const overloadedDays = Object.entries(analysis).filter(([_, a]) => a.isOverloaded);
    const underloadedDays = Object.entries(analysis).filter(([_, a]) => a.isUnderloaded);

    // Generate suggestions
    const suggestions = [];
    
    if (overloadedDays.length > 0) {
      overloadedDays.forEach(([date, analysis]) => {
        const dayTasks = tasksByDate[date] || [];
        const lowPriorityTasks = dayTasks
          .filter(t => t.priority === 'low' || t.priority === 'medium')
          .sort((a, b) => (a.priority === 'low' ? -1 : 1))
          .slice(0, 2);

        if (lowPriorityTasks.length > 0 && underloadedDays.length > 0) {
          const targetDate = underloadedDays[0][0];
          suggestions.push({
            type: 'move_task',
            overloadedDate: date,
            targetDate,
            tasksToMove: lowPriorityTasks.map(t => ({
              id: t.id,
              title: t.title,
              priority: t.priority,
            })),
            reason: `${date} tem ${analysis.count} tarefas (média: ${Math.round(avgCompletion)}). ${targetDate} está mais leve.`,
          });
        }
      });
    }

    // Determine overall status
    let status = 'balanced';
    if (overloadedDays.length >= 2) {
      status = 'overloaded';
    } else if (overloadedDays.length === 1) {
      status = 'busy';
    }

    return Response.json({
      status,
      avgCompletion: Math.round(avgCompletion),
      overloadedDays: overloadedDays.map(([date, a]) => ({ date, count: a.count })),
      suggestions,
      nextSevenDays: analysis,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});