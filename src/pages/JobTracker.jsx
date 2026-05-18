import React from 'react';
import { useApp } from '../context/AppProvider';
import { Card, Button } from '../components/ui';
import { Wrench, CheckCircle, Play, Clock, Car, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';

const JobTracker = () => {
  const { jobsDb, updateJobStatus, user } = useApp();

  const pendingJobs = jobsDb.filter(j => j.status === 'Pending');
  const inProgressJobs = jobsDb.filter(j => j.status === 'In Progress');
  const completedJobs = jobsDb.filter(j => j.status === 'Completed');

  const JobCard = ({ job, index }) => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
      <Card className="p-5 shadow-sm border-slate-200 bg-white hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className={`absolute top-0 left-0 w-1.5 h-full ${job.status === 'Completed' ? 'bg-emerald-500' : job.status === 'In Progress' ? 'bg-primary-500' : 'bg-amber-400'}`}></div>
        
        <div className="flex justify-between items-start mb-4">
          <div className="pl-2">
            <div className="flex items-center gap-2 mb-1">
               <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full ${
                  job.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 
                  job.status === 'In Progress' ? 'bg-primary-100 text-primary-700' : 'bg-amber-100 text-amber-700'
               }`}>
                 {job.status}
               </span>
               <span className="text-xs text-slate-400 font-bold">{job.id}</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight mt-1">{job.customerName}</h3>
            <p className="text-sm font-semibold text-slate-500 flex items-center gap-1 mt-1">
              <Car size={14} /> {job.vehicle}
            </p>
          </div>
          <button className="text-slate-300 hover:text-slate-500"><MoreVertical size={18}/></button>
        </div>
        
        <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100 ml-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Service Line Items</p>
          <ul className="space-y-1.5 text-sm font-semibold text-slate-700">
            {job.items?.map((item, i) => (
               <li key={i} className="flex justify-between">
                 <span>{item.name}</span>
                 <span className="text-slate-400">x{item.qty}</span>
               </li>
            ))}
          </ul>
        </div>

        {user?.role === 'Technician' || user?.role === 'Store Manager' ? (
          <div className="mt-4 ml-2">
            {job.status === 'Pending' && (
              <Button className="w-full bg-slate-900 hover:bg-slate-800 rounded-xl h-12 shadow-md shadow-slate-900/20" onClick={() => updateJobStatus(job.id, 'In Progress')}>
                <Play className="mr-2 w-4 h-4 text-primary-400" fill="currentColor" /> Start Work
              </Button>
            )}
            {job.status === 'In Progress' && (
              <Button className="w-full bg-emerald-600 hover:bg-emerald-500 rounded-xl h-12 shadow-md shadow-emerald-500/20 border border-emerald-500" onClick={() => updateJobStatus(job.id, 'Completed')}>
                <CheckCircle className="mr-2 w-5 h-5 text-emerald-100" /> Complete & Unlock POS
              </Button>
            )}
            {job.status === 'Completed' && (
              <div className="w-full bg-slate-50 text-slate-400 rounded-xl h-10 flex items-center justify-center font-bold text-sm border border-slate-100">
                <CheckCircle className="mr-2 w-4 h-4" /> Finished
              </div>
            )}
          </div>
        ) : null}
      </Card>
    </motion.div>
  );

  return (
    <div className="max-w-[1400px] mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 mt-2 px-2">
         <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
               <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 shadow-sm border border-primary-200/50">
                 <Wrench size={24} />
               </div>
               Workshop Floor Control
            </h2>
            <p className="text-slate-500 font-medium text-lg mt-2 leading-relaxed">Manage active service jobs and technician workflows.</p>
         </div>
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 flex gap-2">
            <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-100 flex flex-col items-center">
               <span className="text-xl font-black text-slate-900">{jobsDb.length}</span>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
            </div>
         </div>
      </div>

      {jobsDb.length === 0 ? (
        <Card className="p-16 text-center bg-white/50 border-dashed border-2 rounded-[2rem]">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <Clock size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">Floor is Clear</h3>
          <p className="text-slate-500 font-medium max-w-sm mx-auto">No active jobs found. Approved estimates will automatically appear here.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
          
          {/* Pending Column */}
          <div className="space-y-4">
             <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"></div> Queue
                </h3>
                <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{pendingJobs.length}</span>
             </div>
             {pendingJobs.map((job, i) => <JobCard key={job.id} job={job} index={i} />)}
             {pendingJobs.length === 0 && <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center text-sm font-medium text-slate-400">Empty</div>}
          </div>

          {/* In Progress Column */}
          <div className="space-y-4">
             <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div> In Bay
                </h3>
                <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{inProgressJobs.length}</span>
             </div>
             {inProgressJobs.map((job, i) => <JobCard key={job.id} job={job} index={i} />)}
             {inProgressJobs.length === 0 && <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center text-sm font-medium text-slate-400">Empty</div>}
          </div>

          {/* Completed Column */}
          <div className="space-y-4">
             <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div> Ready
                </h3>
                <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{completedJobs.length}</span>
             </div>
             {completedJobs.map((job, i) => <JobCard key={job.id} job={job} index={i} />)}
             {completedJobs.length === 0 && <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center text-sm font-medium text-slate-400">Empty</div>}
          </div>

        </div>
      )}
    </div>
  );
};

export default JobTracker;
