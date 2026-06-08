import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflow, useData } from '../context/AppProvider';
import { Button, Card } from '../components/ui';
import { APP_BRAND, EXTERNAL_SERVICES } from '../config/appConfig';
import { CheckCircle2, ShieldAlert, CreditCard, Banknote, Landmark, Smartphone, ReceiptText, Lock, Clock, Star, CalendarClock, FileX, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '../components/toast';

// Utility to load Razorpay script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = EXTERNAL_SERVICES.razorpayScriptUrl;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const BillingPOS = () => {
  const { estimate, setEstimate, completeCheckout, activeJobId, currentCustomer, recordCustomerDecision } = useWorkflow();
  const { jobsDb, rewardRules } = useData();
  const navigate = useNavigate();
  const [consentGiven, setConsentGiven] = useState(estimate.consent || false);
  const [paymentMode, setPaymentMode] = useState('');
  const [decisionMode, setDecisionMode] = useState(null);
  const [decisionRemarks, setDecisionRemarks] = useState(estimate.decisionRemarks || '');
  const [reminderDate, setReminderDate] = useState(estimate.reminderDate || '');
  const [decisionSaving, setDecisionSaving] = useState(false);
  const [serialDetails, setSerialDetails] = useState(estimate.serialDetails || {});

  const [loyaltyApplied, setLoyaltyApplied] = useState(estimate.loyaltyApplied || 0);

  const cart = useMemo(
    () => (estimate.approvedItems?.length ? estimate.approvedItems : estimate.items || []),
    [estimate.approvedItems, estimate.items]
  );
  const warrantyItems = useMemo(
    () => cart.filter(item => item.warranty || /tyre|battery/i.test(item.name || '')),
    [cart]
  );
  const subtotal = cart.reduce((acc, current) => acc + (current.price * current.qty), 0);
  const discount = loyaltyApplied * (rewardRules?.pointValue || 1);
  const taxableAmount = Math.max(0, subtotal - discount);
  const cgst = taxableAmount * 0.09;
  const sgst = taxableAmount * 0.09;
  const total = taxableAmount + cgst + sgst;

  const activeJob = jobsDb.find(j => j.id === activeJobId);
  const isJobCompleted = activeJob?.status === 'Completed';

  // Pre-load script for faster checkout
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const handleConsent = async (c) => {
    if (!c) return;

    setDecisionSaving(true);
    try {
      await recordCustomerDecision({ decision: 'approved', loyaltyApplied });
      setConsentGiven(true);
      toast.success('Customer approval recorded. Job sent to floor.');
    } catch (e) {
      console.error('Error recording approval', e);
      toast.error('Could not record customer approval.');
    } finally {
      setDecisionSaving(false);
    }
  };

  const handleNonApproval = async (decision) => {
    if (decision === 'wants_time' && !reminderDate) {
      toast.error('Choose a reminder date before saving.');
      return;
    }

    setDecisionSaving(true);
    try {
      await recordCustomerDecision({
        decision,
        remarks: decisionRemarks,
        reminderDate,
        loyaltyApplied,
      });
      toast.success(decision === 'wants_time' ? 'Reminder scheduled.' : 'Lost opportunity recorded.');
      navigate('/');
    } catch (e) {
      console.error('Error recording customer decision', e);
      toast.error('Could not save the customer decision.');
    } finally {
      setDecisionSaving(false);
    }
  };

  const handleSerialChange = (itemId, index, value) => {
    const next = {
      ...serialDetails,
      [itemId]: [
        ...(serialDetails[itemId] || []),
      ],
    };
    next[itemId][index] = value;
    setSerialDetails(next);
    setEstimate({ ...estimate, serialDetails: next });
  };

  const serialsComplete = warrantyItems.every(item =>
    Array.from({ length: item.qty || 1 }).every((_, index) => serialDetails[item.id]?.[index]?.trim())
  );

  const buildWarrantyRecords = () => {
    const invoiceDate = new Date().toISOString();
    return warrantyItems.flatMap(item =>
      Array.from({ length: item.qty || 1 }).map((_, index) => {
        const years = Number.parseInt(String(item.warranty || '').match(/\d+/)?.[0] || '0', 10);
        const end = years ? new Date(invoiceDate) : null;
        if (end) end.setFullYear(end.getFullYear() + years);
        return {
          itemId: item.id,
          itemName: item.name,
          serialNumber: serialDetails[item.id]?.[index] || '',
          warranty: item.warranty || 'Standard Warranty',
          warrantyStart: invoiceDate,
          warrantyEnd: end ? end.toISOString() : '',
        };
      })
    );
  };

  const processSuccess = async () => {
    await completeCheckout(paymentMode, total, loyaltyApplied, {
      serialDetails,
      warranties: buildWarrantyRecords(),
    });
    toast.success("Payment complete! Generating Tax Invoice...");
    setTimeout(() => navigate('/invoice'), 800);
  };

  const handleCheckout = async () => {
    if (!paymentMode || !isJobCompleted) return;
    if (!serialsComplete) {
      toast.error('Capture serial numbers for all warranty-backed products before billing.');
      return;
    }

    // If Cash is selected, bypass digital payment gateway
    if (paymentMode === 'Cash') {
      await processSuccess();
      return;
    }

    // Scaffolding Razorpay for UPI, Card, NetBank
    const res = await loadRazorpayScript();

    if (!res) {
      toast.error("Payment gateway offline. Please check your internet connection or use Cash mode.");
      return;
    }

    // Options for Razorpay Integration
    const options = {
      key: EXTERNAL_SERVICES.razorpayKey,
      amount: Math.round(total * 100), // Razorpay expects amount in paise
      currency: "INR",
      name: APP_BRAND.posName,
      description: `Payment for Job ${activeJobId}`,
      image: `${window.location.origin}/logo.png`,
      // order_id: fetched from your backend Order API before opening checkout
      handler: function (response) {
        // TODO: Send response to a Supabase Edge Function to verify HMAC-SHA256 signature
        // before calling processSuccess() to prevent client-side payment bypass.
        toast.info(`Payment ID: ${response.razorpay_payment_id} — Verifying...`);
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

    if (!EXTERNAL_SERVICES.razorpayKey) {
      toast.warning("Razorpay key not configured. Use Cash mode or add VITE_RAZORPAY_KEY to your .env.local");
      return;
    }

    const paymentObject = new window.Razorpay(options);
    
    paymentObject.on('payment.failed', function (response) {
      toast.error(`Payment failed: ${response.error.description}`);
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
               
               {discount > 0 && (
                 <div className="flex justify-between text-emerald-600 font-bold">
                   <span>Loyalty Discount ({loyaltyApplied} pts)</span>
                   <span>- ₹{discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                 </div>
               )}

               <div className="flex justify-between text-slate-600 font-medium">
                 <span>CGST (9%)</span>
                 <span>₹{cgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
               </div>
               <div className="flex justify-between text-slate-600 font-medium">
                 <span>SGST (9%)</span>
                 <span>₹{sgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
                 {currentCustomer?.loyalty > 0 && loyaltyApplied === 0 && (
                   <motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y: 0}} className="bg-gradient-to-r from-purple-500 to-indigo-500 p-1 rounded-2xl shadow-lg">
                     <div className="bg-white rounded-xl p-5 flex justify-between items-center">
                       <div>
                         <p className="font-bold text-purple-900 flex items-center gap-2">
                           <Star size={20} className="text-amber-500 fill-amber-500" /> Loyalty Points Available
                         </p>
                         <p className="text-sm font-medium text-slate-500 mt-1">
                           {currentCustomer.loyalty} points = <span className="text-emerald-600 font-bold">₹{currentCustomer.loyalty * (rewardRules?.pointValue || 1)} off</span>
                         </p>
                       </div>
                       <Button onClick={() => setLoyaltyApplied(currentCustomer.loyalty)} className="bg-purple-600 hover:bg-purple-700 text-white shadow-md border-none rounded-xl">
                         Redeem
                       </Button>
                     </div>
                   </motion.div>
                 )}

                 {loyaltyApplied > 0 && (
                   <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 flex justify-between items-center">
                     <p className="font-bold text-emerald-800 flex items-center gap-2">
                       <CheckCircle2 size={20} /> Points Applied!
                     </p>
                     <button onClick={() => setLoyaltyApplied(0)} className="text-sm font-bold text-red-500 hover:text-red-600 transition-colors">
                       Remove
                     </button>
                   </div>
                 )}

                 <div className="bg-white/60 p-6 rounded-2xl border border-amber-200">
                   <p className="text-amber-900 font-bold text-lg leading-relaxed">
                     The customer has reviewed the estimate. Do they approve the work and the total amount of ₹{total.toLocaleString(undefined, {minimumFractionDigits: 2})}?
                   </p>
                 </div>
                 {decisionMode && decisionMode !== 'approved' && (
                   <div className="bg-white/70 p-5 rounded-2xl border border-amber-200 space-y-4">
                     {decisionMode === 'wants_time' && (
                       <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2">Reminder Date</label>
                         <input
                           type="datetime-local"
                           className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base shadow-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                           value={reminderDate}
                           onChange={e => setReminderDate(e.target.value)}
                         />
                       </div>
                     )}
                     <div>
                       <label className="block text-sm font-bold text-slate-700 mb-2">Remarks</label>
                       <textarea
                         className="min-h-24 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base shadow-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                         placeholder={decisionMode === 'wants_time' ? 'Customer wants time to decide...' : 'Reason for not approving...'}
                         value={decisionRemarks}
                         onChange={e => setDecisionRemarks(e.target.value)}
                       />
                     </div>
                     <Button
                       onClick={() => handleNonApproval(decisionMode)}
                       disabled={decisionSaving}
                       className="w-full h-12 rounded-xl"
                       variant={decisionMode === 'not_approved' ? 'danger' : 'primary'}
                     >
                       Save Decision
                     </Button>
                   </div>
                 )}
                 <div className="grid sm:grid-cols-3 gap-4 pt-4">
                   <Button disabled={decisionSaving} onClick={() => handleConsent(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 text-base h-16 rounded-2xl border border-emerald-500 transition-all">
                     Approve & Start Job
                   </Button>
                   <Button variant="secondary" className="text-base h-16 rounded-2xl shadow-md border-slate-200 hover:border-slate-300 transition-all bg-white" onClick={() => setDecisionMode('wants_time')}>
                     <CalendarClock className="mr-2" size={18} /> Wants Time
                   </Button>
                   <Button variant="secondary" className="text-base h-16 rounded-2xl shadow-md border-red-200 text-red-700 hover:border-red-300 transition-all bg-white" onClick={() => setDecisionMode('not_approved')}>
                     <FileX className="mr-2" size={18} /> Not Approved
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

                    {warrantyItems.length > 0 && (
                      <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <h4 className="font-black text-slate-900 mb-3 flex items-center gap-2">
                          <ShieldCheck className="text-emerald-600" size={20} /> Warranty Serial Capture
                        </h4>
                        <div className="space-y-4">
                          {warrantyItems.map(item => (
                            <div key={item.id} className="rounded-xl bg-white border border-slate-200 p-4">
                              <div className="flex justify-between gap-3 mb-3">
                                <p className="font-bold text-slate-800">{item.name}</p>
                                <p className="text-xs font-black text-emerald-700 uppercase">{item.warranty || 'Warranty'}</p>
                              </div>
                              <div className="grid sm:grid-cols-2 gap-3">
                                {Array.from({ length: item.qty || 1 }).map((_, index) => (
                                  <input
                                    key={`${item.id}-${index}`}
                                    className="h-10 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder={`Serial #${index + 1}`}
                                    value={serialDetails[item.id]?.[index] || ''}
                                    onChange={e => handleSerialChange(item.id, index, e.target.value)}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        {!serialsComplete && (
                          <p className="mt-3 text-sm font-bold text-red-600">Serial numbers are required before invoice generation.</p>
                        )}
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
                      disabled={!paymentMode || !serialsComplete}
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
