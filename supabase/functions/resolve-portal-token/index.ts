import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { hashToken } from '../_shared/crypto.ts';
import { createSupabaseClients } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const { token } = await req.json();
    if (!token) return jsonResponse({ error: 'token is required' }, 400);

    const { adminClient } = createSupabaseClients(null);
    const tokenHash = await hashToken(token);
    const { data: portalToken, error } = await adminClient
      .from('portal_tokens')
      .select('*, customers(*), jobs(*)')
      .eq('token_hash', tokenHash)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !portalToken) return jsonResponse({ error: 'Invalid or expired portal link' }, 404);

    return jsonResponse({
      customer: portalToken.customers,
      job: portalToken.jobs,
      expiresAt: portalToken.expires_at,
    });
  } catch (error) {
    return jsonResponse({ error: error.message || 'Unable to resolve portal token' }, 400);
  }
});
