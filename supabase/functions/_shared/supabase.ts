import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';

export const createSupabaseClients = (authorization: string | null) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new Error('Supabase Edge Function secrets are not configured');
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: authorization ? { Authorization: authorization } : {} },
  });

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  return { userClient, adminClient };
};

export const getCurrentUserProfile = async (userClient: ReturnType<typeof createClient>) => {
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) throw new Error('Unauthorized');

  const { data: profile, error: profileError } = await userClient
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) throw new Error('Profile not found');
  return { authUser: authData.user, profile };
};
