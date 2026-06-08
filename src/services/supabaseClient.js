import { createClient } from '@supabase/supabase-js';
import { BACKEND_CONFIG } from '../config/appConfig';

export const isSupabaseEnabled = () => (
  BACKEND_CONFIG.mode === 'supabase' &&
  Boolean(BACKEND_CONFIG.supabaseUrl) &&
  Boolean(BACKEND_CONFIG.supabaseAnonKey)
);

export const supabase = isSupabaseEnabled()
  ? createClient(BACKEND_CONFIG.supabaseUrl, BACKEND_CONFIG.supabaseAnonKey)
  : null;

// Kept for backward compatibility with existing repos before full refactor.
// In the future, repositories will use `supabase.from()` directly.
export const supabaseRequest = async (table, options = {}) => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Set VITE_DATA_BACKEND=supabase, VITE_SUPABASE_URL, and VITE_SUPABASE_ANON_KEY.');
  }

  const { query = '', method = 'GET', body, headers = {} } = options;
  const baseUrl = BACKEND_CONFIG.supabaseUrl.replace(/\/$/, '');
  const cleanTable = table.replace(/^\//, '');
  const url = `${baseUrl}/rest/v1/${cleanTable}${query}`;

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || BACKEND_CONFIG.supabaseAnonKey;

  const shouldReturnRepresentation = method === 'POST' || method === 'PATCH';

  const response = await fetch(url, {
    method,
    headers: {
      apikey: BACKEND_CONFIG.supabaseAnonKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(shouldReturnRepresentation ? { Prefer: 'return=representation' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Supabase request failed with status ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
};

export const supabaseFunctionRequest = async (functionName, body = {}) => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Set VITE_DATA_BACKEND=supabase, VITE_SUPABASE_URL, and VITE_SUPABASE_ANON_KEY.');
  }

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || BACKEND_CONFIG.supabaseAnonKey;
  let response;
  try {
    response = await fetch(`${BACKEND_CONFIG.supabaseUrl.replace(/\/$/, '')}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        apikey: BACKEND_CONFIG.supabaseAnonKey,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    const message = error instanceof TypeError && error.message === 'Failed to fetch'
      ? `Supabase Edge Function "${functionName}" could not be reached. Deploy it with "supabase functions deploy ${functionName}" and confirm the project URL in VITE_SUPABASE_URL.`
      : error.message || `Function ${functionName} could not be reached.`;
    throw new Error(message);
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const notFoundMessage = response.status === 404
      ? `Supabase Edge Function "${functionName}" is not deployed. Run "supabase functions deploy ${functionName}" for this Supabase project.`
      : '';
    throw new Error(payload.error || payload.message || notFoundMessage || `Function ${functionName} failed with status ${response.status}`);
  }
  return payload;
};
