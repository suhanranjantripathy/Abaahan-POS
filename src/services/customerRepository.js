import { isSupabaseEnabled, supabaseRequest } from './supabaseClient';

const mapVehicleFromRow = (row) => ({
  id: row.id,
  make: row.make || '',
  model: row.model || '',
  year: row.year || '',
  fuelType: row.fuel_type || '',
  odometer: row.odometer || '',
});

const mapCustomerFromRow = (row) => ({
  id: row.id,
  name: row.name || '',
  mobile: row.mobile || '',
  city: row.city || '',
  email: row.email || '',
  dob: row.dob || '',
  consent: row.consent ?? true,
  loyalty: row.loyalty || 0,
  nextReminder: row.next_reminder || '',
  lastVisit: row.last_visit || row.updated_at || row.created_at,
  vehicles: (row.vehicles || []).map(mapVehicleFromRow),
  pastInspections: [],
  purchaseHistory: [],
  pendingRecommendations: [],
});

const customerToRow = (customer) => ({
  shop_id: customer.shop_id,
  name: customer.name,
  mobile: customer.mobile,
  city: customer.city || '',
  email: customer.email || '',
  dob: customer.dob || null,
  consent: customer.consent ?? true,
  loyalty: customer.loyalty || 0,
  next_reminder: customer.nextReminder || null,
  last_visit: customer.lastVisit || new Date().toISOString(),
});

const vehicleToRow = (customerId, vehicle) => ({
  shop_id: vehicle.shop_id,
  customer_id: customerId,
  make: vehicle.make || '',
  model: vehicle.model || '',
  year: vehicle.year || '',
  fuel_type: vehicle.fuelType || '',
  odometer: vehicle.odometer || '',
});

export const customerRepository = {
  enabled: isSupabaseEnabled,

  async list() {
    const rows = await supabaseRequest('customers', {
      query: '?select=*,vehicles(*)&order=last_visit.desc',
    });
    return rows.map(mapCustomerFromRow);
  },

  async create(customer) {
    const rows = await supabaseRequest('customers', {
      method: 'POST',
      body: customerToRow(customer),
    });
    return mapCustomerFromRow(rows[0]);
  },

  async update(customer) {
    const rows = await supabaseRequest('customers', {
      method: 'PATCH',
      query: `?id=eq.${customer.id}`,
      body: customerToRow(customer),
    });
    return mapCustomerFromRow({ ...rows[0], vehicles: customer.vehicles || [] });
  },

  async addVehicle(customerId, vehicle) {
    const rows = await supabaseRequest('vehicles', {
      method: 'POST',
      body: vehicleToRow(customerId, vehicle),
    });
    return mapVehicleFromRow(rows[0]);
  },
};
