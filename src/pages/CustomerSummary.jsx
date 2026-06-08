import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useData, useWorkflow } from '../context/AppProvider';
import { Button, Card } from '../components/ui';
import { User, Car, Clock, RotateCcw, AlertCircle, PlusCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const CustomerSummary = () => {
  const { currentCustomer, setCurrentVehicle, inspectionCompleted, startInspectionForVehicle } = useWorkflow();
  const { jobsDb } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('vehicles');

  const customerJobs = useMemo(() => jobsDb.filter(job =>
    currentCustomer && (
      String(job.customerId || job.snapshot?.customerId) === String(currentCustomer.id) ||
      job.customerMobile === currentCustomer.mobile
    )
  ), [currentCustomer, jobsDb]);

  if (!currentCustomer) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">No Customer Selected</h2>
        <Button onClick={() => navigate('/lookup')}>Go to Lookup</Button>
      </div>
    );
  }

  const startInspection = async (vehicle) => {
    const started = await startInspectionForVehicle(vehicle);
    if (started) navigate('/inspection');
  };

  const viewAdvisory = (vehicle) => {
    setCurrentVehicle(vehicle);
    navigate('/recommendation');
  };

  const warranties = customerJobs.flatMap(job =>
    (job.snapshot?.estimate?.warranties || []).map(warranty => ({ ...warranty, jobId: job.id }))
  );

  const pendingRecommendations = customerJobs
    .flatMap(job => (job.snapshot?.recommendations || []).map(rec => ({ ...rec, jobId: job.id })))
    .filter(rec => rec.status === 'replace_now' || rec.recheckDate);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
         <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Customer 360° Profile</h2>
            <p className="text-slate-500 font-medium text-lg mt-1">Comprehensive view of {currentCustomer.name}'s history.</p>
         </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Customer Details */}
        <div className="md:col-span-1 space-y-6">
          <Card className="p-6 border-slate-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-2xl tracking-tighter shadow-sm border border-slate-200">
                {currentCustomer.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">{currentCustomer.name}</h3>
                <p className="text-slate-500 font-medium leading-tight">{currentCustomer.mobile}</p>
                <div className="flex items-center gap-1 mt-1 text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md inline-flex">
                   <CheckCircle2 size={12} /> Consent OK
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">City</span>
                <span className="font-semibold text-slate-800">{currentCustomer.city}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Email</span>
                <span className="font-semibold text-slate-800">{currentCustomer.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Loyalty Pts</span>
                <span className="font-extrabold text-amber-500">{currentCustomer.loyalty || 0} pts</span>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 border-orange-200 bg-orange-50">
            <div className="flex items-center gap-2 mb-4 text-orange-700 font-bold tracking-tight">
              <AlertCircle size={20} /> Pending Recommendations
            </div>
            {currentCustomer.pendingRecommendations?.length > 0 ? (
              <ul className="space-y-3">
                 {currentCustomer.pendingRecommendations.map((r, idx) => (
                   <li key={idx} className="bg-white p-3 rounded-lg shadow-sm border border-orange-100 text-sm font-semibold flex justify-between items-center text-slate-800">
                     <span>{r.item}</span> <span className="text-orange-600">{r.due}</span>
                   </li>
                 ))}
              </ul>
            ) : (
              <p className="text-slate-600 font-medium text-sm">No pending items. Customer vehicle is healthy.</p>
            )}
          </Card>
        </div>

        {/* Right Column: Vehicles and History */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex gap-2 mb-6 overflow-x-auto">
              {[
                ['vehicles', 'Vehicles'],
                ['inspections', 'Past Inspections'],
                ['purchases', 'Purchase History'],
                ['warranty', 'Warranty'],
                ['recommendations', 'Pending Recommendations'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap ${
                    activeTab === id ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 'vehicles' && (
              <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2 tracking-tight">
                <Car className="text-primary-600" /> Registered Vehicles
              </h3>
              <Button onClick={() => navigate('/vehicle-details')} variant="secondary" size="sm" className="hidden sm:flex">
                <PlusCircle size={16} className="mr-1" /> Add Vehicle
              </Button>
            </div>

            {currentCustomer.vehicles?.length > 0 ? (
              <div className="space-y-4">
                {currentCustomer.vehicles.map((v, i) => {
                  const isPOS = user?.role === 'POS Executive';
                  return (
                    <motion.div initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} transition={{delay: i * 0.1}} key={i} className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border-2 border-slate-100 bg-slate-50 hover:border-primary-200 transition-colors gap-4">
                      <div className="w-full sm:w-auto">
                        <h4 className="font-bold text-lg text-slate-900 tracking-tight">{v.make} {v.model}</h4>
                        <p className="text-sm text-slate-500 font-medium">{v.year} • {v.fuelType} • {v.odometer} km</p>
                      </div>
                      
                      {isPOS ? (
                        inspectionCompleted ? (
                          <Button onClick={() => viewAdvisory(v)} className="w-full sm:w-auto whitespace-nowrap bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md">
                            View Advisory &amp; Estimate
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-pulse">
                              <span>🕐</span> Pending Inspection
                            </span>
                            <Button disabled className="w-full sm:w-auto whitespace-nowrap bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed">
                              Awaiting Tech
                            </Button>
                          </div>
                        )
                      ) : (
                        <Button onClick={() => startInspection(v)} className="w-full sm:w-auto whitespace-nowrap">
                          {inspectionCompleted ? 'View/Edit Inspection' : 'Start Inspection'}
                        </Button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                <p className="text-slate-500 font-medium mb-4">No vehicles linked to this customer.</p>
                <Button onClick={() => navigate('/vehicle-details')} variant="secondary">Add Vehicle Now</Button>
              </div>
            )}
              </>
            )}

            {activeTab === 'inspections' && (
              <HistoryList
                empty="No inspection history yet."
                items={customerJobs.filter(job => job.snapshot?.inspectionData).map(job => ({
                  title: `${job.vehicle} · ${job.status}`,
                  meta: new Date(job.date || job.savedAt).toLocaleString('en-IN'),
                  action: () => navigate('/report', { state: { jobSnapshot: job } }),
                }))}
              />
            )}

            {activeTab === 'purchases' && (
              <HistoryList
                empty="No purchases yet."
                items={customerJobs.filter(job => job.snapshot?.estimate?.isPaid).flatMap(job =>
                  (job.snapshot?.estimate?.items || []).map(item => ({
                    title: `${item.name} x${item.qty}`,
                    meta: `${job.id} · ₹${((item.price || 0) * (item.qty || 1)).toLocaleString('en-IN')}`,
                    action: () => navigate('/invoice'),
                  }))
                )}
              />
            )}

            {activeTab === 'warranty' && (
              <HistoryList
                empty="No warranty records yet."
                items={warranties.map(warranty => ({
                  title: warranty.itemName,
                  meta: `Serial ${warranty.serialNumber || 'N/A'} · ${warranty.warrantyEnd ? `Valid until ${new Date(warranty.warrantyEnd).toLocaleDateString('en-IN')}` : warranty.warranty}`,
                }))}
              />
            )}

            {activeTab === 'recommendations' && (
              <HistoryList
                empty="No pending recommendations."
                items={pendingRecommendations.map(rec => ({
                  title: rec.text,
                  meta: rec.recheckDate ? `Recheck ${new Date(rec.recheckDate).toLocaleDateString('en-IN')}` : 'Immediate action',
                }))}
              />
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-6 tracking-tight">
              <RotateCcw className="text-slate-400" /> Past Interactions
            </h3>
            {currentCustomer.pastInspections?.length > 0 ? (
              <div>List past jobs...</div>
            ) : (
              <div className="text-center p-6 bg-slate-50 rounded-xl">
                 <p className="text-slate-500 font-medium text-sm">New customer, no visit history.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

function HistoryList({ items, empty }) {
  if (!items.length) {
    return (
      <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
        <p className="text-slate-500 font-medium">{empty}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <button
          key={`${item.title}-${index}`}
          onClick={item.action}
          disabled={!item.action}
          className="w-full text-left rounded-xl border border-slate-100 bg-slate-50 p-4 hover:border-primary-200 disabled:hover:border-slate-100"
        >
          <p className="font-black text-slate-900">{item.title}</p>
          <p className="text-sm font-semibold text-slate-500 mt-1">{item.meta}</p>
        </button>
      ))}
    </div>
  );
}

export default CustomerSummary;
