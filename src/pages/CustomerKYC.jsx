import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import { Button, Input, Card } from '../components/ui';
import { UserPlus, ShieldCheck } from 'lucide-react';

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
    consent: true
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    let tempErrors = {};
    if (!formData.name) tempErrors.name = 'Name is required';
    if (!/^\d{10}$/.test(formData.mobile)) tempErrors.mobile = 'Valid mobile requried';
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
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
         <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shadow-sm">
            <UserPlus size={24} />
         </div>
         <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">New Customer Reg.</h2>
            <p className="text-slate-500 font-medium text-lg leading-tight mt-1">Quick KYC for billing and digital records.</p>
         </div>
      </div>

      <Card className="p-6 md:p-8 shadow-xl border-slate-100 rounded-[2rem]">
        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          <div className="space-y-4">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Mandatory Info</h3>
             <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  error={errors.name}
                />
                <Input
                  label="Mobile Number"
                  placeholder="10 digits"
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  error={errors.mobile}
                  maxLength={10}
                />
             </div>
             <Input
                label="City"
                placeholder="e.g. Mumbai"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                error={errors.city}
             />
          </div>

          <div className="w-full h-px bg-slate-100"></div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Optional Info</h3>
             <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Email (for digital report)"
                  type="email"
                  placeholder="e.g. rsharma@mail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({...formData, dob: e.target.value})}
                />
             </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-4">
             <div className="pt-1">
                 <input 
                    type="checkbox" 
                    id="consent" 
                    className="w-5 h-5 accent-primary-600 rounded bg-white shadow-sm"
                    checked={formData.consent}
                    onChange={(e) => setFormData({...formData, consent: e.target.checked})}
                 />
             </div>
             <div>
                <label htmlFor="consent" className="font-semibold text-slate-800 tracking-tight cursor-pointer">
                   Customer Consent Required
                </label>
                <p className="text-sm text-slate-500 font-medium leading-snug mt-1">
                   Customer agrees to receive digital inspection reports, service reminders, and bills via WhatsApp / SMS.
                </p>
                {errors.consent && <p className="text-xs text-red-500 mt-1 font-bold">{errors.consent}</p>}
             </div>
          </div>

          <Button type="submit" size="lg" className="w-full">
            Save Customer & Add Vehicle
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default CustomerKYC;
