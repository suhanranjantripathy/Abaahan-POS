import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import { Button, Input, Card } from '../components/ui';
import { Search, Phone, ArrowRight } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
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
    <div className="max-w-md mx-auto mt-8 md:mt-20">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4 shadow-sm text-primary-600">
            <Phone className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Lookup Customer</h2>
          <p className="text-slate-500 font-medium text-lg mt-2">Enter mobile number to view profile or register new</p>
        </div>

        <Card className="p-6 md:p-8 shadow-xl border-slate-100 rounded-[2rem]">
          <form onSubmit={handleLookup} className="space-y-6">
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
                className="text-xl sm:text-2xl font-bold tracking-widest text-center py-4 h-16"
              />
            </div>
            
            <Button type="submit" className="w-full text-lg h-14" size="lg">
              Continue <ArrowRight size={20} className="ml-2" />
            </Button>
          </form>
          
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 flex gap-3 text-sm text-slate-500 font-medium">
            <Search className="flex-shrink-0 text-slate-400" />
            <p>If the number is not found in our database, you will be automatically redirected to the quick registration form.</p>
          </div>
        </Card>

        <div className="mt-8 pb-4">
           <div className="flex items-center justify-between px-2 mb-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Recent Customers</h3>
              <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{customersDb.length}</span>
           </div>
           
           <div className="space-y-3">
             {[...customersDb].reverse().map((c, i) => (
                <button 
                  key={c.id || i}
                  onClick={() => {
                     setCurrentCustomer(c);
                     navigate('/summary');
                  }}
                  className="w-full text-left bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-primary-300 hover:shadow-md transition-all flex justify-between items-center group"
                >
                   <div>
                     <p className="font-bold text-slate-900 tracking-tight">{c.name}</p>
                     <p className="text-sm text-slate-500 font-medium">{c.mobile} • {c.vehicles?.length || 0} vehicle(s)</p>
                   </div>
                   <div className="bg-slate-50 p-2 rounded-full group-hover:bg-primary-50 border border-slate-100 group-hover:border-primary-200">
                     <ArrowRight size={18} className="text-slate-400 group-hover:text-primary-600 transition-colors" />
                   </div>
                </button>
             ))}
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CustomerLookup;
