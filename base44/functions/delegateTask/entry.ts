import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { v4 as uuidv4 } from 'npm:uuid@9.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, delegatedTo, createFollowup, followupDueDate } = await req.json();

    const task = await base44.entities.Task.get(taskId);
    if (!task) {
      return Response.json({ error: 'Tarefa não encontrada' }, { status: 404 });
    }

    const delegationToken = uuidv4();

    await base44.entities.Task.update(taskId, {
      status: 'delegado',
      delegated_to: delegatedTo,
      delegated_at: new Date().toISOString(),
      delegation_token: delegationToken
    });

    const emailBody = `
Olá,

${user.full_name} delegou uma tarefa para você:

**Tarefa:** ${task.title}
**Descrição:** ${task.description || 'N/A'}
**Prioridade:** ${task.priority}
**Data de entrega:** ${task.due_date || 'N/A'}
**Tempo estimado:** ${task.estimated_minutes || 'N/A'} minutos

---

Obrigado!
    `;

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: delegatedTo,
        subject: `Tarefa delegada: ${task.title}`,
        html: emailBody.replace(/\n/g, '<br />')
      });
      console.log(`Delegation email sent to ${delegatedTo}`);
    } catch (emailError) {
      console.error('Failed to send delegation email:', emailError);
    }

    if (createFollowup) {
      const followupTitle = `Acompanhar: ${task.title}`;
      
      // Usa a data fornecida ou fallback de 3 dias
      let dueDateStr;
      if (followupDueDate) {
        dueDateStr = followupDueDate;
      } else {
        const followupDate = new Date();
        followupDate.setDate(followupDate.getDate() + 3);
        dueDateStr = followupDate.toISOString().split('T')[0];
      }

      const followupTask = await base44.entities.Task.create({
        title: followupTitle,
        description: `Acompanhamento de tarefa delegada para ${delegatedTo}`,
        due_date: dueDateStr,
        priority: task.priority,
        status: 'todo',
        parent_task_id: taskId,
        category_id: task.category_id || null  // herda categoria da tarefa mãe
      });

      await base44.entities.Task.update(taskId, {
        has_followup_task: true,
        followup_task_id: followupTask.id
      });
    }

    return Response.json({
      success: true,
      message: 'Tarefa delegada com sucesso',
      delegationToken
    });
  } catch (error) {
    console.error('Error delegating task:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});