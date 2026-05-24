import React, { createContext, useContext, useEffect, useState } from 'react';

const AppContext = createContext();
const SEVEN_DAYS_AGO = '2026-05-17T00:00:00.000Z';
const CUSTOMERS_STORAGE_KEY = 'abhyaan_customers_db';
const INSPECTION_LOGS_STORAGE_KEY = 'abhyaan_inspection_logs';
const SESSION_STORAGE_KEY = 'abhyaan_session';

const createInitialInspectionData = () => ({
  tyres: {
    FL: { brand: '', size: '', pressure: '', tread: '', condition: 'good' },
    FR: { brand: '', size: '', pressure: '', tread: '', condition: 'good' },
    RL: { brand: '', size: '', pressure: '', tread: '', condition: 'good' },
    RR: { brand: '', size: '', pressure: '', tread: '', condition: 'good' },
    Spare: { brand: '', size: '', pressure: '', tread: '', condition: 'good' }
  },
  battery: { health: 'good', age: '', status: '' },
  usage: { monthlyKm: '', drivingStyle: 'normal', terrain: 'city' }
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

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (savedSession) {
      try {
        const { user, loginTime } = JSON.parse(savedSession);
        const hoursPassed = (Date.now() - loginTime) / (1000 * 60 * 60);
        if (hoursPassed < 24) {
          return user;
        } else {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
      } catch (e) {
        console.error("Error loading session from sessionStorage", e);
      }
    }
    return null;
  });
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [currentVehicle, setCurrentVehicle] = useState(null);
  const [inspectionCompleted, setInspectionCompleted] = useState(false);
  const [inspectionData, setInspectionData] = useState(createInitialInspectionData);
  const [recommendations, setRecommendations] = useState([]);
  const [estimate, setEstimate] = useState({ items: [], consent: null, isPaid: false, managerApproved: false });
  const [jobsDb, setJobsDb] = useState([]);
  const [activeJobId, setActiveJobId] = useState(null);
  const [inspectionLogs, setInspectionLogs] = useState(() => loadStoredArray(INSPECTION_LOGS_STORAGE_KEY, []));
  const [activeInspectionLogId, setActiveInspectionLogId] = useState(null);

  // mock customer DB
  const [customersDb, setCustomersDb] = useState(() => loadStoredArray(CUSTOMERS_STORAGE_KEY, seedCustomers));

  useEffect(() => {
    saveSharedArray(CUSTOMERS_STORAGE_KEY, customersDb);
  }, [customersDb]);

  useEffect(() => {
    saveSharedArray(INSPECTION_LOGS_STORAGE_KEY, inspectionLogs);
  }, [inspectionLogs]);

  useEffect(() => {
    const handleSharedStorage = (event) => {
      if (!event.newValue) return;

      try {
        if (event.key === CUSTOMERS_STORAGE_KEY) {
          setCustomersDb(prev => JSON.stringify(prev) === event.newValue ? prev : JSON.parse(event.newValue));
        }

        if (event.key === INSPECTION_LOGS_STORAGE_KEY) {
          setInspectionLogs(prev => JSON.stringify(prev) === event.newValue ? prev : JSON.parse(event.newValue));
        }
      } catch (e) {
        console.error("Error syncing shared app data from localStorage", e);
      }
    };

    window.addEventListener('storage', handleSharedStorage);
    return () => window.removeEventListener('storage', handleSharedStorage);
  }, []);

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
      
      resolvedUser = { role: normalizedRole, name: userData.name, mobile: userData.mobile };
    }
    setUser(resolvedUser);
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
      user: resolvedUser,
      loginTime: Date.now()
    }));
  };
  const logout = () => {
    setUser(null);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  const lookupCustomer = (mobile) => {
    return customersDb.find(c => c.mobile === mobile) || null;
  };

  const addCustomer = (customerData) => {
    const newCustomer = { id: Date.now(), ...customerData, loyalty: 0, vehicles: [], pastInspections: [], purchaseHistory: [], pendingRecommendations: [], lastVisit: new Date().toISOString() };
    setCustomersDb(prev => [...prev, newCustomer]);
    setCurrentCustomer(newCustomer);
  };

  // Stamp lastVisit whenever a customer is selected from the lookup
  const selectCustomer = (customer) => {
    const stamped = { ...customer, lastVisit: new Date().toISOString() };
    setCurrentCustomer(stamped);
    setCustomersDb(prev => prev.map(c => c.id === stamped.id ? stamped : c));
    setInspectionCompleted(false);
  };

  const addVehicle = (vehicle) => {
    if (currentCustomer) {
      const vehicleWithId = { id: `VEH-${Date.now()}`, ...vehicle };
      const updatedVehicles = [...currentCustomer.vehicles, vehicleWithId];
      const updatedCustomer = {
        ...currentCustomer,
        vehicles: updatedVehicles
      };
      const inspectionLog = {
        id: `INS-${Date.now().toString().slice(-6)}`,
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
        status: 'pending',
        requestedBy: user?.name || 'POS Desk',
        requestedByRole: user?.role || 'POS Executive',
        requestedAt: new Date().toISOString(),
      };

      setCurrentCustomer(updatedCustomer);
      setCurrentVehicle(vehicleWithId);
      setInspectionCompleted(false);
      setInspectionData(createInitialInspectionData());
      setRecommendations([]);
      setEstimate({ items: [], consent: null, isPaid: false, managerApproved: false });
      setInspectionLogs(prev => [inspectionLog, ...prev]);
      
      // Update persistent DB mock
      setCustomersDb(prev => prev.map(c => 
         c.id === currentCustomer.id ? { ...c, vehicles: updatedVehicles } : c
      ));
    }
  };

  const startInspectionFromLog = (logId) => {
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
    setInspectionLogs(prev => prev.map(item => 
      item.id === logId
        ? { ...item, status: 'in_progress', startedAt: item.startedAt || new Date().toISOString(), technicianName: user?.name || 'Technician' }
        : item
    ));

    return true;
  };

  const completeInspectionLog = () => {
    if (!activeInspectionLogId) return;
    setInspectionLogs(prev => prev.map(item => 
      item.id === activeInspectionLogId
        ? { ...item, status: 'completed', completedAt: new Date().toISOString() }
        : item
    ));
  };

  const generateRecommendations = () => {
    const recs = [];

    Object.entries(inspectionData.tyres).forEach(([pos, data]) => {
      // Skip tyres where no data has been entered
      if (!data.tread && !data.pressure && data.condition === 'good') return;

      const tread = parseFloat(data.tread || 0);
      const isCriticalCondition = data.condition === 'cracks' || data.condition === 'bulge';

      if (isCriticalCondition || (data.tread && tread < 2.0)) {
        recs.push({
          type: 'tyre',
          pos,
          text: `Replace ${pos} Tyre — ${isCriticalCondition ? data.condition.charAt(0).toUpperCase() + data.condition.slice(1) + ' detected' : 'Critical tread depth'}`,
          status: 'replace_now',
          price: 6500,
        });
      } else if (data.condition === 'uneven') {
        recs.push({
          type: 'tyre',
          pos,
          text: `Rotate & Balance ${pos} Tyre — Uneven wear pattern`,
          status: 'can_run',
          runText: 'approx 5000 km before rotation',
          price: 800,
        });
      } else if (data.tread && tread >= 2.0 && tread <= 4.0) {
        recs.push({
          type: 'tyre',
          pos,
          text: `Monitor ${pos} Tyre — Tread at ${tread}mm`,
          status: 'can_run',
          runText: 'approx 3000 km',
          price: 0,
        });
      }
    });

    if (inspectionData.battery.health === 'weak') {
      recs.push({ type: 'battery', text: 'Battery Showing Weak Charge — Test & Consider Replacement', status: 'replace_now', price: 4200 });
    } else if (inspectionData.battery.health === 'replace') {
      recs.push({ type: 'battery', text: 'Replace Battery Immediately — Risk of breakdown', status: 'replace_now', price: 4200 });
    }

    // Fallback if no issues found
    if (recs.length === 0) {
      recs.push({ type: 'service', text: 'General Service & Wheel Alignment', status: 'can_run', runText: 'in 2 months', price: 1500 });
    }

    setRecommendations(recs);
    return recs;
  };

  const completeCheckout = (paymentMode, total) => {
    setEstimate({ ...estimate, isPaid: true, paymentMode });
    if (currentCustomer) {
      const earnedPoints = Math.floor(total / 100);
      const nextVisit = new Date();
      nextVisit.setMonth(nextVisit.getMonth() + 6);
      const updatedCustomer = {
         ...currentCustomer,
         loyalty: (currentCustomer.loyalty || 0) + earnedPoints,
         nextReminder: nextVisit.toISOString()
      };
      setCurrentCustomer(updatedCustomer);
      setCustomersDb(prev => prev.map(c => c.id === currentCustomer.id ? updatedCustomer : c));
    }
  };

  const createJob = () => {
    const newJobId = `JOB-${Date.now().toString().slice(-6)}`;
    const newJob = {
      id: newJobId,
      customerName: currentCustomer?.name || 'Walk-in',
      customerMobile: currentCustomer?.mobile || '',
      vehicle: currentVehicle ? `${currentVehicle.make} ${currentVehicle.model}` : 'Unknown',
      vehicleYear: currentVehicle?.year || '',
      vehicleFuelType: currentVehicle?.fuelType || '',
      vehicleOdometer: currentVehicle?.odometer || '',
      items: estimate.items,
      status: 'Pending',
      date: new Date().toISOString(),
      // Full snapshot for report reconstruction
      snapshot: {
        inspectionData: JSON.parse(JSON.stringify(inspectionData)),
        recommendations: JSON.parse(JSON.stringify(recommendations)),
        estimate: JSON.parse(JSON.stringify(estimate)),
      },
    };
    setJobsDb(prev => [...prev, newJob]);
    setActiveJobId(newJobId);
    return newJobId;
  };

  const updateJobStatus = (jobId, status) => {
    setJobsDb(prev => prev.map(j => j.id === jobId ? { ...j, status } : j));
  };

  return (
    <AppContext.Provider value={{
      user, login, logout,
      customersDb,
      currentCustomer, setCurrentCustomer, lookupCustomer, addCustomer, selectCustomer,
      currentVehicle, setCurrentVehicle, addVehicle,
      inspectionCompleted, setInspectionCompleted,
      inspectionLogs, activeInspectionLogId, startInspectionFromLog, completeInspectionLog,
      inspectionData, setInspectionData,
      recommendations, setRecommendations, generateRecommendations,
      estimate, setEstimate,
      jobsDb, setJobsDb, activeJobId, setActiveJobId, createJob, updateJobStatus, completeCheckout
    }}>
      {children}
    </AppContext.Provider>
  );
};
