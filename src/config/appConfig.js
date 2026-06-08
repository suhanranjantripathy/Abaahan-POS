export const APP_BRAND = {
  name: import.meta.env.VITE_APP_NAME || 'Abahaan',
  posName: import.meta.env.VITE_APP_POS_NAME || 'Abahaan POS',
};

export const STORAGE_KEYS = {
  customers: 'abhyaan_customers_db',
  inspectionLogs: 'abhyaan_inspection_logs',
  savedReports: 'abhyaan_saved_reports',
  reminders: 'abhyaan_reminders',
  employees: 'abhyaan_employees',
  rewardRules: 'abhyaan_reward_rules',
  serviceCatalog: 'abhyaan_service_catalog',
  session: 'abhyaan_session',
};

export const DEFAULT_REWARD_RULES = {
  purchasePoints: 1,
  purchaseAmount: 100,
  referralBonus: 500,
  redemptionValue: 1,
};

export const EXTERNAL_SERVICES = {
  employeeAuthUrl: import.meta.env.VITE_EMPLOYEE_AUTH_URL || 'https://script.google.com/macros/s/AKfycbwaABq2wQffYVwKjq3MzpPweySrd_RwhtMxXv1j-1wo1y4tcYFtDVdbZGS-tONiZLdy/exec',
  razorpayScriptUrl: import.meta.env.VITE_RAZORPAY_SCRIPT_URL || 'https://checkout.razorpay.com/v1/checkout.js',
  razorpayKey: import.meta.env.VITE_RAZORPAY_KEY || '',
  emailFrom: import.meta.env.VITE_EMAIL_FROM || 'testtrailattempt@gmail.com',
};

export const BACKEND_CONFIG = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  apiToken: import.meta.env.VITE_API_TOKEN || '',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  mode: import.meta.env.VITE_DATA_BACKEND || 'local',
};

export const DEFAULT_SERVICE_CATALOG = {
  tyreReplacement: 6500,
  tyreRotation: 800,
  batteryReplacement: 4200,
  generalService: 1500,
  inventory: {
    tyres: [
      { id: 't1', name: 'CEAT Milaze X3', category: 'Good', price: 4200, warranty: '3 Years', tags: ['High Life'] },
      { id: 't2', name: 'Apollo Alnac 4G', category: 'Better', price: 5500, warranty: '4 Years', tags: ['Comfort', 'Grip'] },
      { id: 't3', name: 'Michelin Primacy 4 ST', category: 'Best', price: 7800, warranty: '5 Years', tags: ['Premium', 'Silent'] },
    ],
    services: [
      { id: 's1', name: 'Wheel Alignment', price: 450 },
      { id: 's2', name: 'Wheel Balancing (per wheel)', price: 150 },
      { id: 's3', name: 'General Service', price: 2999 },
      { id: 's4', name: 'Battery Replacement', price: 4500 },
    ]
  }
};
