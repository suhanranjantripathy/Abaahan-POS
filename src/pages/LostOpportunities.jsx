import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData, useWorkflow } from '../context/AppProvider';
import { Button, Card } from '../components/ui';
import { CalendarClock, FileX, IndianRupee, RotateCcw, Search } from 'lucide-react';

const getEstimateValue = (job) => {
  const items = job.snapshot?.estimate?.items || job.items || [];
  return items.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 1)), 0) * 1.18;
};

const LostOpportunities = () => {
  const { jobsDb, createReminder } = useData();
  const { setCurrentCustomer, setCurrentVehicle, setEstimate } = useWorkflow();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const rows = useMemo(() => jobsDb
    .filter(job => job.status === 'Lost Opportunity')
    .filter(job => {
      const haystack = `${job.customerName} ${job.customerMobile} ${job.vehicle} ${job.snapshot?.estimate?.decisionRemarks || ''}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    })
    .sort((a, b) => new Date(b.date || b.savedAt) - new Date(a.date || a.savedAt)), [jobsDb, query]);

  const totalValue = rows.reduce((sum, job) => sum + getEstimateValue(job), 0);
  const topRejected = Object.values(rows.flatMap(job => job.snapshot?.estimate?.items || [])
    .reduce((acc, item) => {
      acc[item.name] = acc[item.name] || { name: item.name, count: 0, value: 0 };
      acc[item.name].count += item.qty || 1;
      acc[item.name].value += (item.price || 0) * (item.qty || 1);
      return acc;
    }, {})).sort((a, b) => b.value - a.value).slice(0, 5);

  const scheduleReminder = async (job) => {
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + 2);
    await createReminder({
      customerId: job.customerId,
      vehicleId: job.vehicleId,
      jobId: job.id,
      customerName: job.customerName,
      customerMobile: job.customerMobile,
      vehicleLabel: job.vehicle,
      type: 'lost_opportunity_recovery',
      source: 'lost_opportunity',
      title: `Recover estimate for ${job.customerName}`,
      notes: job.snapshot?.estimate?.decisionRemarks || 'Follow up on rejected estimate.',
      dueAt: dueAt.toISOString(),
    });
  };

  const reopenEstimate = (job) => {
    setCurrentCustomer(job.snapshot?.customer || { id: job.customerId, name: job.customerName, mobile: job.customerMobile });
    setCurrentVehicle(job.snapshot?.vehicle || { id: job.vehicleId, make: job.vehicle?.split(' ')[0] || '', model: job.vehicle?.split(' ').slice(1).join(' ') || '' });
    setEstimate({ ...(job.snapshot?.estimate || {}), consent: null, customerDecision: '', managerApproved: true });
    navigate('/estimate');
  };

  const exportCsv = () => {
    const header = ['Job ID', 'Customer', 'Mobile', 'Vehicle', 'Value', 'Remarks', 'Date'];
    const lines = rows.map(job => [
      job.id,
      job.customerName,
      job.customerMobile,
      job.vehicle,
      Math.round(getEstimateValue(job)),
      job.snapshot?.estimate?.decisionRemarks || '',
      new Date(job.date || job.savedAt).toISOString(),
    ]);
    const csv = [header, ...lines].map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lost-opportunities.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <FileX className="text-red-500" /> Lost Opportunities
          </h2>
          <p className="text-slate-500 font-medium mt-1">Rejected estimates, recovery actions, and lost value.</p>
        </div>
        <Button onClick={exportCsv} variant="secondary">Export CSV</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Lost Count</p>
          <p className="text-3xl font-black text-slate-900">{rows.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Lost Value</p>
          <p className="text-3xl font-black text-red-600 flex items-center"><IndianRupee />{Math.round(totalValue).toLocaleString('en-IN')}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Top Rejected</p>
          <p className="text-lg font-black text-slate-900">{topRejected[0]?.name || 'No data'}</p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="h-12 w-full rounded-xl border border-slate-200 pl-10 pr-3 font-semibold outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Search customer, mobile, vehicle, remarks..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </Card>

      <div className="space-y-3">
        {rows.map(job => (
          <Card key={job.id} className="p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <p className="font-black text-slate-900">{job.customerName} · {job.vehicle}</p>
                <p className="text-sm font-semibold text-slate-500">{job.customerMobile || 'No mobile'} · {new Date(job.date || job.savedAt).toLocaleString('en-IN')}</p>
                <p className="text-sm font-bold text-red-600 mt-2">{job.snapshot?.estimate?.decisionRemarks || 'No rejection reason captured.'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => reopenEstimate(job)} className="gap-1"><RotateCcw size={14} /> Reopen</Button>
                <Button size="sm" variant="secondary" onClick={() => scheduleReminder(job)} className="gap-1"><CalendarClock size={14} /> Schedule Reminder</Button>
              </div>
            </div>
          </Card>
        ))}
        {rows.length === 0 && (
          <Card className="p-12 text-center border-dashed border-2">
            <p className="font-bold text-slate-500">No lost opportunities found.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LostOpportunities;
