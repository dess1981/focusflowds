import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { criteria } = await req.json();

    if (!criteria) {
      return Response.json({ error: 'Criteria required' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection('6a2653358a1cda4730de81b3');

    // Search for emails matching criteria
    const searchParams = new URLSearchParams({
      q: criteria,
      maxResults: 20,
    });

    const searchRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?${searchParams}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!searchRes.ok) {
      return Response.json({ error: 'Failed to search emails' }, { status: 500 });
    }

    const searchData = await searchRes.json();
    const messageIds = searchData.messages?.map(m => m.id) || [];

    // Fetch details for each email
    const emails = [];
    for (const messageId of messageIds) {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=minimal`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (msgRes.ok) {
        const message = await msgRes.json();
        const headers = message.payload?.headers || [];
        const getHeader = (name) => headers.find(h => h.name === name)?.value || '';

        emails.push({
          id: messageId,
          from: getHeader('From'),
          subject: getHeader('Subject'),
          date: getHeader('Date'),
          snippet: message.snippet,
        });
      }
    }

    return Response.json({
      success: true,
      criteria,
      found: emails.length,
      emails,
      messageIds,
    });
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});