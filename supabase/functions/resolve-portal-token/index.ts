import { getCorsHeaders, jsonResponse } from '../_shared/cors.ts';
import { hashToken } from '../_shared/crypto.ts';
import { createSupabaseClients } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: getCorsHeaders(req) });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, req);

  try {
    const { token } = await req.json();
    if (!token) return jsonResponse({ error: 'token is required' }, 400, req);

    const { adminClient } = createSupabaseClients(null);
    const tokenHash = await hashToken(token);
    const { data: portalToken, error } = await adminClient
      .from('portal_tokens')
      .select('*, customers(*), jobs(*)')
      .eq('token_hash', tokenHash)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !portalToken) return jsonResponse({ error: 'Invalid or expired portal link' }, 404, req);

    return jsonResponse({
      customer: portalToken.customers,
      job: portalToken.jobs,
      expiresAt: portalToken.expires_at,
    }, 200, req);
  } catch (error) {
    console.error('resolve-portal-token failed', error);
    return jsonResponse({ error: 'Unable to resolve portal token' }, 400, req);
  }
});
