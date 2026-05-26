import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import { Card } from '../components/ui';
import {
  FileText, Eye, CheckCircle2, AlertTriangle,
  Car, User, Calendar, ArrowRight, ClipboardList,
} from 'lucide-react';
import { motion } from 'framer-motion';

const COND_COLOR = {
  good:   '#10b981',
  uneven: '#f59e0b',
  cracks: '#ef4444',
  bulge:  '#f43f5e',
};

function TyreDots({ inspectionData }) {
  const positions = ['FL', 'FR', 'RL', 'RR', 'Spare'];
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {positions.map(pos => {
        const cond = inspectionData?.tyres?.[pos]?.condition || 'good';
        return (
          <span
            key={pos}
            title={`${pos}: ${cond}`}
            style={{
              width: 10, height: 10, borderRadius: '50%',
              background: COND_COLOR[cond] || COND_COLOR.good,
              display: 'inline-block',
            }}
          />
        );
      })}
    </div>
  );
}

const ReportsHub = () => {
  const { jobsDb, currentCustomer, currentVehicle } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'completed'

  const fmt = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
           ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const savedReports = jobsDb.filter(job => job.status === 'Completed' && job.snapshot);
  const filtered = savedReports.filter(j =>
    filter === 'all' ? true : j.status.toLowerCase() === filter
  );

  const hasLiveSession = !!(currentCustomer || currentVehicle);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <FileText className="text-primary-600" size={32} /> Reports
        </h2>
        <p className="text-slate-500 font-medium text-lg mt-2">
          All vehicle inspection reports generated from this device.
        </p>
      </div>

      {/* Live session banner */}
      {hasLiveSession && (
        <motion.div
          initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-r from-primary-600 to-indigo-600 rounded-2xl p-5 flex items-center justify-between shadow-lg shadow-primary-500/20"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base tracking-tight">Current Session Report</p>
              <p className="text-primary-200 text-sm font-medium">
                {currentCustomer?.name || 'Walk-in'} · {currentVehicle ? `${currentVehicle.make} ${currentVehicle.model}` : 'No vehicle'}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/report')}
            className="flex items-center gap-2 bg-white text-primary-700 font-bold px-5 py-2.5 rounded-full text-sm hover:bg-primary-50 transition-colors shadow"
          >
            View Report <ArrowRight size={16} />
          </button>
        </motion.div>
      )}

      {/* Filter tabs + count */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['all', 'pending', 'completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold capitalize transition-all ${
                filter === f
                  ? 'bg-primary-600 text-white shadow'
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-primary-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
          {filtered.length} report{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Report list */}
      {filtered.length === 0 ? (
        <Card className="p-16 text-center border-dashed border-2 border-slate-200 bg-white rounded-3xl">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={28} className="text-slate-400" />
          </div>
          <p className="text-slate-700 font-bold text-lg">No reports found</p>
          <p className="text-slate-400 text-sm mt-1 font-medium">
            Save a vehicle inspection report to see it here.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {[...filtered].reverse().map((job, i) => {
            const hasCritical = job.snapshot?.recommendations?.some(r => r.status === 'replace_now');
            const snap = job.snapshot;
            return (
              <motion.div
                key={job.id}
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`bg-white rounded-2xl shadow-sm border-l-4 hover:shadow-md transition-all ${
                  hasCritical ? 'border-l-red-400' : 'border-l-emerald-400'
                }`}>
                  <div className="p-5 flex items-start gap-4">
                    {/* Status icon */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      hasCritical ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'
                    }`}>
                      {hasCritical
                        ? <AlertTriangle size={20} />
                        : <CheckCircle2 size={20} />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-black text-slate-900 text-base tracking-tight">{job.id}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                              <User size={13} className="text-slate-400" /> {job.customerName}
                              {job.customerMobile && <span className="text-slate-400">· {job.customerMobile}</span>}
                            </span>
                            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                              <Car size={13} className="text-slate-400" />
                              {job.vehicle} {job.vehicleYear && `(${job.vehicleYear})`}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                              <Calendar size={12} /> {fmt(job.date)}
                            </span>
                          </div>
                        </div>

                        {/* Status badge */}
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide shrink-0 ${
                          job.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {job.status}
                        </span>
                      </div>

                      {/* Tyre dots & services summary */}
                      <div className="mt-3 flex flex-wrap items-center gap-4">
                        {snap?.inspectionData && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-semibold">Tyres:</span>
                            <TyreDots inspectionData={snap.inspectionData} />
                          </div>
                        )}
                        {job.items?.length > 0 && (
                          <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2.5 py-0.5 rounded-full">
                            {job.items.length} service item{job.items.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        {hasCritical && (
                          <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full">
                            ⚠ Critical issues
                          </span>
                        )}
                        {snap?.recommendations?.length > 0 && !hasCritical && (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                            ✓ All clear
                          </span>
                        )}
                      </div>
                    </div>

                    {/* View button */}
                    <button
                      onClick={() => navigate('/report', { state: { jobSnapshot: job } })}
                      className="shrink-0 flex items-center gap-1.5 text-sm font-bold text-primary-600 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-xl transition-all"
                    >
                      <Eye size={15} /> View
                    </button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReportsHub;
