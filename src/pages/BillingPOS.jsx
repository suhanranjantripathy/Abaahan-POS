import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import { Button, Card } from '../components/ui';
import { CheckCircle2, ShieldAlert, CreditCard, Banknote, Landmark, Smartphone, ReceiptText, Lock, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

// Utility to load Razorpay script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const BillingPOS = () => {
  const { estimate, setEstimate, completeCheckout, createJob, activeJobId, jobsDb, currentCustomer } = useApp();
  const navigate = useNavigate();
  const [consentGiven, setConsentGiven] = useState(estimate.consent || false);
  const [paymentMode, setPaymentMode] = useState('');

  const cart = estimate.items || [];
  const subtotal = cart.reduce((acc, current) => acc + (current.price * current.qty), 0);
  const taxes = subtotal * 0.18;
  const total = subtotal + taxes;

  const activeJob = jobsDb.find(j => j.id === activeJobId);
  const isJobCompleted = activeJob?.status === 'Completed';

  // Pre-load script for faster checkout
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const handleConsent = (c) => {
    setConsentGiven(c);
    setEstimate({ ...estimate, consent: c });
    if (c && !activeJobId) {
      createJob(); // Send to Job Floor instantly upon consent
    }
  };

  const processSuccess = () => {
    completeCheckout(paymentMode, total);
    alert("Payment successful! Auto-Reminder set for 6 months. Feedback & Review link has been SMS'd to the customer.");
    navigate('/report'); // Auto gen report after checkout
  };

  const handleCheckout = async () => {
    if (!paymentMode || !isJobCompleted) return;

    // If Cash is selected, bypass digital payment gateway
    if (paymentMode === 'Cash') {
      processSuccess();
      return;
    }

    // Scaffolding Razorpay for UPI, Card, NetBank
    const res = await loadRazorpayScript();
    
    if (!res) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    // Options for Razorpay Integration
    const options = {
      key: "rzp_test_YOUR_KEY_HERE", // TODO: Replace with environment variable
      amount: Math.round(total * 100), // Razorpay expects amount in paise
      currency: "INR",
      name: "Abaahan POS",
      description: `Payment for Job ${activeJobId}`,
      image: "https://your-domain.com/logo.png",
      // order_id: "order_9A33XWu170gUtm", // TODO: Fetch from backend Order API
      handler: function (response) {
        // Successful payment callback
        console.log("Razorpay Payment ID:", response.razorpay_payment_id);
        // TODO: Verify signature on backend here
        processSuccess();
      },
      prefill: {
        name: currentCustomer?.name || "Walk-in Customer",
        contact: currentCustomer?.mobile || "",
        email: currentCustomer?.email || "",
      },
      theme: {
        color: "#2563eb", // Matches primary-600
      },
    };

    const paymentObject = new window.Razorpay(options);
    
    paymentObject.on('payment.failed', function (response){
        alert(`Payment Failed! Reason: ${response.error.description}`);
    });

    paymentObject.open();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 mb-20 relative z-0">
      {/* Background aesthetics */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-blob -z-10"></div>
      
      <div className="text-center mb-8 mt-4">
         <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl mx-auto flex items-center justify-center text-white mb-4 shadow-lg shadow-slate-900/20 transform rotate-3">
            <ReceiptText size={32} className="-rotate-3" />
         </motion.div>
         <h2 className="text-4xl font-black text-slate-900 tracking-tight">Order Summary & Checkout</h2>
         <p className="text-slate-500 font-medium text-lg mt-2 leading-relaxed">Review items and secure customer consent.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Itemized List */}
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="lg:col-span-5">
          <Card className="p-6 shadow-xl border-slate-100 rounded-[2rem] bg-white/80 backdrop-blur-xl h-full flex flex-col">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
               Itemized Bill
            </h3>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-6">
              {cart.length === 0 ? (
                <div className="text-center text-slate-400 py-10 font-medium">No items in the estimate.</div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                    <div>
                      <p className="font-bold text-slate-800 leading-tight">{item.name}</p>
                      <p className="text-sm text-slate-500 font-medium mt-1">Qty: {item.qty} x ₹{item.price}</p>
                    </div>
                    <p className="font-bold text-slate-900">₹{(item.price * item.qty).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3 mt-auto">
               <div className="flex justify-between text-slate-600 font-medium">
                 <span>Subtotal</span>
                 <span>₹{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
               </div>
               <div className="flex justify-between text-slate-600 font-medium">
                 <span>GST (18%)</span>
                 <span>₹{taxes.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
               </div>
               <div className="w-full h-px bg-slate-200 my-2"></div>
               <div className="flex justify-between text-xl font-black text-primary-700">
                 <span>Total</span>
                 <span>₹{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
               </div>
            </div>
          </Card>
        </motion.div>

        {/* Right Column: Consent & Payment */}
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="lg:col-span-7">
           <Card className={`p-8 shadow-xl border-2 rounded-[2.5rem] transition-colors relative overflow-hidden h-full ${consentGiven ? 'border-emerald-500 bg-emerald-50/50 backdrop-blur-xl' : 'border-amber-400 bg-amber-50/70 backdrop-blur-xl'}`}>
             <div className="absolute top-10 -right-10 opacity-5 pointer-events-none">
                {consentGiven ? <CheckCircle2 size={250} /> : <ShieldAlert size={250} />}
             </div>
             
             <h3 className="text-2xl font-black mb-6 flex items-center gap-3 tracking-tight z-10 relative">
               {consentGiven ? <span className="text-emerald-600"><CheckCircle2 className="w-8 h-8" /></span> : <span className="text-amber-600"><ShieldAlert className="w-8 h-8" /></span>}
               <span className={consentGiven ? 'text-emerald-900' : 'text-amber-900'}>Customer Consent</span>
             </h3>
             
             {!consentGiven ? (
               <div className="space-y-8 z-10 relative mt-8">
                 <div className="bg-white/60 p-6 rounded-2xl border border-amber-200">
                   <p className="text-amber-900 font-bold text-lg leading-relaxed">
                     The customer has reviewed the estimate. Do they approve the work and the total amount of ₹{total.toLocaleString()}?
                   </p>
                 </div>
                 <div className="flex flex-col sm:flex-row gap-4 pt-4">
                   <Button onClick={() => handleConsent(true)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 text-lg h-16 rounded-2xl border border-emerald-500 transition-all">
                     Approve & Start Job
                   </Button>
                   <Button variant="secondary" className="flex-1 text-lg h-16 rounded-2xl shadow-md border-slate-200 hover:border-slate-300 transition-all bg-white" onClick={() => navigate('/service-catalog')}>
                     Reject & Edit
                   </Button>
                 </div>
               </div>
             ) : (
               <div className="z-10 relative flex flex-col h-full">
                 <p className="text-emerald-700 font-bold text-lg mb-6 flex items-center gap-2 bg-white/50 p-4 rounded-xl border border-emerald-200 shadow-sm">
                   <CheckCircle2 size={24}/> Consent recorded. Job sent to floor.
                 </p>

                 <div className="bg-white p-6 rounded-2xl shadow-lg border border-emerald-100 mt-auto relative">
                    {!isJobCompleted && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-2xl text-slate-800 p-6 text-center border border-slate-200">
                         <Lock size={40} className="text-slate-400 mb-3" />
                         <h4 className="font-bold text-xl mb-1">Billing Locked</h4>
                         <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                           <Clock size={16} className="text-amber-500 animate-pulse" /> Waiting for technician to complete job {activeJobId}.
                         </p>
                      </div>
                    )}
                    
                    <h4 className="font-bold text-slate-900 mb-4 tracking-tight text-lg">Select Payment Mode</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                      {[
                        { id: 'UPI', icon: <Smartphone size={24} /> },
                        { id: 'Card', icon: <CreditCard size={24} /> },
                        { id: 'Cash', icon: <Banknote size={24} /> },
                        { id: 'NetBank', icon: <Landmark size={24} /> }
                      ].map(pm => (
                        <button
                          key={pm.id}
                          onClick={() => setPaymentMode(pm.id)}
                          className={`p-4 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 transition-all font-bold tracking-tight
                            ${paymentMode === pm.id ? 'border-primary-600 bg-primary-50 text-primary-700 ring-4 ring-primary-500/20 scale-105' : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700'}`}
                        >
                          {pm.icon}
                          {pm.id}
                        </button>
                      ))}
                    </div>

                    <Button 
                      size="lg" 
                      className="w-full h-16 text-xl rounded-2xl shadow-xl shadow-primary-500/30 bg-primary-600 hover:bg-primary-500 transition-all" 
                      disabled={!paymentMode}
                      onClick={handleCheckout}
                    >
                      {paymentMode === 'Cash' ? `Collect Cash ₹${total.toLocaleString()}` : `Pay via ${paymentMode} ₹${total.toLocaleString()}`}
                    </Button>
                 </div>
               </div>
             )}
           </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default BillingPOS;
