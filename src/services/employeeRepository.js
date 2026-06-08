import { isSupabaseEnabled, supabase, supabaseFunctionRequest } from './supabaseClient';

const normalizeEmployee = (row) => ({
  id: row.id,
  shop_id: row.shop_id,
  name: row.name || '',
  email: row.email || row.auth_users?.email || '',
  mobile: row.mobile || '',
  role: row.role || 'POS Executive',
  createdAt: row.created_at || new Date().toISOString(),
});

export const employeeRepository = {
  enabled: isSupabaseEnabled,

  async list() {
    if (!supabase) {
      throw new Error('Supabase is not configured. Set VITE_DATA_BACKEND=supabase, VITE_SUPABASE_URL, and VITE_SUPABASE_ANON_KEY.');
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(normalizeEmployee);
  },

  async create(employee) {
    const payload = await supabaseFunctionRequest('create-employee', employee);
    return normalizeEmployee(payload.employee);
  },
};
