import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { query = '' } = await req.json();

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    const q = query.trim()
      ? `name contains '${query.replace(/'/g, "\\'")}' and trashed = false`
      : `trashed = false and 'me' in owners`;

    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('q', q);
    url.searchParams.set('fields', 'files(id,name,mimeType,webViewLink,iconLink,modifiedTime,owners)');
    url.searchParams.set('pageSize', '20');
    url.searchParams.set('orderBy', 'modifiedTime desc');

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.json();
      return Response.json({ error: err.error?.message || 'Drive API error' }, { status: res.status });
    }

    const data = await res.json();

    const files = (data.files || []).map(f => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      webViewLink: f.webViewLink,
      iconLink: f.iconLink,
      modifiedTime: f.modifiedTime,
    }));

    return Response.json({ files });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});