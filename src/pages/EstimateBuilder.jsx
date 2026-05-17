import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import { Button, Card } from '../components/ui';
import { MessageCircle, FileDown, CheckCircle, ChevronRight, Calculator, Lock, Unlock } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const EstimateBuilder = () => {
  const { estimate, setEstimate, currentCustomer, user } = useApp();
  const navigate = useNavigate();

  const cart = estimate.items || [];
  const subtotal = cart.reduce((acc, current) => acc + (current.price * current.qty), 0);
  const taxes = subtotal * 0.18; // 18% GST mock
  const total = subtotal + taxes;

  const handleShare = () => {
    alert("Mock: Estimate shared via WhatsApp to " + currentCustomer?.mobile);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 mt-4 pb-20">
      <div className="text-center mb-8">
         <motion.div initial={{scale:0.8, opacity:0}} animate={{scale:1, opacity:1}} className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-800 mx-auto mb-4 shadow-sm border border-slate-200">
            <Calculator size={32} />
         </motion.div>
         <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Estimate Builder</h2>
         <p className="text-slate-500 font-medium text-lg mt-2 leading-relaxed">Review the items and share with the customer.</p>
      </div>

      <Card className="p-6 md:p-10 shadow-xl border-slate-200 rounded-[2rem] bg-white">
        <div className="flex justify-between items-center border-b border-slate-200 pb-6 mb-6">
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Customer</p>
            <p className="font-extrabold text-slate-900 text-xl tracking-tight">{currentCustomer?.name || 'Walk-in'}</p>
            <p className="text-slate-500 font-medium">{currentCustomer?.mobile}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Date</p>
            <p className="font-bold text-slate-800 tracking-tight">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {cart.length > 0 ? (
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-inner">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-slate-100/50 text-slate-500 uppercase text-xs font-extrabold tracking-widest">
                       <th className="p-4 rounded-tl-xl border-b border-slate-200">Description</th>
                       <th className="p-4 border-b border-slate-200 w-24 text-center">Qty</th>
                       <th className="p-4 border-b border-slate-200 text-right w-32 hidden sm:table-cell">Price</th>
                       <th className="p-4 rounded-tr-xl border-b border-slate-200 text-right w-32">Total</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cart.map((item, i) => (
                      <tr key={i} className="hover:bg-white transition-colors">
                        <td className="p-4">
                           <p className="font-bold text-slate-900 text-sm md:text-base">{item.name}</p>
                           {item.category && <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">{item.category} Type</span>}
                        </td>
                        <td className="p-4 text-center font-bold text-slate-800 bg-slate-100/30">{item.qty}</td>
                        <td className="p-4 text-right font-semibold text-slate-600 hidden sm:table-cell">₹{item.price}</td>
                        <td className="p-4 text-right font-extrabold text-slate-900 tracking-tight">₹{item.price * item.qty}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>

            <div className="flex justify-end pt-4">
              <div className="w-full md:w-64 space-y-3 bg-white p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between text-sm font-semibold text-slate-500">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-slate-500">
                  <span>Estimated GST (18%)</span>
                  <span>₹{taxes.toFixed(2)}</span>
                </div>
                <div className="w-full h-px bg-slate-200 my-2"></div>
                <div className="flex justify-between text-2xl font-black text-slate-900 tracking-tighter pt-1">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <p className="text-slate-500 font-medium mb-4">No items in the estimate.</p>
            <Button onClick={() => navigate('/service-catalog')} variant="secondary">Go to Catalog</Button>
          </div>
        )}
      </Card>

      {cart.length > 0 && (
         <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button variant="secondary" size="lg" className="flex-1 rounded-full shadow-md text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100" onClick={handleShare}>
              <MessageCircle className="mr-2" size={20} /> Share via WhatsApp
            </Button>
            {!estimate.managerApproved ? (
               user?.role === 'Store Manager' ? (
                 <Button size="lg" className="flex-1 rounded-full shadow-xl bg-amber-500 hover:bg-amber-600 text-white" onClick={() => setEstimate({...estimate, managerApproved: true})}>
                   <Unlock className="w-5 h-5 mr-2" /> Approve Estimate
                 </Button>
               ) : (
                 <Button size="lg" disabled className="flex-1 rounded-full shadow-xl opacity-70 cursor-not-allowed">
                   <Lock className="w-5 h-5 mr-2" /> Waiting for Manager...
                 </Button>
               )
            ) : (
               <Button size="lg" className="flex-1 rounded-full shadow-xl" onClick={() => navigate('/pos')}>
                 Proceed to Consent <ChevronRight className="ml-2 w-5 h-5" />
               </Button>
            )}
         </div>
      )}
    </div>
  );
};

export default EstimateBuilder;
