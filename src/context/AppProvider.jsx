import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { role: 'Store Manager' }
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [currentVehicle, setCurrentVehicle] = useState(null);
  const [inspectionData, setInspectionData] = useState({
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
  const [recommendations, setRecommendations] = useState([]);
  const [estimate, setEstimate] = useState({ items: [], consent: null, isPaid: false, managerApproved: false });
  const [jobsDb, setJobsDb] = useState([]);
  const [activeJobId, setActiveJobId] = useState(null);

  // mock customer DB
  const [customersDb, setCustomersDb] = useState([
    {
      id: 1, name: 'John Doe', mobile: '9876543210', city: 'Mumbai', consent: true, email: 'john@example.com', dob: '1990-01-01',
      vehicles: [{ make: 'Honda', model: 'City', year: '2020', fuelType: 'Petrol', odometer: '45000' }],
      pastInspections: [], purchaseHistory: [], pendingRecommendations: [], loyalty: 150
    }
  ]);

  const login = (userData) => {
    if (typeof userData === 'string') {
      setUser({ role: userData, name: userData === 'Store Manager' ? 'Manager Mike' : userData === 'Technician' ? 'Tech Tom' : 'Exec Emma' });
    } else {
      // Normalize role from Google Sheet so the Dashboard tiles appear correctly
      let normalizedRole = 'POS Executive';
      const rawRole = (userData.role || '').toLowerCase();
      
      if (rawRole.includes('manager')) normalizedRole = 'Store Manager';
      else if (rawRole.includes('tech')) normalizedRole = 'Technician';
      
      setUser({ role: normalizedRole, name: userData.name, mobile: userData.mobile });
    }
  };
  const logout = () => setUser(null);

  const lookupCustomer = (mobile) => {
    return customersDb.find(c => c.mobile === mobile) || null;
  };

  const addCustomer = (customerData) => {
    const newCustomer = { id: Date.now(), ...customerData, loyalty: 0, vehicles: [], pastInspections: [], purchaseHistory: [], pendingRecommendations: [] };
    setCustomersDb([...customersDb, newCustomer]);
    setCurrentCustomer(newCustomer);
  };

  const addVehicle = (vehicle) => {
    if (currentCustomer) {
      const updatedVehicles = [...currentCustomer.vehicles, vehicle];
      setCurrentCustomer({
        ...currentCustomer,
        vehicles: updatedVehicles
      });
      setCurrentVehicle(vehicle);
      
      // Update persistent DB mock
      setCustomersDb(prev => prev.map(c => 
         c.id === currentCustomer.id ? { ...c, vehicles: updatedVehicles } : c
      ));
    }
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
      currentCustomer, setCurrentCustomer, lookupCustomer, addCustomer,
      currentVehicle, setCurrentVehicle, addVehicle,
      inspectionData, setInspectionData,
      recommendations, setRecommendations, generateRecommendations,
      estimate, setEstimate,
      jobsDb, setJobsDb, activeJobId, setActiveJobId, createJob, updateJobStatus, completeCheckout
    }}>
      {children}
    </AppContext.Provider>
  );
};
