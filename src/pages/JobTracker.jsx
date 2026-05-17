import React from 'react';
import { useApp } from '../context/AppProvider';
import { Card, Button } from '../components/ui';
import { Wrench, CheckCircle } from 'lucide-react';

const JobTracker = () => {
  const { jobsDb, updateJobStatus, user } = useApp();

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 mt-4">
      <div className="mb-8">
         <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Wrench className="text-primary-600" size={32} /> Job Execution Floor
         </h2>
         <p className="text-slate-500 font-medium text-lg mt-2 leading-relaxed">Active and completed service jobs.</p>
      </div>

      {jobsDb.length === 0 ? (
        <Card className="p-12 text-center bg-slate-50 border-dashed border-2">
          <p className="text-slate-500 font-bold text-lg">No active jobs found on the floor.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {jobsDb.map(job => (
            <Card key={job.id} className={`p-6 shadow-md border-l-4 rounded-xl ${job.status === 'Completed' ? 'border-emerald-500 bg-emerald-50/20' : 'border-amber-500 bg-white'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">{job.id}</h3>
                  <p className="text-sm font-bold text-slate-500">{job.customerName} - {job.vehicle}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-black uppercase rounded-full ${job.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {job.status}
                </span>
              </div>
              
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Service Items</p>
                <ul className="space-y-1 text-sm font-semibold text-slate-700">
                  {job.items?.map((item, i) => (
                     <li key={i}>• {item.name} x{item.qty}</li>
                  ))}
                </ul>
              </div>

              {job.status === 'Pending' && user?.role === 'Technician' && (
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm" onClick={() => updateJobStatus(job.id, 'Completed')}>
                  <CheckCircle className="mr-2 w-5 h-5" /> Mark Completed
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobTracker;
