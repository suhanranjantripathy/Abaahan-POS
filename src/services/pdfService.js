import { isSupabaseEnabled, supabaseFunctionRequest } from './supabaseClient';

export const pdfService = {
  async generate({ jobId, report }) {
    if (isSupabaseEnabled()) {
      return supabaseFunctionRequest('generate-report-pdf', { jobId, report });
    }
    return null;
  },
};
