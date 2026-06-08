import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { APP_BRAND } from '../config/appConfig';
import { useData } from '../context/AppProvider';
import { Card } from '../components/ui';
import { ShieldCheck, ReceiptText, Wrench, Gift } from 'lucide-react';
import { portalService } from '../services/portalService';

const decodePortalToken = (token = '') => {
  try {
    const normalized = token.replaceAll('-', '+').replaceAll('_', '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return atob(padded).split(':')[0];
  } catch {
    return decodeURIComponent(token).split(':')[0];
  }
};

const CustomerPortal = () => {
  const { token } = useParams();
  const { customersDb, jobsDb, isLoading, useRemoteData } = useData();
  const [remotePortal, setRemotePortal] = useState(null);
  const [remoteError, setRemoteError] = useState('');
  const [isResolvingPortal, setIsResolvingPortal] = useState(false);
  const customerId = remotePortal?.customer?.id || (!useRemoteData ? decodePortalToken(token) : '');
  const remoteJob = remotePortal?.job ? {
    id: remotePortal.job.id,
    customerId: remotePortal.job.customer_id,
    vehicleId: remotePortal.job.vehicle_id,
    status: remotePortal.job.status,
    items: remotePortal.job.items || [],
    snapshot: remotePortal.job.snapshot || {},
    date: remotePortal.job.created_at,
    savedAt: remotePortal.job.updated_at,
    customerName: remotePortal.job.snapshot?.customerName || remotePortal.customer?.name || '',
    customerMobile: remotePortal.job.snapshot?.customerMobile || remotePortal.customer?.mobile || '',
    vehicle: remotePortal.job.snapshot?.vehicleLabel || 'Vehicle',
  } : null;
  const customer = remotePortal?.customer || customersDb.find(item => String(item.id) === String(customerId));
  const reports = [
    ...(remoteJob ? [remoteJob] : []),
    ...jobsDb.filter(job => String(job.customerId || job.snapshot?.customerId) === String(customerId)),
  ]
    .sort((a, b) => new Date(b.date || b.savedAt) - new Date(a.date || a.savedAt));
  const latest = reports[0];
  const estimate = latest?.snapshot?.estimate || {};
  const warranties = estimate.warranties || [];

  useEffect(() => {
    let cancelled = false;
    const resolveRemote = async () => {
      try {
        setIsResolvingPortal(true);
        const resolved = await portalService.resolve(token);
        if (!cancelled && resolved) setRemotePortal(resolved);
      } catch (e) {
        if (!cancelled) setRemoteError(e.message || 'Portal link could not be verified.');
      } finally {
        if (!cancelled) setIsResolvingPortal(false);
      }
    };
    if (useRemoteData) {
      resolveRemote();
    }
    return () => {
      cancelled = true;
    };
  }, [token, useRemoteData]);

  if (isLoading || (useRemoteData && isResolvingPortal)) {
    return <div className="min-h-screen bg-slate-50 grid place-items-center text-slate-500 font-bold">Loading customer portal...</div>;
  }

  if (!customer && !latest) {
    return (
      <div className="min-h-screen bg-slate-50 grid place-items-center p-6">
        <Card className="max-w-md p-8 text-center">
          <h1 className="text-2xl font-black text-slate-900">Portal Link Not Found</h1>
          <p className="text-slate-500 font-medium mt-2">{remoteError || 'This report link is unavailable or has expired.'}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-5 py-5 flex justify-between items-center">
          <div>
            <p className="text-sm font-black text-primary-600 uppercase tracking-widest">{APP_BRAND.posName}</p>
            <h1 className="text-2xl font-black tracking-tight">Customer Portal</h1>
          </div>
          <div className="text-right">
            <p className="font-bold">{customer?.name || latest?.customerName || 'Customer'}</p>
            <p className="text-sm text-slate-500">{customer?.mobile || latest?.customerMobile}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 py-8 space-y-6">
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-5">
            <ReceiptText className="text-primary-600 mb-3" />
            <p className="text-xs font-black text-slate-400 uppercase">Reports</p>
            <p className="text-2xl font-black">{reports.length}</p>
          </Card>
          <Card className="p-5">
            <Wrench className="text-amber-600 mb-3" />
            <p className="text-xs font-black text-slate-400 uppercase">Last Status</p>
            <p className="text-lg font-black">{latest?.status || 'No Visit'}</p>
          </Card>
          <Card className="p-5">
            <ShieldCheck className="text-emerald-600 mb-3" />
            <p className="text-xs font-black text-slate-400 uppercase">Warranties</p>
            <p className="text-2xl font-black">{warranties.length}</p>
          </Card>
          <Card className="p-5">
            <Gift className="text-purple-600 mb-3" />
            <p className="text-xs font-black text-slate-400 uppercase">Loyalty</p>
            <p className="text-2xl font-black">{customer?.loyalty || 0}</p>
          </Card>
        </div>

        {latest && (
          <Card className="p-6">
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-xl font-black">Latest Visit</h2>
                <p className="text-slate-500 font-medium">{latest.vehicle}</p>
              </div>
              <p className="text-sm font-bold text-slate-500">{new Date(latest.date || latest.savedAt).toLocaleDateString()}</p>
            </div>
            <div className="space-y-3">
              {(estimate.approvedItems || latest.items || []).map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex justify-between gap-4 rounded-xl bg-slate-50 p-3">
                  <div>
                    <p className="font-bold">{item.name}</p>
                    <p className="text-sm text-slate-500">Qty {item.qty}</p>
                  </div>
                  <p className="font-black">₹{((item.price || 0) * (item.qty || 1)).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {warranties.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-black mb-4">Warranty Records</h2>
            <div className="space-y-3">
              {warranties.map((warranty, index) => (
                <div key={`${warranty.itemId}-${index}`} className="rounded-xl border border-slate-200 p-4">
                  <p className="font-black">{warranty.itemName}</p>
                  <p className="text-sm text-slate-500 font-medium">Serial: {warranty.serialNumber}</p>
                  <p className="text-sm text-emerald-700 font-bold">
                    {warranty.warranty}
                    {warranty.warrantyEnd ? `, valid until ${new Date(warranty.warrantyEnd).toLocaleDateString()}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default CustomerPortal;
