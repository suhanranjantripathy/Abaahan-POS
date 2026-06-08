/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_REWARD_RULES, DEFAULT_SERVICE_CATALOG, STORAGE_KEYS } from '../config/appConfig';
import { customerRepository } from '../services/customerRepository';
import { inspectionLogRepository } from '../services/inspectionLogRepository';
import { jobRepository } from '../services/jobRepository';
import { loyaltyRepository } from '../services/loyaltyRepository';
import { reminderRepository } from '../services/reminderRepository';
import { employeeRepository } from '../services/employeeRepository';
import { supabase, isSupabaseEnabled } from '../services/supabaseClient';

export const AuthContext = createContext();
export const DataContext = createContext();
export const WorkflowContext = createContext();

export const useAuth = () => useContext(AuthContext);
export const useData = () => useContext(DataContext);
export const useWorkflow = () => useContext(WorkflowContext);

const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

const createInitialInspectionData = () => ({
  tyres: {
    FL: { brand: '', size: '', pressure: '', tread: '', condition: 'good', fitmentType: '' },
    FR: { brand: '', size: '', pressure: '', tread: '', condition: 'good', fitmentType: '' },
    RL: { brand: '', size: '', pressure: '', tread: '', condition: 'good', fitmentType: '' },
    RR: { brand: '', size: '', pressure: '', tread: '', condition: 'good', fitmentType: '' },
    Spare: { brand: '', size: '', pressure: '', tread: '', condition: 'good', fitmentType: '' }
  },
  battery: { brand: '', model: '', health: 'good', healthPercentage: '', age: '', chargingStatus: '', status: '' },
  usage: { monthlyKm: '', drivingStyle: 'normal', terrain: '' }
});

const seedCustomers = [
  {
    id: 1, name: 'John Doe', mobile: '9876543210', city: 'Mumbai', consent: true, email: 'john@example.com', dob: '1990-01-01',
    vehicles: [{ id: 'VEH-SEED-1', make: 'Honda', model: 'City', year: '2020', fuelType: 'Petrol', odometer: '45000' }],
    pastInspections: [], purchaseHistory: [], pendingRecommendations: [], loyalty: 150,
    lastVisit: SEVEN_DAYS_AGO,
  }
];

const loadStoredArray = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    console.error(`Error loading ${key} from localStorage`, e);
    return fallback;
  }
};

const saveSharedArray = (key, value) => {
  const nextValue = JSON.stringify(value);
  if (localStorage.getItem(key) !== nextValue) {
    localStorage.setItem(key, nextValue);
  }
};

const createLocalInspectionId = () => `INS-${Date.now().toString().slice(-6)}`;

const cloneData = (value) => JSON.parse(JSON.stringify(value));

const createPortalToken = (customerId, mobile = '') => {
  const raw = `${customerId || 'walk-in'}:${mobile || ''}`;
  try {
    return btoa(raw).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  } catch {
    return encodeURIComponent(raw);
  }
};

const addYears = (date, warranty = '') => {
  const years = Number.parseInt(String(warranty).match(/\d+/)?.[0] || '0', 10);
  if (!years) return '';
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next.toISOString();
};

const buildWarrantyRecords = (items = [], serialDetails = {}, invoiceDate = new Date().toISOString()) => {
  return items
    .filter(item => item.warranty || /tyre|battery/i.test(item.name || ''))
    .flatMap(item => {
      const serials = serialDetails[item.id] || [];
      return Array.from({ length: item.qty || 1 }, (_, index) => ({
        itemId: item.id,
        itemName: item.name,
        serialNumber: serials[index] || '',
        warranty: item.warranty || 'Standard Warranty',
        warrantyStart: invoiceDate,
        warrantyEnd: addYears(invoiceDate, item.warranty),
      }));
    });
};

const mergePersistedInspectionLog = (draft, persisted) => ({
  ...draft,
  ...persisted,
  customerName: persisted.customerName || draft.customerName,
  customerMobile: persisted.customerMobile || draft.customerMobile,
  customerCity: persisted.customerCity || draft.customerCity,
  customerEmail: persisted.customerEmail || draft.customerEmail,
  customerConsent: persisted.customerConsent ?? draft.customerConsent,
  vehicleLabel: persisted.vehicleLabel || draft.vehicleLabel,
  vehicleYear: persisted.vehicleYear || draft.vehicleYear,
  vehicleFuelType: persisted.vehicleFuelType || draft.vehicleFuelType,
  vehicleOdometer: persisted.vehicleOdometer || draft.vehicleOdometer,
});

const loadRewardRules = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.rewardRules);
    return saved ? { ...DEFAULT_REWARD_RULES, ...JSON.parse(saved) } : DEFAULT_REWARD_RULES;
  } catch (e) {
    console.error("Error loading reward rules from localStorage", e);
    return DEFAULT_REWARD_RULES;
  }
};

const loadServiceCatalog = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.serviceCatalog);
    return saved ? { ...DEFAULT_SERVICE_CATALOG, ...JSON.parse(saved) } : DEFAULT_SERVICE_CATALOG;
  } catch (e) {
    console.error("Error loading service catalog from localStorage", e);
    return DEFAULT_SERVICE_CATALOG;
  }
};

// Exported hooks are above

export const AppProvider = ({ children }) => {
  const useRemoteData = customerRepository.enabled();
  const [user, setUser] = useState(() => {
    const savedSession = sessionStorage.getItem(STORAGE_KEYS.session);
    if (savedSession) {
      try {
        const { user, loginTime } = JSON.parse(savedSession);
        const hoursPassed = (Date.now() - loginTime) / (1000 * 60 * 60);
        if (hoursPassed < 24) {
          return user;
        } else {
          sessionStorage.removeItem(STORAGE_KEYS.session);
        }
      } catch (e) {
        console.error("Error loading session from sessionStorage", e);
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(useRemoteData);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [currentVehicle, setCurrentVehicle] = useState(null);
  const [inspectionCompleted, setInspectionCompleted] = useState(false);
  const [inspectionData, setInspectionData] = useState(createInitialInspectionData);
  const [recommendations, setRecommendations] = useState([]);
  const [estimate, setEstimate] = useState({ items: [], consent: null, isPaid: false, managerApproved: false });
  const [jobsDb, setJobsDb] = useState(() => loadStoredArray(STORAGE_KEYS.savedReports, []));
  const [remindersDb, setRemindersDb] = useState(() => loadStoredArray(STORAGE_KEYS.reminders, []));
  const [employeesDb, setEmployeesDb] = useState(() => loadStoredArray(STORAGE_KEYS.employees, []));
  const [activeJobId, setActiveJobId] = useState(null);
  const [inspectionLogs, setInspectionLogs] = useState(() => loadStoredArray(STORAGE_KEYS.inspectionLogs, []));
  const [activeInspectionLogId, setActiveInspectionLogId] = useState(null);
  const [rewardRules, setRewardRules] = useState(loadRewardRules);
  const [serviceCatalog, setServiceCatalog] = useState(loadServiceCatalog);

  // mock customer DB
  const [customersDb, setCustomersDb] = useState(() => loadStoredArray(STORAGE_KEYS.customers, seedCustomers));

  useEffect(() => {
    if (!useRemoteData) saveSharedArray(STORAGE_KEYS.customers, customersDb);
  }, [customersDb, useRemoteData]);

  useEffect(() => {
    if (!useRemoteData) saveSharedArray(STORAGE_KEYS.inspectionLogs, inspectionLogs);
  }, [inspectionLogs, useRemoteData]);

  useEffect(() => {
    if (!useRemoteData) saveSharedArray(STORAGE_KEYS.savedReports, jobsDb);
  }, [jobsDb, useRemoteData]);

  useEffect(() => {
    if (!useRemoteData) saveSharedArray(STORAGE_KEYS.reminders, remindersDb);
  }, [remindersDb, useRemoteData]);

  useEffect(() => {
    if (!useRemoteData) saveSharedArray(STORAGE_KEYS.employees, employeesDb);
  }, [employeesDb, useRemoteData]);

  useEffect(() => {
    if (!useRemoteData) return;

    let cancelled = false;
    const loadRemoteData = async () => {
      try {
        setIsLoading(true);
        const [customers, logs, jobs, rules, reminders] = await Promise.all([
          customerRepository.list(),
          inspectionLogRepository.list(),
          jobRepository.list(),
          loyaltyRepository.getRules(),
          reminderRepository.list(),
        ]);

        if (cancelled) return;
        setCustomersDb(customers);
        setInspectionLogs(logs);
        setJobsDb(jobs);
        setRewardRules(rules);
        setRemindersDb(reminders);
      } catch (e) {
        console.error('Error loading Supabase data', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadRemoteData();

    // Lightweight polling to simulate Supabase Realtime without requiring the websocket SDK
    const pollInterval = setInterval(async () => {
      try {
        const [logs, jobs, reminders] = await Promise.all([
          inspectionLogRepository.list(),
          jobRepository.list(),
          reminderRepository.list(),
        ]);
        if (!cancelled) {
          setInspectionLogs(logs);
          setJobsDb(jobs);
          setRemindersDb(reminders);
        }
      } catch { /* ignore polling errors */ }
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
  }, [useRemoteData]);

  useEffect(() => {
    if (useRemoteData) return undefined;

    const handleSharedStorage = (event) => {
      if (!event.newValue) return;

      try {
        if (event.key === STORAGE_KEYS.customers) {
          setCustomersDb(prev => JSON.stringify(prev) === event.newValue ? prev : JSON.parse(event.newValue));
        }

        if (event.key === STORAGE_KEYS.inspectionLogs) {
          setInspectionLogs(prev => JSON.stringify(prev) === event.newValue ? prev : JSON.parse(event.newValue));
        }

        if (event.key === STORAGE_KEYS.savedReports) {
          setJobsDb(prev => JSON.stringify(prev) === event.newValue ? prev : JSON.parse(event.newValue));
        }

        if (event.key === STORAGE_KEYS.reminders) {
          setRemindersDb(prev => JSON.stringify(prev) === event.newValue ? prev : JSON.parse(event.newValue));
        }

        if (event.key === STORAGE_KEYS.employees) {
          setEmployeesDb(prev => JSON.stringify(prev) === event.newValue ? prev : JSON.parse(event.newValue));
        }
      } catch (e) {
        console.error("Error syncing shared app data from localStorage", e);
      }
    };

    window.addEventListener('storage', handleSharedStorage);
    return () => window.removeEventListener('storage', handleSharedStorage);
  }, [useRemoteData]);

  const login = (userData) => {
    let resolvedUser;
    if (typeof userData === 'string') {
      resolvedUser = { role: userData, name: userData === 'Store Manager' ? 'Manager Mike' : userData === 'Technician' ? 'Tech Tom' : 'Exec Emma' };
    } else {
      // Normalize role from Google Sheet so the Dashboard tiles appear correctly
      let normalizedRole = 'POS Executive';
      const rawRole = (userData.role || '').toLowerCase();
      
      if (rawRole.includes('manager')) normalizedRole = 'Store Manager';
      else if (rawRole.includes('tech')) normalizedRole = 'Technician';
      
      resolvedUser = {
        id: userData.id,
        role: normalizedRole,
        name: userData.name,
        email: userData.email || userData.shops?.email || '',
        mobile: userData.mobile,
        shop_id: userData.shop_id,
      };
    }
    setUser(resolvedUser);
    if (!useRemoteData) {
      const localEmployee = {
        id: resolvedUser.id || 'local-manager',
        shop_id: resolvedUser.shop_id || 'local-shop',
        name: resolvedUser.name || 'Store Manager',
        email: resolvedUser.email || resolvedUser.mobile || '',
        mobile: resolvedUser.mobile || '',
        role: resolvedUser.role || 'Store Manager',
        createdAt: new Date().toISOString(),
      };
      setEmployeesDb(prev => (
        prev.some(employee => employee.id === localEmployee.id || (localEmployee.email && employee.email === localEmployee.email))
          ? prev
          : [localEmployee, ...prev]
      ));
    }
    sessionStorage.setItem(STORAGE_KEYS.session, JSON.stringify({
      user: resolvedUser,
      loginTime: Date.now()
    }));
  };

  useEffect(() => {
    if (!user) return;
    if (!useRemoteData) return;

    let cancelled = false;
    const loadEmployees = async () => {
      try {
        const employees = await employeeRepository.list();
        if (!cancelled) setEmployeesDb(employees);
      } catch (e) {
        console.error('Error loading employees', e);
      }
    };

    loadEmployees();
    return () => {
      cancelled = true;
    };
  }, [user, useRemoteData]);

  const logout = async () => {
    if (isSupabaseEnabled() && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    sessionStorage.removeItem(STORAGE_KEYS.session);
    localStorage.removeItem(STORAGE_KEYS.session);
  };

  const lookupCustomer = (mobile) => {
    return customersDb.find(c => c.mobile === mobile) || null;
  };

  const addCustomer = async (customerData) => {
    const newCustomer = { id: Date.now(), shop_id: user?.shop_id, ...customerData, loyalty: 0, vehicles: [], pastInspections: [], purchaseHistory: [], pendingRecommendations: [], lastVisit: new Date().toISOString() };
    let savedCustomer;
    try {
      savedCustomer = useRemoteData ? await customerRepository.create(newCustomer) : newCustomer;
    } catch (err) {
      if (err.message?.includes('duplicate key value') || err.message?.includes('customers_shop_id_mobile_key')) {
        // Customer already exists, fetch them instead
        if (useRemoteData) {
          const { data, error } = await supabase
            .from('customers')
            .select('*, vehicles(*)')
            .eq('mobile', customerData.mobile)
            .single();
          if (!error && data) {
            // Need to map it to app format
            savedCustomer = {
              id: data.id,
              name: data.name || '',
              mobile: data.mobile || '',
              city: data.city || '',
              email: data.email || '',
              dob: data.dob || '',
              consent: data.consent ?? true,
              loyalty: data.loyalty || 0,
              nextReminder: data.next_reminder || '',
              lastVisit: data.last_visit || data.created_at,
              vehicles: (data.vehicles || []).map(v => ({
                id: v.id, make: v.make || '', model: v.model || '', year: v.year || '', fuelType: v.fuel_type || '', odometer: v.odometer || ''
              })),
              pastInspections: [], purchaseHistory: [], pendingRecommendations: []
            };
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }
    
    setCustomersDb(prev => {
      const exists = prev.find(c => c.mobile === savedCustomer.mobile);
      if (exists) return prev.map(c => c.mobile === savedCustomer.mobile ? savedCustomer : c);
      return [...prev, savedCustomer];
    });
    setCurrentCustomer(savedCustomer);
  };

  // Stamp lastVisit whenever a customer is selected from the lookup
  const selectCustomer = async (customer) => {
    const stamped = { ...customer, lastVisit: new Date().toISOString() };
    setCurrentCustomer(stamped);
    setCustomersDb(prev => prev.map(c => c.id === stamped.id ? stamped : c));
    setInspectionCompleted(false);
    if (useRemoteData) {
      try {
        await customerRepository.update(stamped);
      } catch (e) {
        console.error('Error updating customer visit', e);
      }
    }
  };

  const addVehicle = async (vehicle) => {
    if (currentCustomer) {
      const vehicleWithId = useRemoteData
        ? await customerRepository.addVehicle(currentCustomer.id, { ...vehicle, shop_id: user?.shop_id })
        : { id: `VEH-${Date.now()}`, ...vehicle };
      const updatedVehicles = [...(currentCustomer.vehicles || []), vehicleWithId];
      const updatedCustomer = {
        ...currentCustomer,
        vehicles: updatedVehicles
      };
      const shouldStartNow = user?.role === 'Store Manager' || user?.role === 'Technician';
      const inspectionLogDraft = {
        id: createLocalInspectionId(),
        shop_id: user?.shop_id,
        customerId: currentCustomer.id,
        customerName: currentCustomer.name,
        customerMobile: currentCustomer.mobile,
        customerCity: currentCustomer.city,
        customerEmail: currentCustomer.email,
        customerConsent: currentCustomer.consent,
        vehicleId: vehicleWithId.id,
        vehicleLabel: `${vehicleWithId.make} ${vehicleWithId.model}`,
        vehicleYear: vehicleWithId.year,
        vehicleFuelType: vehicleWithId.fuelType,
        vehicleOdometer: vehicleWithId.odometer,
        status: shouldStartNow ? 'in_progress' : 'pending',
        requestedBy: user?.name || 'POS Desk',
        requestedByRole: user?.role || 'POS Executive',
        requestedAt: new Date().toISOString(),
        startedAt: shouldStartNow ? new Date().toISOString() : '',
        technicianName: shouldStartNow ? user?.name || 'Technician' : '',
      };
      const inspectionLog = useRemoteData
        ? mergePersistedInspectionLog(inspectionLogDraft, await inspectionLogRepository.create(inspectionLogDraft))
        : inspectionLogDraft;

      setCurrentCustomer(updatedCustomer);
      setCurrentVehicle(vehicleWithId);
      setActiveInspectionLogId(shouldStartNow ? inspectionLog.id : null);
      setInspectionCompleted(false);
      setInspectionData(createInitialInspectionData());
      setRecommendations([]);
      setEstimate({ items: [], consent: null, isPaid: false, managerApproved: false });
      setActiveJobId(null);
      setInspectionLogs(prev => [inspectionLog, ...prev]);
      
      // Update persistent DB mock
      setCustomersDb(prev => prev.map(c =>
        c.id === currentCustomer.id ? { ...c, vehicles: updatedVehicles } : c
      ));
    }
  };

  const startInspectionForVehicle = async (vehicle) => {
    if (!currentCustomer || !vehicle) return false;

    const activeLog = inspectionLogs.find(log =>
      log.customerId === currentCustomer.id &&
      log.vehicleId === vehicle.id &&
      ['pending', 'in_progress'].includes(log.status)
    );

    if (activeLog) {
      return startInspectionFromLog(activeLog.id);
    }

    const inspectionLogDraft = {
      id: createLocalInspectionId(),
      shop_id: user?.shop_id,
      customerId: currentCustomer.id,
      customerName: currentCustomer.name,
      customerMobile: currentCustomer.mobile,
      customerCity: currentCustomer.city,
      customerEmail: currentCustomer.email,
      customerConsent: currentCustomer.consent,
      vehicleId: vehicle.id,
      vehicleLabel: `${vehicle.make} ${vehicle.model}`,
      vehicleYear: vehicle.year,
      vehicleFuelType: vehicle.fuelType,
      vehicleOdometer: vehicle.odometer,
      status: 'in_progress',
      requestedBy: user?.name || 'Technician',
      requestedByRole: user?.role || 'Technician',
      requestedAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      technicianName: user?.name || 'Technician',
    };

    try {
      const inspectionLog = useRemoteData
        ? mergePersistedInspectionLog(inspectionLogDraft, await inspectionLogRepository.create(inspectionLogDraft))
        : inspectionLogDraft;

      setCurrentVehicle(vehicle);
      setActiveInspectionLogId(inspectionLog.id);
      setInspectionCompleted(false);
      setInspectionData(createInitialInspectionData());
      setRecommendations([]);
      setEstimate({ items: [], consent: null, isPaid: false, managerApproved: false });
      setActiveJobId(null);
      setInspectionLogs(prev => [inspectionLog, ...prev]);
      return true;
    } catch (e) {
      console.error('Error creating inspection log', e);
      return false;
    }
  };

  const startInspectionFromLog = async (logId) => {
    const log = inspectionLogs.find(item => item.id === logId);
    if (!log) return false;

    const customer = customersDb.find(c => c.id === log.customerId);
    const vehicle = customer?.vehicles?.find(v => v.id === log.vehicleId) || {
      id: log.vehicleId,
      make: log.vehicleLabel.split(' ')[0],
      model: log.vehicleLabel.split(' ').slice(1).join(' '),
      year: log.vehicleYear,
      fuelType: log.vehicleFuelType,
      odometer: log.vehicleOdometer,
    };

    const fallbackCustomer = {
      id: log.customerId,
      name: log.customerName,
      mobile: log.customerMobile,
      city: log.customerCity || '',
      email: log.customerEmail || '',
      consent: log.customerConsent ?? true,
      vehicles: [vehicle],
      pastInspections: [],
      purchaseHistory: [],
      pendingRecommendations: [],
      loyalty: 0,
    };

    setCurrentCustomer(customer || fallbackCustomer);
    setCurrentVehicle(vehicle);
    setActiveInspectionLogId(logId);
    setInspectionCompleted(false);
    setInspectionData(createInitialInspectionData());
    setRecommendations([]);
    setEstimate({ items: [], consent: null, isPaid: false, managerApproved: false });
    setActiveJobId(null);
    const updatedLog = { ...log, status: 'in_progress', startedAt: log.startedAt || new Date().toISOString(), technicianName: user?.name || 'Technician' };
    setInspectionLogs(prev => prev.map(item => item.id === logId ? updatedLog : item));
    if (useRemoteData) {
      try {
        await inspectionLogRepository.update(updatedLog);
      } catch (e) {
        console.error('Error starting inspection log', e);
        setInspectionLogs(prev => prev.map(item => item.id === logId ? log : item));
        setActiveInspectionLogId(null);
        return false;
      }
    }

    return true;
  };

  const completeInspectionLog = async () => {
    const logByActiveId = activeInspectionLogId
      ? inspectionLogs.find(item => item.id === activeInspectionLogId)
      : null;
    const fallbackLog = inspectionLogs.find(item =>
          item.customerId === currentCustomer?.id &&
          item.vehicleId === currentVehicle?.id &&
          ['pending', 'in_progress'].includes(item.status)
        );
    const log = logByActiveId || fallbackLog;

    if (!log) return false;

    const updatedLog = {
      ...log,
      status: 'completed',
      completedAt: new Date().toISOString(),
      inspectionData: cloneData(inspectionData),
    };
    setInspectionLogs(prev => prev.map(item => item.id === log.id ? updatedLog : item));
    if (useRemoteData) {
      try {
        await inspectionLogRepository.update(updatedLog);
      } catch (e) {
        console.error('Error completing inspection log', e);
        setInspectionLogs(prev => prev.map(item => item.id === log.id ? log : item));
        return false;
      }
    }
    setActiveInspectionLogId(null);
    return true;
  };

  const getCurrentInspectionLog = () => {
    if (!currentCustomer || !currentVehicle) return null;

    const activeLog = activeInspectionLogId
      ? inspectionLogs.find(item => item.id === activeInspectionLogId)
      : null;

    return activeLog || inspectionLogs.find(item =>
      item.customerId === currentCustomer.id &&
      item.vehicleId === currentVehicle.id &&
      ['pending', 'in_progress'].includes(item.status)
    ) || inspectionLogs.find(item =>
      item.customerId === currentCustomer.id &&
      item.vehicleId === currentVehicle.id &&
      item.status === 'completed'
    ) || null;
  };

  const isCurrentInspectionLocked = () => {
    const log = getCurrentInspectionLog();
    return log?.status === 'completed';
  };

  const validateInspectionData = (data = inspectionData) => {
    const errors = [];
    const tyreLabels = { FL: 'Front Left', FR: 'Front Right', RL: 'Rear Left', RR: 'Rear Right', Spare: 'Spare' };

    Object.entries(data.tyres || {}).forEach(([pos, tyre]) => {
      const missing = [];
      if (!tyre.brand) missing.push('brand');
      if (!tyre.size) missing.push('size');
      if (!tyre.pressure) missing.push('pressure');
      if (!tyre.tread) missing.push('tread depth');
      if (!tyre.condition) missing.push('condition');
      if (!tyre.fitmentType) missing.push('OE/replacement');
      if (missing.length) errors.push(`${tyreLabels[pos] || pos}: ${missing.join(', ')}`);
    });

    const battery = data.battery || {};
    const batteryMissing = [];
    if (!battery.brand) batteryMissing.push('brand');
    if (!battery.model) batteryMissing.push('model');
    if (!battery.age) batteryMissing.push('age');
    if (!battery.health) batteryMissing.push('status');
    if (!battery.healthPercentage) batteryMissing.push('health %');
    if (!battery.chargingStatus) batteryMissing.push('charging status');
    if (batteryMissing.length) errors.push(`Battery: ${batteryMissing.join(', ')}`);

    const usage = data.usage || {};
    const usageMissing = [];
    if (!usage.monthlyKm) usageMissing.push('monthly run');
    if (!usage.drivingStyle) usageMissing.push('driving style');
    if (!usage.terrain) usageMissing.push('terrain');
    if (usageMissing.length) errors.push(`Usage: ${usageMissing.join(', ')}`);

    return { valid: errors.length === 0, errors };
  };

  const generateRecommendations = () => {
    const recs = [];
    const monthlyKm = Math.max(1, Number(inspectionData.usage.monthlyKm) || 1000);
    const terrainFactor = { city: 1, highway: 1.1, rough: 0.75, mixed: 0.9 }[inspectionData.usage.terrain] || 1;
    const styleFactor = { normal: 1, aggressive: 0.8, commercial: 0.7 }[inspectionData.usage.drivingStyle] || 1;
    const kmPerMm = 5000 * terrainFactor * styleFactor;

    const buildLife = (tread) => {
      const usableMm = Math.max(0, Number(tread || 0) - 1.6);
      const remainingKm = Math.max(0, Math.round(usableMm * kmPerMm));
      const months = Math.max(1, Math.ceil(remainingKm / monthlyKm));
      const recheck = new Date();
      recheck.setMonth(recheck.getMonth() + Math.min(months, 6));
      return { remainingKm, months, recheckDate: recheck.toISOString() };
    };

    Object.entries(inspectionData.tyres).forEach(([pos, data]) => {
      // Skip tyres where no data has been entered
      if (!data.tread && !data.pressure && data.condition === 'good') return;

      const tread = parseFloat(data.tread || 0);
      const isCriticalCondition = data.condition === 'cracks' || data.condition === 'bulge';
      const life = buildLife(tread);

      if (isCriticalCondition || (data.tread && tread < 2.0)) {
        recs.push({
          type: 'tyre',
          pos,
          text: `Replace ${pos} Tyre — ${isCriticalCondition ? data.condition.charAt(0).toUpperCase() + data.condition.slice(1) + ' detected' : 'Critical tread depth'}`,
          status: 'replace_now',
          price: serviceCatalog.tyreReplacement,
          nsd: data.tread || '',
          remainingKm: life.remainingKm,
          recheckDate: life.recheckDate,
        });
      } else if (data.condition === 'uneven') {
        recs.push({
          type: 'tyre',
          pos,
          text: `Rotate & Balance ${pos} Tyre — Uneven wear pattern`,
          status: 'can_run',
          runText: `approx ${Math.min(life.remainingKm, 5000).toLocaleString('en-IN')} km before rotation`,
          price: serviceCatalog.tyreRotation,
          nsd: data.tread || '',
          remainingKm: life.remainingKm,
          recheckDate: life.recheckDate,
        });
      } else if (data.tread && tread >= 2.0 && tread <= 4.0) {
        recs.push({
          type: 'tyre',
          pos,
          text: `Monitor ${pos} Tyre — Tread at ${tread}mm`,
          status: 'can_run',
          runText: `approx ${life.remainingKm.toLocaleString('en-IN')} km / ${life.months} month${life.months !== 1 ? 's' : ''}`,
          price: 0,
          nsd: data.tread || '',
          remainingKm: life.remainingKm,
          recheckDate: life.recheckDate,
        });
      }
    });

    if (inspectionData.battery.health === 'weak') {
      recs.push({ type: 'battery', text: 'Battery Showing Weak Charge — Test & Consider Replacement', status: 'replace_now', price: serviceCatalog.batteryReplacement });
    } else if (inspectionData.battery.health === 'replace') {
      recs.push({ type: 'battery', text: 'Replace Battery Immediately — Risk of breakdown', status: 'replace_now', price: serviceCatalog.batteryReplacement });
    }

    // Fallback if no issues found
    if (recs.length === 0) {
      recs.push({ type: 'service', text: 'General Service & Wheel Alignment', status: 'can_run', runText: 'in 2 months', price: serviceCatalog.generalService });
    }

    setRecommendations(recs);
    return recs;
  };

  const buildReportRecord = (overrides = {}) => {
    const reportId = overrides.id || activeJobId || `REP-${Date.now().toString().slice(-6)}`;
    const reportEstimate = overrides.estimate || estimate;
    const portalToken = createPortalToken(currentCustomer?.id, currentCustomer?.mobile);
    const portalLink = useRemoteData ? '' : `${window.location.origin}/portal/${portalToken}`;

    return {
      id: reportId,
      shop_id: user?.shop_id,
      customerId: currentCustomer?.id || null,
      customerName: currentCustomer?.name || 'Walk-in',
      customerMobile: currentCustomer?.mobile || '',
      vehicleId: currentVehicle?.id || null,
      vehicle: currentVehicle ? `${currentVehicle.make} ${currentVehicle.model}` : 'Unknown',
      vehicleYear: currentVehicle?.year || '',
      vehicleFuelType: currentVehicle?.fuelType || '',
      vehicleOdometer: currentVehicle?.odometer || '',
      items: cloneData(reportEstimate.items || []),
      status: overrides.status || 'Completed',
      date: overrides.date || new Date().toISOString(),
      savedAt: new Date().toISOString(),
      portalLink: reportEstimate.portalLink || portalLink,
      snapshot: {
        customer: cloneData(currentCustomer || {}),
        customerId: currentCustomer?.id || null,
        customerName: currentCustomer?.name || 'Walk-in',
        customerMobile: currentCustomer?.mobile || '',
        vehicle: cloneData(currentVehicle || {}),
        vehicleId: currentVehicle?.id || null,
        vehicleLabel: currentVehicle ? `${currentVehicle.make} ${currentVehicle.model}` : 'Unknown',
        vehicleYear: currentVehicle?.year || '',
        vehicleFuelType: currentVehicle?.fuelType || '',
        vehicleOdometer: currentVehicle?.odometer || '',
        inspectionData: cloneData(inspectionData),
        recommendations: cloneData(recommendations),
        estimate: cloneData({ ...reportEstimate, portalLink: reportEstimate.portalLink || portalLink }),
        portalLink: reportEstimate.portalLink || portalLink,
      },
    };
  };

  const upsertJob = (job) => {
    setJobsDb(prev => {
      const existingIndex = prev.findIndex(item => item.id === job.id);
      if (existingIndex === -1) return [...prev, job];

      return prev.map(item => item.id === job.id ? { ...item, ...job } : item);
    });
    setActiveJobId(job.id);
  };

  const upsertReminder = (reminder) => {
    setRemindersDb(prev => {
      const existingIndex = prev.findIndex(item => item.id === reminder.id);
      if (existingIndex === -1) return [reminder, ...prev];
      return prev.map(item => item.id === reminder.id ? { ...item, ...reminder } : item);
    });
  };

  const createReminder = async (reminder) => {
    const draft = {
      id: useRemoteData ? undefined : `REMINDER-${Date.now().toString().slice(-6)}`,
      shop_id: user?.shop_id,
      customerId: currentCustomer?.id || reminder.customerId || null,
      vehicleId: currentVehicle?.id || reminder.vehicleId || null,
      jobId: reminder.jobId || null,
      customerName: currentCustomer?.name || reminder.customerName || '',
      customerMobile: currentCustomer?.mobile || reminder.customerMobile || '',
      vehicleLabel: currentVehicle ? `${currentVehicle.make} ${currentVehicle.model}` : reminder.vehicleLabel || '',
      type: reminder.type || 'follow_up',
      source: reminder.source || '',
      title: reminder.title || 'Customer follow-up',
      notes: reminder.notes || '',
      dueAt: reminder.dueAt,
      status: reminder.status || 'open',
      completedAt: reminder.completedAt || '',
    };
    const savedReminder = useRemoteData ? await reminderRepository.create(draft) : draft;
    upsertReminder(savedReminder);
    return savedReminder;
  };

  const updateReminder = async (reminderId, patch) => {
    const reminder = remindersDb.find(item => item.id === reminderId);
    if (!reminder) return null;
    const updatedReminder = { ...reminder, ...patch };
    upsertReminder(updatedReminder);
    if (useRemoteData) {
      try {
        const persistedReminder = await reminderRepository.update(updatedReminder);
        upsertReminder(persistedReminder);
        return persistedReminder;
      } catch (e) {
        console.error('Error updating reminder', e);
        upsertReminder(reminder);
        return null;
      }
    }
    return updatedReminder;
  };

  const addEmployee = async (employee) => {
    const draft = {
      id: useRemoteData ? undefined : `EMP-${Date.now().toString().slice(-6)}`,
      shop_id: user?.shop_id || 'local-shop',
      name: employee.name?.trim(),
      email: employee.email?.trim(),
      mobile: employee.mobile?.trim() || '',
      role: employee.role || 'POS Executive',
      createdAt: new Date().toISOString(),
    };

    const savedEmployee = useRemoteData
      ? await employeeRepository.create({ ...draft, password: employee.password })
      : draft;

    setEmployeesDb(prev => [savedEmployee, ...prev.filter(item => item.id !== savedEmployee.id)]);
    return savedEmployee;
  };

  const saveCurrentReport = async () => {
    const savedReport = buildReportRecord({ status: 'Completed' });
    const persistedReport = useRemoteData
      ? activeJobId
        ? await jobRepository.update({ ...savedReport, id: activeJobId })
        : await jobRepository.create(savedReport)
      : savedReport;
    upsertJob(persistedReport);
    return persistedReport;
  };

  const completeCheckout = async (paymentMode, total, loyaltyApplied = 0, checkoutDetails = {}) => {
    const invoiceDate = new Date().toISOString();
    const approvedItems = estimate.approvedItems || estimate.items || [];
    const serialDetails = checkoutDetails.serialDetails || estimate.serialDetails || {};
    const warranties = checkoutDetails.warranties || buildWarrantyRecords(approvedItems, serialDetails, invoiceDate);
    const portalToken = createPortalToken(currentCustomer?.id, currentCustomer?.mobile);
    const portalLink = checkoutDetails.portalLink || (useRemoteData ? '' : `${window.location.origin}/portal/${portalToken}`);
    const paidEstimate = {
      ...estimate,
      items: approvedItems,
      approvedItems,
      isPaid: true,
      paymentMode,
      loyaltyApplied,
      serialDetails,
      warranties,
      portalLink,
      invoiceDate,
    };
    setEstimate(paidEstimate);
    if (currentCustomer) {
      const earnedPoints = Math.floor(total / rewardRules.purchaseAmount) * rewardRules.purchasePoints;
      const nextVisit = new Date();
      nextVisit.setMonth(nextVisit.getMonth() + 6);
      const updatedCustomer = {
         ...currentCustomer,
         loyalty: Math.max(0, (currentCustomer.loyalty || 0) - loyaltyApplied) + earnedPoints,
         nextReminder: nextVisit.toISOString()
      };
      setCurrentCustomer(updatedCustomer);
      setCustomersDb(prev => prev.map(c => c.id === currentCustomer.id ? updatedCustomer : c));
      if (useRemoteData) {
        try {
          await customerRepository.update(updatedCustomer);
        } catch (e) {
          console.error('Error updating customer loyalty', e);
        }
      }
    }

    if (activeJobId) {
      const completedJob = buildReportRecord({
        id: activeJobId,
        estimate: paidEstimate,
        status: 'Completed',
      });
      const persistedJob = useRemoteData ? await jobRepository.update(completedJob) : completedJob;
      upsertJob(persistedJob);
    }
  };

  const createJob = async (estimateOverride = estimate) => {
    const newJobId = useRemoteData ? null : `JOB-${Date.now().toString().slice(-6)}`;
    const jobEstimate = {
      ...estimateOverride,
      items: estimateOverride.approvedItems || estimateOverride.items || [],
      approvedItems: estimateOverride.approvedItems || estimateOverride.items || [],
    };
    const lineItems = cloneData(jobEstimate.approvedItems || []).map((item, index) => ({
      ...item,
      lineId: item.lineId || `${item.id || 'item'}-${index}`,
      status: item.status || 'Pending',
      assignedTechnician: item.assignedTechnician || '',
      completedAt: item.completedAt || '',
    }));
    const newJob = {
      id: newJobId,
      shop_id: user?.shop_id,
      customerName: currentCustomer?.name || 'Walk-in',
      customerMobile: currentCustomer?.mobile || '',
      vehicle: currentVehicle ? `${currentVehicle.make} ${currentVehicle.model}` : 'Unknown',
      vehicleYear: currentVehicle?.year || '',
      vehicleFuelType: currentVehicle?.fuelType || '',
      vehicleOdometer: currentVehicle?.odometer || '',
      customerId: currentCustomer?.id || null,
      vehicleId: currentVehicle?.id || null,
      items: lineItems,
      status: 'Pending',
      date: new Date().toISOString(),
      // Full snapshot for report reconstruction
      snapshot: {
        inspectionData: cloneData(inspectionData),
        recommendations: cloneData(recommendations),
        estimate: cloneData({ ...jobEstimate, items: lineItems, approvedItems: lineItems }),
      },
    };
    const persistedJob = useRemoteData ? await jobRepository.create(newJob) : newJob;
    upsertJob(persistedJob);
    return persistedJob.id;
  };

  const recordCustomerDecision = async ({ decision, remarks = '', reminderDate = '', loyaltyApplied = 0 } = {}) => {
    const decidedAt = new Date().toISOString();
    const approvedItems = cloneData(estimate.items || []);
    const portalToken = createPortalToken(currentCustomer?.id, currentCustomer?.mobile);
    const portalLink = useRemoteData ? '' : `${window.location.origin}/portal/${portalToken}`;
    const nextEstimate = {
      ...estimate,
      items: approvedItems,
      approvedItems,
      customerDecision: decision,
      decisionRemarks: remarks,
      reminderDate,
      decidedAt,
      loyaltyApplied,
      portalLink,
      consent: decision === 'approved',
    };

    setEstimate(nextEstimate);

    if (decision === 'approved') {
      if (!activeJobId) await createJob(nextEstimate);
      return { ok: true, estimate: nextEstimate };
    }

    const status = decision === 'wants_time' ? 'Pending Reminder' : 'Lost Opportunity';
    const opportunityRecord = buildReportRecord({
      id: useRemoteData ? undefined : `${decision === 'wants_time' ? 'REM' : 'LOST'}-${Date.now().toString().slice(-6)}`,
      estimate: nextEstimate,
      status,
    });

    const persistedRecord = useRemoteData ? await jobRepository.create(opportunityRecord) : opportunityRecord;
    upsertJob(persistedRecord);

    if (decision === 'wants_time' && currentCustomer && reminderDate) {
      await createReminder({
        jobId: persistedRecord.id,
        type: 'estimate_follow_up',
        source: 'customer_decision',
        title: `Follow up estimate for ${currentCustomer.name}`,
        notes: remarks || 'Customer wants time before approving estimate.',
        dueAt: new Date(reminderDate).toISOString(),
      });
      const updatedCustomer = { ...currentCustomer, nextReminder: new Date(reminderDate).toISOString() };
      setCurrentCustomer(updatedCustomer);
      setCustomersDb(prev => prev.map(c => c.id === currentCustomer.id ? updatedCustomer : c));
      if (useRemoteData) {
        await customerRepository.update(updatedCustomer);
      }
    }

    return { ok: true, estimate: nextEstimate };
  };

  const updateJobStatus = async (jobId, status) => {
    const job = jobsDb.find(j => j.id === jobId);
    if (!job) return;

    const nextItems = (job.items || []).map(item => ({
      ...item,
      status: status === 'Completed' ? 'Completed' : status === 'In Progress' && item.status === 'Pending' ? 'In Progress' : item.status,
      completedAt: status === 'Completed' ? (item.completedAt || new Date().toISOString()) : item.completedAt,
    }));
    const updatedJob = {
      ...job,
      status,
      items: nextItems,
      snapshot: {
        ...job.snapshot,
        estimate: {
          ...(job.snapshot?.estimate || {}),
          items: nextItems,
          approvedItems: nextItems,
        },
      },
    };
    setJobsDb(prev => prev.map(j => j.id === jobId ? updatedJob : j));
    if (useRemoteData) {
      try {
        const persistedJob = await jobRepository.update(updatedJob);
        setJobsDb(prev => prev.map(j => j.id === jobId ? persistedJob : j));
      } catch (e) {
        console.error('Error updating job status', e);
      }
    }
  };

  const persistJobUpdate = async (updatedJob) => {
    setJobsDb(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
    if (useRemoteData) {
      try {
        const persistedJob = await jobRepository.update(updatedJob);
        setJobsDb(prev => prev.map(j => j.id === updatedJob.id ? persistedJob : j));
      } catch (e) {
        console.error('Error persisting job update', e);
      }
    }
  };

  const updateJobItemStatus = async (jobId, lineId, status) => {
    const job = jobsDb.find(j => j.id === jobId);
    if (!job) return;
    const nextItems = (job.items || []).map(item =>
      item.lineId === lineId
        ? { ...item, status, completedAt: status === 'Completed' ? new Date().toISOString() : '' }
        : item
    );
    const nextStatus = nextItems.every(item => item.status === 'Completed')
      ? 'Completed'
      : nextItems.some(item => item.status === 'In Progress' || item.status === 'Completed')
        ? 'In Progress'
        : 'Pending';
    await persistJobUpdate({
      ...job,
      status: nextStatus,
      items: nextItems,
      snapshot: {
        ...job.snapshot,
        estimate: {
          ...(job.snapshot?.estimate || {}),
          items: nextItems,
          approvedItems: nextItems,
        },
      },
    });
  };

  const assignJobTechnician = async (jobId, technicianName) => {
    const job = jobsDb.find(j => j.id === jobId);
    if (!job) return;
    const nextItems = (job.items || []).map(item => ({
      ...item,
      assignedTechnician: item.assignedTechnician || technicianName,
    }));
    await persistJobUpdate({
      ...job,
      assignedTechnician: technicianName,
      items: nextItems,
      snapshot: {
        ...job.snapshot,
        assignedTechnician: technicianName,
        estimate: {
          ...(job.snapshot?.estimate || {}),
          items: nextItems,
          approvedItems: nextItems,
        },
      },
    });
  };

  const saveFeedback = async (jobId, feedback) => {
    const job = jobsDb.find(j => j.id === jobId);
    if (!job) return false;
    const feedbackRecord = { ...feedback, recordedAt: new Date().toISOString(), recordedBy: user?.name || '' };
    await persistJobUpdate({
      ...job,
      feedback: feedbackRecord,
      snapshot: {
        ...job.snapshot,
        feedback: feedbackRecord,
      },
    });
    return true;
  };

  const saveRewardRules = async (rules) => {
    const savedRules = useRemoteData
      ? await loyaltyRepository.saveRules({ ...rules, shop_id: user?.shop_id })
      : rules;

    setRewardRules(savedRules);
    if (!useRemoteData) {
      localStorage.setItem(STORAGE_KEYS.rewardRules, JSON.stringify(savedRules));
    }
    return savedRules;
  };

  const saveServiceCatalog = async (catalog) => {
    // In a real app, save to Supabase. Here we mock it.
    setServiceCatalog(catalog);
    if (!useRemoteData) {
      localStorage.setItem(STORAGE_KEYS.serviceCatalog, JSON.stringify(catalog));
    }
    return catalog;
  };

  // --- Context Segregation for Performance ---
  // Memoize values so that typing in the inspection form (which updates WorkflowContext)
  // doesn't trigger re-renders in components that only care about Auth or Data.

  /* eslint-disable react-hooks/exhaustive-deps */
  const authValue = React.useMemo(() => ({
    user, login, logout
  }), [user]);

  const dataValue = React.useMemo(() => ({
    isLoading, customersDb, jobsDb, setJobsDb, remindersDb, employeesDb, inspectionLogs, rewardRules, saveRewardRules,
    updateJobStatus, updateJobItemStatus, assignJobTechnician, saveFeedback,
    createReminder, updateReminder, addEmployee,
    serviceCatalog, saveServiceCatalog
  }), [isLoading, customersDb, jobsDb, remindersDb, employeesDb, inspectionLogs, rewardRules, serviceCatalog, useRemoteData, user]);

  const workflowValue = React.useMemo(() => ({
    currentCustomer, setCurrentCustomer, lookupCustomer, addCustomer, selectCustomer,
    currentVehicle, setCurrentVehicle, addVehicle,
    inspectionCompleted, setInspectionCompleted,
    inspectionLogs, activeInspectionLogId, startInspectionFromLog, startInspectionForVehicle, completeInspectionLog,
    getCurrentInspectionLog, isCurrentInspectionLocked, validateInspectionData,
    inspectionData, setInspectionData,
    recommendations, setRecommendations, generateRecommendations,
    estimate, setEstimate,
    activeJobId, setActiveJobId, createJob, completeCheckout, saveCurrentReport, recordCustomerDecision,
  }), [
    currentCustomer, currentVehicle, inspectionCompleted, activeInspectionLogId,
    inspectionData, inspectionLogs, recommendations, estimate, activeJobId,
    customersDb, jobsDb, rewardRules, serviceCatalog, useRemoteData, user
  ]);
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <AuthContext.Provider value={authValue}>
      <DataContext.Provider value={dataValue}>
        <WorkflowContext.Provider value={workflowValue}>
          {children}
        </WorkflowContext.Provider>
      </DataContext.Provider>
    </AuthContext.Provider>
  );
};
