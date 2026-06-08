import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entity, action } = await req.json();

    // Only process if task is linked to an email
    if (!entity.email_message_id) {
      return Response.json({ success: true, skipped: 'No email linked' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection('6a2653358a1cda4730de81b3');

    // When task is created from email, mark email as read and archive
    if (action === 'create' || action === 'update') {
      const messageId = entity.email_message_id;

      // Mark as read
      const readRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            removeLabelIds: ['UNREAD'],
          }),
        }
      );

      if (!readRes.ok) {
        console.error('Failed to mark email as read');
      }

      // Archive if task is completed
      if (entity.status === 'done') {
        const archiveRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              removeLabelIds: ['INBOX'],
            }),
          }
        );

        if (!archiveRes.ok) {
          console.error('Failed to archive email');
        }
      }
    }

    // When task is deleted, restore email to unread
    if (action === 'delete' && entity.email_message_id) {
      const messageId = entity.email_message_id;

      await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            addLabelIds: ['UNREAD'],
          }),
        }
      );
    }

    return Response.json({ success: true, action });
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});