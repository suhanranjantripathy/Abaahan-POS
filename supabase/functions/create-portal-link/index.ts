import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { hashToken, randomToken } from '../_shared/crypto.ts';
import { createSupabaseClients, getCurrentUserProfile } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const { customerId, jobId, expiresInDays = 30 } = await req.json();
    if (!customerId && !jobId) return jsonResponse({ error: 'customerId or jobId is required' }, 400);

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

    const appOrigin = req.headers.get('Origin') || Deno.env.get('APP_ORIGIN') || '';
    return jsonResponse({
      token,
      portalUrl: `${appOrigin.replace(/\/$/, '')}/portal/${token}`,
      expiresAt: data.expires_at,
    });
  } catch (error) {
    return jsonResponse({ error: error.message || 'Unable to create portal link' }, 400);
  }
});
