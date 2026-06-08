import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { v4 as uuidv4 } from 'npm:uuid@9.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, delegatedTo, createFollowup } = await req.json();

    // Get task
    const task = await base44.entities.Task.get(taskId);
    if (!task) {
      return Response.json({ error: 'Tarefa não encontrada' }, { status: 404 });
    }

    // Generate unique token for delegation
    const delegationToken = uuidv4();

    // Update task status to 'delegado'
    await base44.entities.Task.update(taskId, {
      status: 'delegado',
      delegated_to: delegatedTo,
      delegated_at: new Date().toISOString(),
      delegation_token: delegationToken
    });

    // Send delegation email via SendEmail integration
    const emailBody = `
Olá,

${user.full_name} delegou uma tarefa para você:

**Tarefa:** ${task.title}
**Descrição:** ${task.description || 'N/A'}
**Prioridade:** ${task.priority}
**Data de entrega:** ${task.due_date || 'N/A'}
**Tempo estimado:** ${task.estimated_minutes || 'N/A'} minutos

---

Clique no link abaixo para visualizar os detalhes completos e marcar como concluído quando terminar.

Status da tarefa: **${task.status}**

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
      // Don't fail the delegation if email fails
    }

    // Create followup task if requested
    if (createFollowup) {
      const followupTitle = `Acompanhar: ${task.title}`;
      const daysFromNow = 3; // Follow up in 3 days
      const followupDate = new Date();
      followupDate.setDate(followupDate.getDate() + daysFromNow);

      const followupTask = await base44.entities.Task.create({
        title: followupTitle,
        description: `Acompanhamento de tarefa delegada para ${delegatedTo}`,
        due_date: followupDate.toISOString().split('T')[0],
        priority: task.priority,
        status: 'todo',
        parent_task_id: taskId
      });

      // Link followup to original task
      await base44.entities.Task.update(taskId, {
        has_followup_task: true,
        followup_task_id: followupTask.id
      });
    }

    return Response.json({
      success: true,
      message: 'Tarefa delegada com sucesso',
      delegationToken,
      delegationLink
    });
  } catch (error) {
    console.error('Error delegating task:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});