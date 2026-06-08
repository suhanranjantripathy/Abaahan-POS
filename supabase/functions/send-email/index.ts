import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { createSupabaseClients, getCurrentUserProfile } from '../_shared/supabase.ts';

const emailFrom = () => Deno.env.get('EMAIL_FROM') || 'testtrailattempt@gmail.com';

const sendViaResend = async ({ to, subject, html, text, attachments }) => {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: emailFrom(),
      to: [to],
      subject,
      html,
      text,
      attachments,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || 'Resend failed');
  return { provider: 'resend', id: body.id };
};

const sendViaPostmark = async ({ to, subject, html, text }) => {
  const token = Deno.env.get('POSTMARK_SERVER_TOKEN');
  if (!token) throw new Error('POSTMARK_SERVER_TOKEN is not configured');
  const response = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      'X-Postmark-Server-Token': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ From: emailFrom(), To: to, Subject: subject, HtmlBody: html, TextBody: text }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.Message || 'Postmark failed');
  return { provider: 'postmark', id: body.MessageID };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const authorization = req.headers.get('Authorization');
  const { userClient, adminClient } = createSupabaseClients(authorization);
  let logId = null;

  try {
    const payload = await req.json();
    const { to, subject, html, text, customerId, jobId, attachments = [] } = payload;
    if (!to || !subject || (!html && !text)) return jsonResponse({ error: 'to, subject, and body are required' }, 400);

    const { profile } = await getCurrentUserProfile(userClient);
    const { data: log } = await adminClient
      .from('email_logs')
      .insert({
        shop_id: profile.shop_id,
        customer_id: customerId || null,
        job_id: jobId || null,
        recipient: to,
        sender: emailFrom(),
        subject,
        status: 'queued',
      })
      .select()
      .single();
    logId = log?.id;

    const provider = Deno.env.get('EMAIL_PROVIDER') || 'resend';
    const result = provider === 'postmark'
      ? await sendViaPostmark({ to, subject, html, text })
      : await sendViaResend({ to, subject, html, text, attachments });

    if (logId) {
      await adminClient
        .from('email_logs')
        .update({ status: 'sent', provider: result.provider, provider_message_id: result.id, sent_at: new Date().toISOString() })
        .eq('id', logId);
    }

    return jsonResponse({ ok: true, provider: result.provider, id: result.id });
  } catch (error) {
    if (logId) {
      await adminClient.from('email_logs').update({ status: 'failed', error: error.message }).eq('id', logId);
    }
    return jsonResponse({ error: error.message || 'Unable to send email' }, 400);
  }
});
