import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

function RoleRoute({ children, roles }) {
  const { user } = useApp();
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}

function WorkflowRoute({ children, requireCustomer = false, requireVehicle = false, requireEstimate = false, requireApproval = false }) {
  const { currentCustomer, currentVehicle, estimate } = useApp();

  if (requireCustomer && !currentCustomer) return <Navigate to="/lookup" replace />;
  if (requireVehicle && !currentVehicle) return <Navigate to="/vehicle-details" replace />;
  if (requireEstimate && !estimate.items?.length) return <Navigate to="/service-catalog" replace />;
  if (requireApproval && !estimate.managerApproved) return <Navigate to="/estimate" replace />;

  return children;
}

function ReportRoute({ children }) {
  const { currentCustomer, currentVehicle } = useApp();
  const location = useLocation();
  const hasHistoricReport = !!location.state?.jobSnapshot;

  if (!hasHistoricReport && (!currentCustomer || !currentVehicle)) {
    return <Navigate to="/reports-hub" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="lookup" element={<CustomerLookup />} />
        <Route path="kyc" element={<RoleRoute roles={['Store Manager', 'POS Executive']}><CustomerKYC /></RoleRoute>} />
        <Route path="summary" element={<WorkflowRoute requireCustomer><CustomerSummary /></WorkflowRoute>} />
        <Route path="vehicle-details" element={<RoleRoute roles={['Store Manager', 'POS Executive']}><WorkflowRoute requireCustomer><VehicleDetails /></WorkflowRoute></RoleRoute>} />
        <Route path="inspection" element={<RoleRoute roles={['Store Manager', 'Technician']}><WorkflowRoute requireCustomer requireVehicle><VehicleInspection /></WorkflowRoute></RoleRoute>} />
        <Route path="recommendation" element={<WorkflowRoute requireCustomer requireVehicle><Recommendation /></WorkflowRoute>} />
        <Route path="service-catalog" element={<RoleRoute roles={['Store Manager', 'POS Executive']}><WorkflowRoute requireCustomer requireVehicle><ServiceSelection /></WorkflowRoute></RoleRoute>} />
        <Route path="estimate" element={<RoleRoute roles={['Store Manager', 'POS Executive']}><WorkflowRoute requireCustomer requireVehicle requireEstimate><EstimateBuilder /></WorkflowRoute></RoleRoute>} />
        <Route path="pos" element={<RoleRoute roles={['Store Manager', 'POS Executive']}><WorkflowRoute requireCustomer requireVehicle requireEstimate requireApproval><BillingPOS /></WorkflowRoute></RoleRoute>} />
        <Route path="reports-hub" element={<ReportsHub />} />
        <Route path="report" element={<ReportRoute><DigitalReport /></ReportRoute>} />
        <Route path="loyalty" element={<RoleRoute roles={['Store Manager']}><LoyaltyReports /></RoleRoute>} />
        <Route path="jobs" element={<RoleRoute roles={['Store Manager', 'Technician']}><JobTracker /></RoleRoute>} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
