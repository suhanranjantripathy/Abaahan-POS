import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import { Card } from '../components/ui';
import { Search, UserPlus, ClipboardCheck, FileText, Repeat, Star, PieChart } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user } = useApp();
  const navigate = useNavigate();

  const tiles = [
    { title: 'New Customer', icon: <UserPlus className="w-8 h-8" />, desc: 'Register for service', path: '/kyc', color: 'bg-blue-500 text-white', delay: 0, roles: ['Store Manager', 'POS Executive'] },
    { title: 'Existing Customer', icon: <Search className="w-8 h-8" />, desc: 'Lookup & view 360 profile', path: '/lookup', color: 'bg-indigo-500 text-white', delay: 0.1, roles: ['Store Manager', 'POS Executive', 'Technician'] },
    { title: 'Vehicle Inspection', icon: <ClipboardCheck className="w-8 h-8" />, desc: 'Perform visual inspection', path: '/inspection', color: 'bg-emerald-500 text-white', delay: 0.2, roles: ['Store Manager', 'Technician'] },
    { title: 'Billing & POS', icon: <FileText className="w-8 h-8" />, desc: 'Checkout & invoices', path: '/pos', color: 'bg-purple-500 text-white', delay: 0.3, roles: ['Store Manager', 'POS Executive'] },
    { title: 'Repeat Visit', icon: <Repeat className="w-8 h-8" />, desc: 'Quick service for existing', path: '/lookup', color: 'bg-orange-500 text-white', delay: 0.4, roles: ['Store Manager', 'POS Executive'] },
    { title: 'Loyalty Program', icon: <Star className="w-8 h-8" />, desc: 'Redeem points & discounts', path: '/loyalty', color: 'bg-amber-500 text-white', delay: 0.5, roles: ['Store Manager'] },
    { title: 'Reports', icon: <PieChart className="w-8 h-8" />, desc: 'Analytics & conversion', path: '/reports-hub', color: 'bg-slate-700 text-white', delay: 0.6, roles: ['Store Manager', 'Technician'] },
  ];

  const visibleTiles = tiles.filter(t => !user?.role || t.roles.includes(user.role));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
           <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Hello, {user?.name || 'User'}!</h2>
           <p className="text-slate-500 font-medium">What would you like to do today? Select a common workflow.</p>
        </div>
        
        {user?.role !== 'Technician' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 px-5 flex items-center gap-4 w-full md:w-auto">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Today's Revenue</p>
              <p className="text-lg font-extrabold text-slate-900">₹45,200</p>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Inspections</p>
              <p className="text-lg font-extrabold text-primary-600">12</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {visibleTiles.map((tile, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <button
              onClick={() => navigate(tile.path)}
              className="w-full text-left h-full group"
            >
              <Card className="h-full p-5 lg:p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-slate-100 rounded-2xl flex flex-col items-start gap-4 bg-white hover:border-primary-200 overflow-hidden relative">
                <div className={`p-3 rounded-2xl ${tile.color} shadow-md`}>
                  {tile.icon}
                </div>
                <div className="mt-2">
                  <h3 className="font-bold text-lg text-slate-900 mb-1 group-hover:text-primary-600 transition-colors tracking-tight leading-tight">{tile.title}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-snug">{tile.desc}</p>
                </div>
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-slate-50 rounded-full -z-10 group-hover:scale-110 transition-transform"></div>
              </Card>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
