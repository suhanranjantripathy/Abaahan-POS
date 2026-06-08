const encoder = new TextEncoder();

export const randomToken = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
};

export const hashToken = async (token: string) => {
  const secret = Deno.env.get('PORTAL_TOKEN_SECRET') || '';
  if (!secret) throw new Error('PORTAL_TOKEN_SECRET is not configured');
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`${secret}:${token}`));
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
};
