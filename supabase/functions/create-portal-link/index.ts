import { getCorsHeaders, jsonResponse } from '../_shared/cors.ts';
import { hashToken, randomToken } from '../_shared/crypto.ts';
import { createSupabaseClients, getCurrentUserProfile } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: getCorsHeaders(req) });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, req);

  try {
    const { customerId, jobId, expiresInDays = 30 } = await req.json();
    if (!customerId && !jobId) return jsonResponse({ error: 'customerId or jobId is required' }, 400, req);

    const authorization = req.headers.get('Authorization');
    const { userClient, adminClient } = createSupabaseClients(authorization);
    const { authUser, profile } = await getCurrentUserProfile(userClient);

    const token = randomToken();
    const tokenHash = await hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(expiresInDays || 30));

    const { data, error } = await adminClient
      .from('portal_tokens')
      .insert({
        shop_id: profile.shop_id,
        customer_id: customerId || null,
        job_id: jobId || null,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        created_by: authUser.id,
      })
      .select()
      .single();

    if (error) throw error;

    const appOrigin = Deno.env.get('APP_ORIGIN') || 'https://abaahanpos.netlify.app';
    return jsonResponse({
      token,
      portalUrl: `${appOrigin.replace(/\/$/, '')}/portal/${token}`,
      expiresAt: data.expires_at,
    }, 200, req);
  } catch (error) {
    console.error('create-portal-link failed', error);
    return jsonResponse({ error: 'Unable to create portal link' }, 400, req);
  }
});
