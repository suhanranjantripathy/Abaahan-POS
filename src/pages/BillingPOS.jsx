import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import { Button, Card, Input } from '../components/ui';
import { CheckCircle2, ShieldAlert, CreditCard, Banknote, Landmark, Smartphone } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const BillingPOS = () => {
  const { estimate, setEstimate, completeCheckout, createJob } = useApp();
  const navigate = useNavigate();
  const [consentGiven, setConsentGiven] = useState(estimate.consent || false);
  const [paymentMode, setPaymentMode] = useState('');

  const cart = estimate.items || [];
  const subtotal = cart.reduce((acc, current) => acc + (current.price * current.qty), 0);
  const taxes = subtotal * 0.18;
  const total = subtotal + taxes;

  const handleConsent = (c) => {
    setConsentGiven(c);
    setEstimate({ ...estimate, consent: c });
  };

  const handleCheckout = () => {
    if (!paymentMode) return;
    completeCheckout(paymentMode, total);
    createJob();
    alert("Payment successful! Auto-Reminder set for 6 months. Feedback & Review link has been SMS'd to the customer.");
    navigate('/report'); // Auto gen report after checkout
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 mb-20">
      <div className="text-center mb-10">
         <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Checkout</h2>
         <p className="text-slate-500 font-medium text-lg mt-2 leading-relaxed">Ensure consent is acquired before processing the payment.</p>
      </div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
         <Card className={`p-8 shadow-lg border-2 rounded-[2rem] transition-colors relative overflow-hidden ${consentGiven ? 'border-emerald-500 bg-emerald-50/30' : 'border-amber-400 bg-amber-50/50'}`}>
           <div className="absolute top-0 right-0 p-8 opacity-10">
              {consentGiven ? <CheckCircle2 size={120} /> : <ShieldAlert size={120} />}
           </div>
           
           <h3 className="text-xl font-bold mb-6 flex items-center gap-3 tracking-tight z-10 relative">
             {consentGiven ? <span className="text-emerald-600"><CheckCircle2 /></span> : <span className="text-amber-600"><ShieldAlert /></span>}
             Customer Consent
           </h3>
           
           {!consentGiven ? (
             <div className="space-y-6 z-10 relative">
               <p className="text-slate-700 font-semibold text-lg leading-relaxed">
                 The customer has reviewed the estimate. Do they approve the work and the total amount of ₹{total.toFixed(2)}?
               </p>
               <div className="flex gap-4">
                 <Button onClick={() => handleConsent(true)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md text-lg h-14 rounded-full">
                   Yes, Approved
                 </Button>
                 <Button variant="danger" className="flex-1 text-lg h-14 rounded-full shadow-md" onClick={() => navigate('/service-catalog')}>
                   Reject & Edit
                 </Button>
               </div>
             </div>
           ) : (
             <div className="z-10 relative">
               <p className="text-emerald-700 font-bold text-lg mb-6 flex items-center gap-2">
                 <CheckCircle2 size={24}/> Consent explicitly recorded for total bill of ₹{total.toFixed(2)}.
               </p>

               <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
                  <h4 className="font-bold text-slate-900 mb-4 tracking-tight">Select Payment Mode</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                      { id: 'UPI', icon: <Smartphone size={24} /> },
                      { id: 'Card', icon: <CreditCard size={24} /> },
                      { id: 'Cash', icon: <Banknote size={24} /> },
                      { id: 'NetBank', icon: <Landmark size={24} /> }
                    ].map(pm => (
                      <button
                        key={pm.id}
                        onClick={() => setPaymentMode(pm.id)}
                        className={`p-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 transition-all font-bold tracking-tight
                          ${paymentMode === pm.id ? 'border-primary-600 bg-primary-50 text-primary-700 ring-4 ring-primary-500/20' : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'}`}
                      >
                        {pm.icon}
                        {pm.id}
                      </button>
                    ))}
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full h-16 text-xl rounded-full shadow-xl shadow-primary-500/30" 
                    disabled={!paymentMode}
                    onClick={handleCheckout}
                  >
                    Generate Invoice & Collect ₹{total.toFixed(2)}
                  </Button>
               </div>
             </div>
           )}
         </Card>
      </motion.div>
    </div>
  );
};

export default BillingPOS;
