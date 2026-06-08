import { EXTERNAL_SERVICES } from '../config/appConfig';
import { isSupabaseEnabled, supabaseFunctionRequest } from './supabaseClient';

export const emailService = {
  async send({ to, subject, html, text, customerId, jobId, attachments }) {
    if (isSupabaseEnabled()) {
      return supabaseFunctionRequest('send-email', {
        to,
        subject,
        html,
        text,
        customerId,
        jobId,
        attachments,
      });
    }

    const body = encodeURIComponent(text || html?.replace(/<[^>]+>/g, '') || '');
    window.location.href = `mailto:${to || ''}?subject=${encodeURIComponent(subject)}&body=${body}&from=${encodeURIComponent(EXTERNAL_SERVICES.emailFrom)}`;
    return { ok: true, localFallback: true };
  },
};
