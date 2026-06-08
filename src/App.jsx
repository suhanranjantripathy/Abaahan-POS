import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth, useWorkflow } from './context/AppProvider';

import Layout from './components/Layout';
import { PageSkeleton } from './components/Skeleton';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CustomerLookup = lazy(() => import('./pages/CustomerLookup'));
const CustomerKYC = lazy(() => import('./pages/CustomerKYC'));
const CustomerSummary = lazy(() => import('./pages/CustomerSummary'));
const VehicleDetails = lazy(() => import('./pages/VehicleDetails'));
const VehicleInspection = lazy(() => import('./pages/VehicleInspection'));
const Recommendation = lazy(() => import('./pages/Recommendation'));
const ServiceSelection = lazy(() => import('./pages/ServiceSelection'));
const EstimateBuilder = lazy(() => import('./pages/EstimateBuilder'));
const BillingPOS = lazy(() => import('./pages/BillingPOS'));
const DigitalReport = lazy(() => import('./pages/DigitalReport'));
const ReportsHub = lazy(() => import('./pages/ReportsHub'));
const LoyaltyReports = lazy(() => import('./pages/LoyaltyReports'));
const JobTracker = lazy(() => import('./pages/JobTracker'));
const TaxInvoice = lazy(() => import('./pages/TaxInvoice'));
const ServiceAdmin = lazy(() => import('./pages/ServiceAdmin'));
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard'));
const CustomerPortal = lazy(() => import('./pages/CustomerPortal'));
const FeedbackReview = lazy(() => import('./pages/FeedbackReview'));
const LostOpportunities = lazy(() => import('./pages/LostOpportunities'));
const ReminderManagement = lazy(() => import('./pages/ReminderManagement'));
const EmployeeManagement = lazy(() => import('./pages/EmployeeManagement'));

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RoleRoute({ children, roles }) {
  const { user } = useAuth();
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}

function WorkflowRoute({ children, requireCustomer = false, requireVehicle = false, requireEstimate = false, requireApproval = false }) {
  const { currentCustomer, currentVehicle, estimate } = useWorkflow();

  if (requireCustomer && !currentCustomer) return <Navigate to="/lookup" replace />;
  if (requireVehicle && !currentVehicle) return <Navigate to="/vehicle-details" replace />;
  if (requireEstimate && !estimate.items?.length) return <Navigate to="/service-catalog" replace />;
  if (requireApproval && !estimate.managerApproved) return <Navigate to="/estimate" replace />;

  return children;
}

function ReportRoute({ children }) {
  const { currentCustomer, currentVehicle } = useWorkflow();
  const location = useLocation();
  const hasHistoricReport = !!location.state?.jobSnapshot;

  if (!hasHistoricReport && (!currentCustomer || !currentVehicle)) {
    return <Navigate to="/reports-hub" replace />;
  }

  return children;
}

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/portal/:token" element={<CustomerPortal />} />
        
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="lookup" element={<CustomerLookup />} />
          <Route path="kyc" element={<RoleRoute roles={['Store Manager', 'POS Executive']}><CustomerKYC /></RoleRoute>} />
          <Route path="summary" element={<WorkflowRoute requireCustomer><CustomerSummary /></WorkflowRoute>} />
          <Route path="vehicle-details" element={<RoleRoute roles={['Store Manager', 'POS Executive']}><WorkflowRoute requireCustomer><VehicleDetails /></WorkflowRoute></RoleRoute>} />
          <Route path="inspection" element={<RoleRoute roles={['Store Manager', 'Technician']}><WorkflowRoute requireCustomer requireVehicle><VehicleInspection /></WorkflowRoute></RoleRoute>} />
          <Route path="recommendation" element={<WorkflowRoute requireCustomer requireVehicle><Recommendation /></WorkflowRoute>} />
          <Route path="service-catalog" element={<RoleRoute roles={['POS Executive']}><WorkflowRoute requireCustomer requireVehicle><ServiceSelection /></WorkflowRoute></RoleRoute>} />
          <Route path="estimate" element={<RoleRoute roles={['Store Manager', 'POS Executive']}><WorkflowRoute requireCustomer requireVehicle requireEstimate><EstimateBuilder /></WorkflowRoute></RoleRoute>} />
          <Route path="pos" element={<RoleRoute roles={['POS Executive']}><WorkflowRoute requireCustomer requireVehicle requireEstimate requireApproval><BillingPOS /></WorkflowRoute></RoleRoute>} />
          <Route path="reports-hub" element={<ReportsHub />} />
          <Route path="report" element={<ReportRoute><DigitalReport /></ReportRoute>} />
          <Route path="invoice" element={<RoleRoute roles={['POS Executive']}><TaxInvoice /></RoleRoute>} />
          <Route path="feedback" element={<RoleRoute roles={['POS Executive']}><FeedbackReview /></RoleRoute>} />
          <Route path="lost-opportunities" element={<RoleRoute roles={['Store Manager', 'POS Executive']}><LostOpportunities /></RoleRoute>} />
          <Route path="reminders" element={<RoleRoute roles={['Store Manager', 'POS Executive']}><ReminderManagement /></RoleRoute>} />
          <Route path="loyalty" element={<RoleRoute roles={['Store Manager']}><LoyaltyReports /></RoleRoute>} />
          <Route path="admin" element={<RoleRoute roles={['Store Manager']}><ServiceAdmin /></RoleRoute>} />
          <Route path="employees" element={<RoleRoute roles={['Store Manager']}><EmployeeManagement /></RoleRoute>} />
          <Route path="analytics" element={<RoleRoute roles={['Store Manager']}><AnalyticsDashboard /></RoleRoute>} />
          <Route path="jobs" element={<RoleRoute roles={['Store Manager', 'Technician']}><JobTracker /></RoleRoute>} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
