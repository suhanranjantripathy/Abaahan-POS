import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import { Button, Input, Card } from '../components/ui';
import { Search, Phone, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const CustomerLookup = () => {
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { lookupCustomer, setCurrentCustomer, customersDb } = useApp();

  const handleLookup = (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(mobile)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setError('');

    const customer = lookupCustomer(mobile);
    if (customer) {
      setCurrentCustomer(customer);
      navigate('/summary');
    } else {
      // Pass the mobile number to the next screen using routing state
      navigate('/kyc', { state: { mobile } });
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-4 md:mt-12 relative z-0">
      {/* Dynamic Background Elements */}
      <div className="absolute top-10 left-0 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob -z-10"></div>
      <div className="absolute top-10 right-0 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob animation-delay-2000 -z-10"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-emerald-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-blob animation-delay-4000 -z-10"></div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="text-center mb-10">
          <motion.div 
             initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
             className="mx-auto w-20 h-20 bg-gradient-to-tr from-primary-600 to-indigo-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-primary-500/30 text-white transform rotate-3"
          >
            <Phone className="w-10 h-10 -rotate-3" />
          </motion.div>
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-primary-900 to-slate-900 tracking-tight">
            Customer Access
          </h2>
          <p className="text-slate-500 font-medium text-lg mt-3 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" /> Enter mobile number for instant lookup
          </p>
        </div>

        <Card className="p-6 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-white/60 bg-white/70 backdrop-blur-xl rounded-[2.5rem] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none"></div>
          
          <form onSubmit={handleLookup} className="space-y-8 relative z-10">
            <div>
              <Input
                label="Mobile Number"
                type="tel"
                placeholder="Ex. 9876543210"
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value.replace(/\D/g, '').slice(0, 10));
                  setError('');
                }}
                error={error}
                autoFocus
                className="text-2xl sm:text-3xl font-black tracking-[0.2em] text-center py-6 h-20 bg-white/80 border-slate-200 focus:border-primary-500 focus:ring-primary-500/20 shadow-inner rounded-2xl"
              />
            </div>
            
            <Button type="submit" className="w-full text-xl h-16 rounded-2xl bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 shadow-xl shadow-primary-500/20 group" size="lg">
              Proceed securely 
              <ArrowRight size={24} className="ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>
          
          <div className="mt-8 p-4 rounded-2xl bg-primary-50/50 border border-primary-100/50 flex gap-4 text-sm text-primary-800 font-medium backdrop-blur-sm relative z-10">
            <div className="p-2 bg-white rounded-full shadow-sm flex-shrink-0 h-fit">
              <Search className="w-4 h-4 text-primary-500" />
            </div>
            <p className="leading-relaxed">If the number is not found in our CRM, you will be automatically redirected to the quick registration (KYC) flow.</p>
          </div>
        </Card>

        <div className="mt-12 pb-8">
           <div className="flex items-center gap-4 mb-6 px-2">
              <div className="h-px bg-slate-200 flex-1"></div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                Recent Walk-ins <span className="bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-xs">{customersDb.length}</span>
              </h3>
              <div className="h-px bg-slate-200 flex-1"></div>
           </div>
           
           <div className="space-y-3">
             {[...customersDb].reverse().map((c, i) => (
                <motion.button 
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + (i * 0.1) }}
                  key={c.id || i}
                  onClick={() => {
                     setCurrentCustomer(c);
                     navigate('/summary');
                  }}
                  className="w-full text-left bg-white/60 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-primary-300 hover:shadow-lg hover:bg-white transition-all duration-300 flex justify-between items-center group"
                >
                   <div>
                     <p className="font-bold text-lg text-slate-900 tracking-tight group-hover:text-primary-700 transition-colors">{c.name}</p>
                     <p className="text-sm text-slate-500 font-medium mt-1">{c.mobile} • {c.vehicles?.length || 0} vehicle(s)</p>
                   </div>
                   <div className="bg-slate-50 p-3 rounded-xl group-hover:bg-primary-50 group-hover:scale-110 border border-slate-100 group-hover:border-primary-200 transition-all duration-300 shadow-sm">
                     <ArrowRight size={20} className="text-slate-400 group-hover:text-primary-600" />
                   </div>
                </motion.button>
             ))}
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CustomerLookup;
