import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { v4 as uuidv4 } from 'npm:uuid@9.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, text } = await req.json();

    if (!taskId || !text) {
      return Response.json({ error: 'taskId e text são obrigatórios' }, { status: 400 });
    }

    // Get current task
    const task = await base44.entities.Task.get(taskId);
    if (!task) {
      return Response.json({ error: 'Tarefa não encontrada' }, { status: 404 });
    }

    // Create new comment
    const newComment = {
      id: uuidv4(),
      text,
      author: user.full_name || user.email,
      created_at: new Date().toISOString()
    };

    // Add to comments array
    const comments = task.comments || [];
    comments.push(newComment);

    // Update task
    await base44.entities.Task.update(taskId, {
      comments
    });

    return Response.json({
      success: true,
      comment: newComment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});