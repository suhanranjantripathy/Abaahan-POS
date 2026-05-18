import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import { Button, Input, Card } from '../components/ui';
import { UserPlus, ShieldCheck, ArrowRight, Car } from 'lucide-react';
import { motion } from 'framer-motion';

const CustomerKYC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addCustomer } = useApp();

  const initialMobile = location.state?.mobile || '';

  const [formData, setFormData] = useState({
    name: '',
    mobile: initialMobile,
    city: '',
    email: '',
    dob: '',
    usage: 'mixed',
    consent: true
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    let tempErrors = {};
    if (!formData.name) tempErrors.name = 'Name is required';
    if (!/^\d{10}$/.test(formData.mobile)) tempErrors.mobile = 'Valid 10-digit mobile required';
    if (!formData.city) tempErrors.city = 'City is required';
    if (!formData.consent) tempErrors.consent = 'Consent is required for billing ops';
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      addCustomer(formData);
      navigate('/vehicle-details');
    }
  };

  return (
    <div className="max-w-3xl mx-auto relative z-0">
      {/* Dynamic Background Elements */}
      <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-blob -z-10"></div>
      <div className="absolute top-40 -right-10 w-64 h-64 bg-pink-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-blob animation-delay-2000 -z-10"></div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8 mt-4">
           <motion.div 
             initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
             className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 text-white shrink-0 transform -rotate-3"
           >
              <UserPlus size={32} className="rotate-3" />
           </motion.div>
           <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">New Customer Registration</h2>
              <p className="text-slate-500 font-medium text-lg mt-1">Quick profile setup for CRM and digital reports.</p>
           </div>
        </div>

        <Card className="p-6 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-white/60 bg-white/70 backdrop-blur-xl rounded-[2rem] overflow-hidden relative">
          <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-primary-500 via-blue-500 to-cyan-500"></div>
          
          <form onSubmit={handleSubmit} className="space-y-8 md:space-y-10 relative z-10">
            {/* Mandatory Section */}
            <div className="space-y-5">
               <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                 <ShieldCheck className="w-5 h-5 text-primary-500" />
                 <h3 className="text-sm font-bold text-primary-600 uppercase tracking-widest">Mandatory Information</h3>
               </div>
               
               <div className="grid md:grid-cols-2 gap-5 md:gap-6">
                  <Input
                    label="Full Name *"
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    error={errors.name}
                    className="bg-white"
                  />
                  <Input
                    label="Mobile Number *"
                    placeholder="10 digits"
                    value={formData.mobile}
                    onChange={(e) => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                    error={errors.mobile}
                    maxLength={10}
                    className="bg-white font-semibold tracking-wider"
                  />
               </div>
               <Input
                  label="City / Location *"
                  placeholder="e.g. Mumbai, Andheri West"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  error={errors.city}
                  className="bg-white"
               />
            </div>

            {/* Optional Section */}
            <div className="space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-2 pt-4">
                 <Car className="w-5 h-5 text-slate-400" />
                 <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Optional CRM Data</h3>
              </div>
               
               <div className="grid md:grid-cols-3 gap-5">
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="rsharma@mail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="bg-white"
                  />
                  <Input
                    label="Date of Birth"
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({...formData, dob: e.target.value})}
                    className="bg-white"
                  />
                  <div className="flex flex-col gap-1 w-full">
                    <label className="text-sm font-semibold text-slate-700">Primary Usage</label>
                    <select
                      value={formData.usage}
                      onChange={(e) => setFormData({...formData, usage: e.target.value})}
                      className="flex h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 shadow-sm transition-all text-slate-700"
                    >
                      <option value="city">City Driving</option>
                      <option value="highway">Highway / Long Distance</option>
                      <option value="mixed">Mixed Terrain</option>
                    </select>
                  </div>
               </div>
            </div>

            {/* Consent Box */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className={`p-5 rounded-2xl border flex items-start gap-4 transition-colors ${formData.consent ? 'bg-primary-50/50 border-primary-200' : 'bg-red-50 border-red-200'}`}
            >
               <div className="pt-1">
                   <div className="relative flex items-center justify-center w-6 h-6">
                     <input 
                        type="checkbox" 
                        id="consent" 
                        className="peer appearance-none w-6 h-6 border-2 border-slate-300 rounded-md checked:bg-primary-600 checked:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all cursor-pointer shadow-sm bg-white"
                        checked={formData.consent}
                        onChange={(e) => setFormData({...formData, consent: e.target.checked})}
                     />
                     <svg className="absolute w-4 h-4 text-white pointer-events-none hidden peer-checked:block" viewBox="0 0 20 20" fill="currentColor">
                       <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                     </svg>
                   </div>
               </div>
               <div>
                  <label htmlFor="consent" className="font-bold text-slate-900 tracking-tight cursor-pointer text-lg">
                     Communication Consent
                  </label>
                  <p className="text-sm text-slate-600 font-medium mt-1 leading-relaxed">
                     Customer agrees to receive digital inspection reports, service estimates, invoices, and automated reminders securely via WhatsApp and Email.
                  </p>
                  {errors.consent && <p className="text-sm text-red-600 mt-2 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>{errors.consent}</p>}
               </div>
            </motion.div>

            <Button type="submit" size="lg" className="w-full h-16 text-xl rounded-2xl bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-900/20 group">
              Create Profile & Add Vehicle
              <ArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default CustomerKYC;
