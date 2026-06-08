import { isSupabaseEnabled, supabaseFunctionRequest } from './supabaseClient';

const createLocalToken = (customerId, mobile = '') => {
  const raw = `${customerId || 'walk-in'}:${mobile || ''}`;
  try {
    return btoa(raw).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  } catch {
    return encodeURIComponent(raw);
  }
};

export const portalService = {
  enabled: isSupabaseEnabled,

  async createLink({ customerId, customerMobile, jobId, expiresInDays = 30 }) {
    if (isSupabaseEnabled()) {
      return supabaseFunctionRequest('create-portal-link', { customerId, jobId, expiresInDays });
    }

    const token = createLocalToken(customerId, customerMobile);
    return {
      token,
      portalUrl: `${window.location.origin}/portal/${token}`,
      expiresAt: '',
      localFallback: true,
    };
  },

  async resolve(token) {
    if (isSupabaseEnabled()) {
      return supabaseFunctionRequest('resolve-portal-token', { token });
    }
    return null;
  },
};
