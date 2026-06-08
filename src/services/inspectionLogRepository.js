import { isSupabaseEnabled, supabaseRequest } from './supabaseClient';

const mapLogFromRow = (row) => {
  const customer = row.customers || {};
  const vehicle = row.vehicles || {};

  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: customer.name || '',
    customerMobile: customer.mobile || '',
    customerCity: customer.city || '',
    customerEmail: customer.email || '',
    customerConsent: customer.consent ?? true,
    vehicleId: row.vehicle_id,
    vehicleLabel: vehicle.make && vehicle.model ? `${vehicle.make} ${vehicle.model}` : '',
    vehicleYear: vehicle.year || '',
    vehicleFuelType: vehicle.fuel_type || '',
    vehicleOdometer: vehicle.odometer || '',
    status: row.status || 'pending',
    requestedBy: row.requested_by || '',
    requestedByRole: row.requested_by_role || '',
    requestedAt: row.requested_at || row.created_at,
    startedAt: row.started_at || '',
    completedAt: row.completed_at || '',
    technicianName: row.technician_name || '',
  };
};

const logToRow = (log) => ({
  shop_id: log.shop_id,
  customer_id: log.customerId || null,
  vehicle_id: log.vehicleId || null,
  status: log.status || 'pending',
  requested_by: log.requestedBy || '',
  requested_by_role: log.requestedByRole || '',
  technician_name: log.technicianName || '',
  requested_at: log.requestedAt || new Date().toISOString(),
  started_at: log.startedAt || null,
  completed_at: log.completedAt || null,
});

export const inspectionLogRepository = {
  enabled: isSupabaseEnabled,

  async list() {
    const rows = await supabaseRequest('inspection_logs', {
      query: '?select=*,customers(*),vehicles(*)&order=requested_at.desc',
    });
    return rows.map(mapLogFromRow);
  },

  async create(log) {
    const rows = await supabaseRequest('inspection_logs', {
      method: 'POST',
      body: logToRow(log),
    });
    return mapLogFromRow(rows[0]);
  },

  async update(log) {
    const rows = await supabaseRequest('inspection_logs', {
      method: 'PATCH',
      query: `?id=eq.${log.id}`,
      body: logToRow(log),
    });
    return mapLogFromRow({ ...rows[0], customers: {}, vehicles: {} });
  },
};
