import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, messageIds = [], label } = await req.json();

    if (!messageIds || messageIds.length === 0) {
      return Response.json({ error: 'No message IDs provided' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection('6a2653358a1cda4730de81b3');

    const results = [];

    for (const messageId of messageIds) {
      try {
        let labelIds = [];
        let removeLabelIds = [];

        // Map actions to Gmail labels
        if (action === 'spam') {
          labelIds = ['SPAM'];
          removeLabelIds = ['INBOX', 'UNREAD'];
        } else if (action === 'delete') {
          labelIds = ['TRASH'];
          removeLabelIds = ['INBOX'];
        } else if (action === 'archive') {
          removeLabelIds = ['INBOX'];
        } else if (action === 'read') {
          removeLabelIds = ['UNREAD'];
        } else if (action === 'label') {
          // Move to custom label
          labelIds = [label];
          removeLabelIds = ['INBOX'];
        }

        const modifyRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              addLabelIds: labelIds,
              removeLabelIds: removeLabelIds,
            }),
          }
        );

        if (modifyRes.ok) {
          results.push({ messageId, success: true, action });
        } else {
          results.push({ messageId, success: false, error: 'Failed to modify' });
        }
      } catch (error) {
        results.push({ messageId, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    return Response.json({
      success: true,
      action,
      processed: results.length,
      successful: successCount,
      failed: results.length - successCount,
      results,
    });
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});