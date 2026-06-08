const normalizeOrigin = (origin = '') => origin.replace(/\/$/, '');

const allowedOrigins = [
  normalizeOrigin(Deno.env.get('APP_ORIGIN') || 'https://abaahanpos.netlify.app'),
  'http://localhost:5173',
];

export const getCorsHeaders = (req?: Request) => {
  const requestOrigin = normalizeOrigin(req?.headers.get('Origin') || '');
  const origin = allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
};

export const corsHeaders = getCorsHeaders();

export const jsonResponse = (body: unknown, status = 200, req?: Request) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  });
