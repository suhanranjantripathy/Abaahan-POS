import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflow, useData } from '../context/AppProvider';
import { APP_BRAND, EXTERNAL_SERVICES } from '../config/appConfig';
import { Button } from '../components/ui';
import { Printer, ChevronRight } from 'lucide-react';

const TaxInvoice = () => {
  const { activeJobId } = useWorkflow();
  const { jobsDb, rewardRules } = useData();
  const navigate = useNavigate();

  const activeJob = jobsDb.find(j => j.id === activeJobId);

  if (!activeJob) {
    return (
      <div className="text-center p-12">
        <p className="text-slate-500 mb-4">No active invoice found.</p>
        <Button onClick={() => navigate('/reports-hub')}>Go to Reports</Button>
      </div>
    );
  }

  const { snapshot } = activeJob;
  const estimate = snapshot?.estimate || activeJob.estimate || {};
  const cart = estimate.items || [];
  const warranties = estimate.warranties || [];
  const subtotal = cart.reduce((acc, current) => acc + (current.price * current.qty), 0);
  const loyaltyApplied = estimate.loyaltyApplied || 0;
  const discount = loyaltyApplied * (rewardRules?.pointValue || 1);
  const taxableAmount = Math.max(0, subtotal - discount);
  const cgst = taxableAmount * 0.09;
  const sgst = taxableAmount * 0.09;
  const total = taxableAmount + cgst + sgst;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto my-8 relative">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-2xl font-black text-slate-800">Tax Invoice</h2>
        <div className="flex gap-4">
          <Button variant="secondary" onClick={handlePrint} className="bg-white border-slate-200">
            <Printer className="mr-2" size={18} /> Print
          </Button>
          <Button onClick={() => navigate('/report')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            View Digital Report <ChevronRight className="ml-2" size={18} />
          </Button>
          <Button onClick={() => navigate('/feedback')} className="bg-amber-500 hover:bg-amber-600 text-white">
            Feedback <ChevronRight className="ml-2" size={18} />
          </Button>
        </div>
      </div>

      <div className="bg-white p-8 md:p-12 shadow-2xl rounded-2xl print:shadow-none print:p-0 print:bg-transparent">
        {/* Invoice Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-200 pb-8 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{APP_BRAND.posName}</h1>
            <p className="text-slate-500 font-medium text-sm mt-1">{APP_BRAND.tagline}</p>
            <div className="mt-4 text-sm text-slate-600 space-y-1">
              <p>123 Auto Avenue, Motor City</p>
              <p>State: Maharashtra (27)</p>
              <p className="font-bold text-slate-800 mt-2">GSTIN: 27AABCU9603R1ZM</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-light text-slate-300 uppercase tracking-widest mb-4">Invoice</h2>
            <div className="text-sm space-y-1">
              <p><span className="text-slate-400 font-bold mr-2">Invoice No:</span> <span className="font-bold text-slate-900">{activeJob.id}</span></p>
              <p><span className="text-slate-400 font-bold mr-2">Date:</span> <span className="font-bold text-slate-900">{new Date(activeJob.date).toLocaleDateString()}</span></p>
              <p><span className="text-slate-400 font-bold mr-2">Payment Mode:</span> <span className="font-bold text-emerald-600 uppercase tracking-widest">{estimate.paymentMode || 'Cash'}</span></p>
            </div>
          </div>
        </div>

        {/* Customer & Vehicle Details */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Billed To</h3>
            <p className="font-black text-lg text-slate-900">{activeJob.customerName}</p>
            <p className="text-slate-600 font-medium mt-1">Mobile: {activeJob.customerMobile}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Vehicle Info</h3>
            <p className="font-black text-lg text-slate-900">{activeJob.vehicle}</p>
            <p className="text-slate-600 font-medium mt-1">{activeJob.vehicleYear} • {activeJob.vehicleFuelType} • {activeJob.vehicleOdometer} km</p>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 uppercase text-xs font-extrabold tracking-widest print:bg-slate-50">
                <th className="p-3 border border-slate-200">#</th>
                <th className="p-3 border border-slate-200">Description / Service</th>
                <th className="p-3 border border-slate-200 text-center">Qty</th>
                <th className="p-3 border border-slate-200 text-right">Unit Price</th>
                <th className="p-3 border border-slate-200 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, i) => (
                <tr key={i} className="text-sm font-medium text-slate-800">
                  <td className="p-3 border border-slate-200 text-center">{i + 1}</td>
                  <td className="p-3 border border-slate-200">
                    <p className="font-bold text-slate-900">{item.name}</p>
                    {item.category && <p className="text-[10px] uppercase text-slate-400 tracking-wider mt-1">{item.category}</p>}
                  </td>
                  <td className="p-3 border border-slate-200 text-center">{item.qty}</td>
                  <td className="p-3 border border-slate-200 text-right">{item.price.toFixed(2)}</td>
                  <td className="p-3 border border-slate-200 text-right font-bold">{(item.price * item.qty).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-12">
          <div className="w-full md:w-80">
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-2 text-slate-600 font-bold">Subtotal</td>
                  <td className="py-2 text-right font-bold text-slate-900">₹{subtotal.toFixed(2)}</td>
                </tr>
                {discount > 0 && (
                  <tr>
                    <td className="py-2 text-emerald-600 font-bold">Loyalty Discount ({loyaltyApplied} pts)</td>
                    <td className="py-2 text-right font-bold text-emerald-600">-₹{discount.toFixed(2)}</td>
                  </tr>
                )}
                <tr>
                  <td className="py-2 text-slate-600 font-medium">CGST @ 9%</td>
                  <td className="py-2 text-right font-medium text-slate-700">₹{cgst.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-600 font-medium">SGST @ 9%</td>
                  <td className="py-2 text-right font-medium text-slate-700">₹{sgst.toFixed(2)}</td>
                </tr>
                <tr className="border-t-2 border-slate-800">
                  <td className="py-3 text-lg font-black text-slate-900 uppercase tracking-widest">Total</td>
                  <td className="py-3 text-right text-xl font-black text-slate-900">₹{total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {warranties.length > 0 && (
          <div className="mb-10">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Warranty & Serial Numbers</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {warranties.map((warranty, index) => (
                <div key={`${warranty.itemId}-${index}`} className="border border-slate-200 rounded-xl p-3 text-sm">
                  <p className="font-black text-slate-900">{warranty.itemName}</p>
                  <p className="text-slate-600 font-medium">Serial: {warranty.serialNumber}</p>
                  <p className="text-emerald-700 font-bold">
                    {warranty.warranty}
                    {warranty.warrantyEnd ? `, valid until ${new Date(warranty.warrantyEnd).toLocaleDateString()}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {estimate.portalLink && (
          <div className="mb-10 rounded-xl border border-primary-100 bg-primary-50 p-4">
            <p className="text-xs font-black text-primary-700 uppercase tracking-widest mb-1">Customer Portal</p>
            <p className="text-sm font-bold text-slate-800 break-all">{estimate.portalLink}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-200 pt-8 text-center text-sm text-slate-500">
          <p className="font-bold text-slate-700 mb-1">Thank you for your business!</p>
          <p>For any queries, contact {EXTERNAL_SERVICES.emailFrom}</p>
          <p className="mt-4 text-[10px] uppercase tracking-widest text-slate-400">Computer Generated Invoice • No Signature Required</p>
        </div>
      </div>
    </div>
  );
};

export default TaxInvoice;
