import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppProvider';

import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CustomerLookup from './pages/CustomerLookup';
import CustomerKYC from './pages/CustomerKYC';
import CustomerSummary from './pages/CustomerSummary';
import VehicleDetails from './pages/VehicleDetails';
import VehicleInspection from './pages/VehicleInspection';
import Recommendation from './pages/Recommendation';
import ServiceSelection from './pages/ServiceSelection';
import EstimateBuilder from './pages/EstimateBuilder';
import BillingPOS from './pages/BillingPOS';
import DigitalReport from './pages/DigitalReport';
import ReportsHub from './pages/ReportsHub';
import LoyaltyReports from './pages/LoyaltyReports'; // combined for simplicity
import JobTracker from './pages/JobTracker';

function ProtectedRoute({ children }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="lookup" element={<CustomerLookup />} />
        <Route path="kyc" element={<CustomerKYC />} />
        <Route path="summary" element={<CustomerSummary />} />
        <Route path="vehicle-details" element={<VehicleDetails />} />
        <Route path="inspection" element={<VehicleInspection />} />
        <Route path="recommendation" element={<Recommendation />} />
        <Route path="service-catalog" element={<ServiceSelection />} />
        <Route path="estimate" element={<EstimateBuilder />} />
        <Route path="pos" element={<BillingPOS />} />
        <Route path="reports-hub" element={<ReportsHub />} />
        <Route path="report" element={<DigitalReport />} />
        <Route path="loyalty" element={<LoyaltyReports />} />
        <Route path="jobs" element={<JobTracker />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
