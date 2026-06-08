import { isSupabaseEnabled, supabaseRequest } from './supabaseClient';

const mapJobFromRow = (row) => {
  const snapshot = row.snapshot || {};
  const customer = snapshot.customer || {};
  const vehicle = snapshot.vehicle || {};

  return {
    id: row.id,
    customerId: row.customer_id || snapshot.customerId || null,
    customerName: snapshot.customerName || customer.name || 'Walk-in',
    customerMobile: snapshot.customerMobile || customer.mobile || '',
    vehicleId: row.vehicle_id || snapshot.vehicleId || null,
    vehicle: snapshot.vehicleLabel || (vehicle.make && vehicle.model ? `${vehicle.make} ${vehicle.model}` : 'Unknown'),
    vehicleYear: snapshot.vehicleYear || vehicle.year || '',
    vehicleFuelType: snapshot.vehicleFuelType || vehicle.fuelType || '',
    vehicleOdometer: snapshot.vehicleOdometer || vehicle.odometer || '',
    items: row.items || snapshot.estimate?.items || [],
    status: row.status || 'Pending',
    date: row.created_at,
    savedAt: row.updated_at,
    snapshot,
  };
};

const jobToRow = (job) => ({
  shop_id: job.shop_id,
  customer_id: job.customerId || null,
  vehicle_id: job.vehicleId || null,
  status: job.status || 'Pending',
  items: job.items || [],
  snapshot: {
    ...job.snapshot,
    customerId: job.customerId || null,
    customerName: job.customerName || 'Walk-in',
    customerMobile: job.customerMobile || '',
    vehicleId: job.vehicleId || null,
    vehicleLabel: job.vehicle || 'Unknown',
    vehicleYear: job.vehicleYear || '',
    vehicleFuelType: job.vehicleFuelType || '',
    vehicleOdometer: job.vehicleOdometer || '',
  },
});

export const jobRepository = {
  enabled: isSupabaseEnabled,

  async list() {
    const rows = await supabaseRequest('jobs', {
      query: '?select=*&order=created_at.desc',
    });
    return rows.map(mapJobFromRow);
  },

  async create(job) {
    const rows = await supabaseRequest('jobs', {
      method: 'POST',
      body: jobToRow(job),
    });
    return mapJobFromRow(rows[0]);
  },

  async update(job) {
    const rows = await supabaseRequest('jobs', {
      method: 'PATCH',
      query: `?id=eq.${job.id}`,
      body: jobToRow(job),
    });
    return mapJobFromRow(rows[0]);
  },
};
