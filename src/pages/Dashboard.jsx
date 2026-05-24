import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import { Card } from '../components/ui';
import { Search, UserPlus, ClipboardCheck, FileText, Repeat, Star, PieChart, Bell, Car, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user, inspectionLogs, startInspectionFromLog } = useApp();
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
  const pendingInspections = inspectionLogs.filter(log => ['pending', 'in_progress'].includes(log.status));
  const canStartInspections = user?.role === 'Technician' || user?.role === 'Store Manager';

  const handleStartInspection = (logId) => {
    const selected = startInspectionFromLog(logId);
    if (selected) navigate('/inspection');
  };

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

      {pendingInspections.length > 0 && (
        <Card className="overflow-hidden border-amber-200 bg-white shadow-md">
          <div className="flex items-center justify-between gap-4 border-b border-amber-100 bg-amber-50 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                <Bell size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-slate-900">
                  {canStartInspections ? 'Inspection Pending' : 'Inspection Queue'}
                </h3>
                <p className="text-sm font-semibold text-amber-700">
                  {pendingInspections.length} vehicle{pendingInspections.length !== 1 ? 's' : ''} waiting for technician review
                </p>
              </div>
            </div>
            <span className="hidden rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-700 ring-1 ring-amber-200 sm:inline-flex">
              Live Handoff
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {pendingInspections.map((log, i) => {
              const content = (
                <>
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <Car size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black tracking-tight text-slate-900">{log.vehicleLabel}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          log.status === 'in_progress' ? 'bg-primary-100 text-primary-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {log.status === 'in_progress' ? 'In Progress' : 'Pending'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {log.customerName} · {log.customerMobile || 'No mobile'} · {log.vehicleOdometer || '0'} km
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                        <Clock size={13} /> Added by {log.requestedBy} at {new Date(log.requestedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold shadow-sm ${
                    canStartInspections ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {canStartInspections ? 'Start Inspection' : 'Awaiting Tech'}
                    {canStartInspections && <ArrowRight size={16} />}
                  </span>
                </>
              );

              if (canStartInspections) {
                return (
                  <motion.button
                    key={log.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleStartInspection(log.id)}
                    className="flex w-full flex-col gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    {content}
                  </motion.button>
                );
              }

              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  {content}
                </motion.div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
