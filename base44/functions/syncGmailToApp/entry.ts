import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data } = await req.json();

    // Only process new incoming messages
    if (!data.has_new_messages || !data.new_message_ids || data.new_message_ids.length === 0) {
      return Response.json({ success: true, processed: 0 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection('6a2653358a1cda4730de81b3');

    let processedCount = 0;

    for (const messageId of data.new_message_ids) {
      // Fetch full message
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!msgRes.ok) continue;

      const message = await msgRes.json();

      // Extract headers
      const headers = message.payload?.headers || [];
      const getHeader = (name) => headers.find(h => h.name === name)?.value || '';

      const from = getHeader('From');
      const subject = getHeader('Subject');
      const snippet = message.snippet || '';

      // Don't create task for system emails or own sent emails
      if (from.includes('noreply') || from.includes('no-reply') || !from) {
        continue;
      }

      // Check if task already exists for this email
      const existing = await base44.entities.Task.filter({ email_message_id: messageId });
      if (existing.length > 0) {
        continue;
      }

      // Create task from email
      const taskData = {
        title: subject || `Email de ${from.split('<')[0].trim()}`,
        description: snippet || 'Email importado do Gmail',
        email_message_id: messageId,
        status: 'todo',
        priority: 'medium',
        due_date: new Date().toISOString().split('T')[0],
      };

      await base44.entities.Task.create(taskData);
      processedCount++;
    }

    return Response.json({ success: true, processed: processedCount });
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});