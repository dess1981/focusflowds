import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query = 'is:unread label:INBOX', maxResults = 20 } = await req.json();

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection('6a2653358a1cda4730de81b3');

    const listResponse = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    if (!listResponse.ok) {
      throw new Error(`Gmail API error: ${listResponse.statusText}`);
    }

    const { messages = [] } = await listResponse.json();

    const messageDetails = await Promise.all(
      messages.map(async (msg) => {
        const detailRes = await fetch(
          `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        if (!detailRes.ok) return null;

        const detail = await detailRes.json();
        const headers = detail.payload?.headers || [];
        
        return {
          id: msg.id,
          threadId: detail.threadId,
          subject: headers.find(h => h.name === 'Subject')?.value || '(Sem assunto)',
          from: headers.find(h => h.name === 'From')?.value || '(Desconhecido)',
          date: headers.find(h => h.name === 'Date')?.value,
          snippet: detail.snippet || '',
          labels: detail.labelIds || [],
        };
      })
    );

    return Response.json({
      messages: messageDetails.filter(m => m !== null)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});