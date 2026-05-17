import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import { Home, Users, Wrench, FileText, ChevronLeft, LogOut, Star } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/lookup': return 'Customer Lookup';
      case '/kyc': return 'Customer KYC';
      case '/summary': return 'Customer 360';
      case '/vehicle-details': return 'Vehicle Info';
      case '/inspection': return 'Vehicle Inspection';
      case '/recommendation': return 'Recommendations';
      case '/service-catalog': return 'Service & Products';
      case '/estimate': return 'Estimate Builder';
      case '/pos': return 'Billing & POS';
      case '/reports-hub': return 'Reports Hub';
      case '/report': return 'Digital Report';
      case '/loyalty': return 'Loyalty & Reports';
      default: return 'Auto Service POS';
    }
  };

  const showBackButton = location.pathname !== '/';

  const roleColor = user?.role === 'Store Manager' ? 'bg-primary-500' 
                  : user?.role === 'Technician' ? 'bg-emerald-500' 
                  : 'bg-purple-500';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0 shadow-sm z-10 relative">
        <div className={`h-1 w-full ${roleColor}`}></div>
        <div className="h-16 flex items-center px-6 border-b border-slate-100 font-bold text-xl text-primary-700 tracking-tight flex-shrink-0">
          Abahaan POS
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <NavItem to="/" icon={<Home size={20} />} label="Dashboard" current={location.pathname === '/'} />
          {user?.role !== 'Technician' && (
            <NavItem to="/lookup" icon={<Users size={20} />} label="Customers" current={location.pathname === '/lookup'} />
          )}
          <NavItem to="/jobs" icon={<Wrench size={20} />} label="Job Floor" current={location.pathname === '/jobs'} />
          <NavItem to="/reports-hub" icon={<FileText size={20} />} label="Reports" current={location.pathname === '/reports-hub' || location.pathname === '/report'} />
          {user?.role === 'Store Manager' && (
             <NavItem to="/loyalty" icon={<Star size={20} />} label="Settings & Loyalty" current={location.pathname === '/loyalty'} />
          )}
        </div>
        <div className="p-4 border-t border-slate-100 mt-auto flex-shrink-0">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 leading-tight">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 leading-tight">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {/* Mobile Header */}
        <div className={`md:hidden h-1 w-full shrink-0 ${roleColor}`}></div>
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-3">
            {showBackButton ? (
              <button 
                onClick={() => navigate(-1)} 
                className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-600 active:scale-95 transition-all"
              >
                <ChevronLeft size={24} />
              </button>
            ) : (
                <div className="md:hidden font-bold text-xl text-primary-700 tracking-tight">Abahaan</div>
            )}
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">{getPageTitle()}</h1>
          </div>
          
          <div className="md:hidden">
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-500">
               <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth pb-24 md:pb-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 pb-safe z-50 px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <MobileNavItem to="/" icon={<Home size={22} />} label="Home" current={location.pathname === '/'} navigate={navigate} />
        {user?.role !== 'Technician' && (
           <MobileNavItem to="/lookup" icon={<Users size={22} />} label="Customer" current={location.pathname === '/lookup'} navigate={navigate} />
        )}
        <MobileNavItem to="/jobs" icon={<Wrench size={22} />} label="Jobs" current={location.pathname === '/jobs'} navigate={navigate} />
        <MobileNavItem to="/reports-hub" icon={<FileText size={22} />} label="Reports" current={location.pathname === '/reports-hub' || location.pathname === '/report'} navigate={navigate} />
      </nav>
    </div>
  );
};

const NavItem = ({ icon, label, to, current }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-sm font-semibold tracking-wide ${
        current 
          ? 'bg-primary-50 text-primary-700' 
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <div className={current ? "text-primary-600" : "text-slate-400"}>{icon}</div>
      {label}
    </button>
  );
};

const MobileNavItem = ({ icon, label, to, current, navigate }) => {
  return (
    <button 
      onClick={() => navigate(to)}
      className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${
        current ? 'text-primary-600' : 'text-slate-500 hover:text-slate-800'
      }`}
    >
      {icon}
      <span className="text-[10px] font-bold tracking-wider uppercase">{label}</span>
    </button>
  );
};

export default Layout;
