import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { createPdfBytes } from '../_shared/pdf.ts';
import { createSupabaseClients, getCurrentUserProfile } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const { jobId, report } = await req.json();
    const authorization = req.headers.get('Authorization');
    const { userClient, adminClient } = createSupabaseClients(authorization);
    const { profile } = await getCurrentUserProfile(userClient);

    let job = report;
    if (jobId) {
      const { data, error } = await userClient.from('jobs').select('*').eq('id', jobId).single();
      if (error) throw error;
      job = data;
    }
    if (!job) return jsonResponse({ error: 'jobId or report payload required' }, 400);

    const snapshot = job.snapshot || {};
    const estimate = snapshot.estimate || {};
    const inspection = snapshot.inspectionData || {};
    const lines = [
      `Report ID: ${job.id || jobId}`,
      `Customer: ${snapshot.customerName || job.customerName || ''}`,
      `Vehicle: ${snapshot.vehicleLabel || job.vehicle || ''}`,
      '',
      'Tyres',
      ...Object.entries(inspection.tyres || {}).map(([pos, tyre]) => `${pos}: ${tyre.brand || ''} ${tyre.size || ''} ${tyre.tread || 'N/A'}mm ${tyre.pressure || 'N/A'}PSI ${tyre.condition || ''}`),
      '',
      'Recommendations',
      ...(snapshot.recommendations || []).map((rec) => `${rec.status}: ${rec.text}`),
      '',
      'Items',
      ...(estimate.items || []).map((item) => `${item.name} x${item.qty || 1} Rs.${(item.price || 0) * (item.qty || 1)}`),
    ];

    const pdfBytes = createPdfBytes('Abahaan Vehicle Health Report', lines);
    const filePath = `${profile.shop_id}/${job.id || crypto.randomUUID()}.pdf`;
    const { error: uploadError } = await adminClient.storage
      .from('reports')
      .upload(filePath, pdfBytes, { contentType: 'application/pdf', upsert: true });
    if (uploadError) throw uploadError;

    const { data: publicUrl } = adminClient.storage.from('reports').getPublicUrl(filePath);
    return jsonResponse({ ok: true, path: filePath, pdfUrl: publicUrl.publicUrl });
  } catch (error) {
    return jsonResponse({ error: error.message || 'Unable to generate PDF' }, 400);
  }
});
