import { isSupabaseEnabled, supabaseRequest } from './supabaseClient';

const mapReminderFromRow = (row) => ({
  id: row.id,
  shop_id: row.shop_id,
  customerId: row.customer_id,
  vehicleId: row.vehicle_id,
  jobId: row.job_id,
  type: row.type || 'follow_up',
  source: row.source || '',
  title: row.title || '',
  notes: row.notes || '',
  dueAt: row.due_at,
  assignedTo: row.assigned_to,
  status: row.status || 'open',
  completedAt: row.completed_at || '',
  customerName: row.customers?.name || '',
  customerMobile: row.customers?.mobile || '',
  vehicleLabel: row.vehicles?.make && row.vehicles?.model ? `${row.vehicles.make} ${row.vehicles.model}` : '',
});

const reminderToRow = (reminder) => ({
  shop_id: reminder.shop_id,
  customer_id: reminder.customerId || null,
  vehicle_id: reminder.vehicleId || null,
  job_id: reminder.jobId || null,
  type: reminder.type || 'follow_up',
  source: reminder.source || '',
  title: reminder.title || '',
  notes: reminder.notes || '',
  due_at: reminder.dueAt,
  assigned_to: reminder.assignedTo || null,
  status: reminder.status || 'open',
  completed_at: reminder.completedAt || null,
});

export const reminderRepository = {
  enabled: isSupabaseEnabled,

  async list() {
    const rows = await supabaseRequest('reminders', {
      query: '?select=*,customers(*),vehicles(*)&order=due_at.asc',
    });
    return rows.map(mapReminderFromRow);
  },

  async create(reminder) {
    const rows = await supabaseRequest('reminders', {
      method: 'POST',
      body: reminderToRow(reminder),
    });
    return mapReminderFromRow(rows[0]);
  },

  async update(reminder) {
    const rows = await supabaseRequest('reminders', {
      method: 'PATCH',
      query: `?id=eq.${reminder.id}`,
      body: reminderToRow(reminder),
    });
    return mapReminderFromRow(rows[0]);
  },
};
