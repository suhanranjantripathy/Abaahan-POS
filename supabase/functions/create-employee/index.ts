import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { createSupabaseClients, getCurrentUserProfile } from '../_shared/supabase.ts';

const allowedRoles = ['Store Manager', 'POS Executive', 'Technician'];

const insertEmployeeProfile = async (
  adminClient: ReturnType<typeof createSupabaseClients>['adminClient'],
  profile: { shop_id: string },
  authUserId: string,
  employee: { role: string; name: string; email: string; mobile: string },
) => {
  const baseProfile = {
    id: authUserId,
    shop_id: profile.shop_id,
    role: employee.role,
    name: employee.name,
    mobile: employee.mobile,
  };

  const { data, error } = await adminClient
    .from('users')
    .insert({ ...baseProfile, email: employee.email })
    .select()
    .single();

  if (!error) return data;

  const missingEmailColumn = /'email' column of 'users'|column users\.email does not exist/i.test(error.message || '');
  if (!missingEmailColumn) throw error;

  const { data: fallbackData, error: fallbackError } = await adminClient
    .from('users')
    .insert(baseProfile)
    .select()
    .single();

  if (fallbackError) throw fallbackError;
  return fallbackData;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const authorization = req.headers.get('Authorization');
  const { userClient, adminClient } = createSupabaseClients(authorization);

  try {
    const { profile } = await getCurrentUserProfile(userClient);
    if (profile.role !== 'Store Manager') {
      return jsonResponse({ error: 'Only Store Managers can add employees' }, 403);
    }

    const payload = await req.json();
    const name = String(payload.name || '').trim();
    const email = String(payload.email || '').trim().toLowerCase();
    const mobile = String(payload.mobile || '').trim();
    const role = allowedRoles.includes(payload.role) ? payload.role : 'POS Executive';
    const password = String(payload.password || '');

    if (!name || !email || !password) {
      return jsonResponse({ error: 'Name, email, and temporary password are required' }, 400);
    }
    if (password.length < 6) {
      return jsonResponse({ error: 'Temporary password must be at least 6 characters' }, 400);
    }

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
        shop_id: profile.shop_id,
      },
    });
    if (authError) throw authError;

    const authUser = authData.user;
    let employee;
    try {
      employee = await insertEmployeeProfile(adminClient, profile, authUser.id, {
        role,
        name,
        email,
        mobile,
      });
    } catch (profileError) {
      await adminClient.auth.admin.deleteUser(authUser.id).catch(() => {});
      throw profileError;
    }

    return jsonResponse({ ok: true, employee: { ...employee, email } });
  } catch (error) {
    return jsonResponse({ error: error.message || 'Unable to create employee' }, 400);
  }
});
