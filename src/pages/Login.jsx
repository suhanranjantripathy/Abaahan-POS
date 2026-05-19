import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import { Button, Input, Card } from '../components/ui';
import { Wrench, ShieldCheck, Smartphone, KeyRound, UserCircle, ArrowRight, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw3BzqmR3Y_AQQDHNJ0saBUtxxB4Lxi-N4cdUAbl5dapGJ_fce2bVADZ9d30kyQr2GE/exec";

const Login = () => {
  const { login } = useApp();
  const navigate = useNavigate();
  
  // Views: 'mobile_entry', 'pin_entry', 'success'
  const [view, setView] = useState('mobile_entry'); 
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const checkMobile = async (e) => {
    e.preventDefault();
    if (phone.length < 10) { setError('Enter a valid 10-digit mobile number'); return; }
    
    setError('');
    setLoading(true);
    
    try {
      // Using GET request with query params completely bypasses Google Apps Script POST CORS issues
      const res = await fetch(`${SCRIPT_URL}?action=login&mobile=${phone}`, {
        method: 'GET',
      });
      
      const rawText = await res.text();
      
      try {
        const data = JSON.parse(rawText);
        
        if (data.status === 'first_login') {
          setSuccessMessage(data.message);
          setView('pin_entry');
        } else if (data.status === 'error' && data.message.includes('Invalid PIN')) {
          setSuccessMessage('');
          setView('pin_entry');
        } else if (data.status === 'success') {
           setView('pin_entry');
        } else {
          setError(data.message);
        }
      } catch (parseError) {
        console.error("Failed to parse Google response:", rawText);
        setError('Server returned invalid data. Check sheet name or deployment.');
      }

    } catch (err) {
      setError(`Network error: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const verifyPin = async (e) => {
    e.preventDefault();
    if (pin.length < 4) { setError('Enter your 4-digit PIN'); return; }
    
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch(`${SCRIPT_URL}?action=login&mobile=${phone}&password=${pin}`, {
        method: 'GET',
      });
      
      const rawText = await res.text();
      
      try {
         const data = JSON.parse(rawText);
         
         if (data.status === 'success') {
           setView('success');
           setTimeout(() => {
              login(data.user); 
              navigate('/');
           }, 1500);
         } else {
           setError(data.message);
         }
      } catch (parseError) {
         console.error("Failed to parse Google response:", rawText);
         setError('Server returned invalid data.');
      }

    } catch (err) {
      setError(`Network error: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="hidden lg:flex flex-1 bg-primary-600 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1549643276-fbc2d8ca11e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center mix-blend-overlay opacity-30"></div>
        <div className="relative z-10 text-white max-w-lg">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <h1 className="text-5xl font-extrabold tracking-tight mb-6 leading-tight">Secure Employee Access.</h1>
            <p className="text-xl text-primary-100 font-medium leading-relaxed">Protected with role-based parameters and multi-layered PIN + 2FA mobile recovery.</p>
          </motion.div>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden flex justify-center">
             <div className="font-bold text-3xl text-primary-700 tracking-tight flex items-center gap-2">
                <Wrench className="w-8 h-8"/> Abaahan
             </div>
          </div>
          
          <Card className="p-8 shadow-xl border-slate-100 rounded-[2rem] overflow-hidden relative min-h-[400px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              
              {/* STEP 1: MOBILE ENTRY */}
              {view === 'mobile_entry' && (
                <motion.div key="mobile" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="flex items-center gap-3 mb-2">
                     <UserCircle className="text-primary-600 w-8 h-8" />
                     <h2 className="text-2xl font-bold text-slate-900">Sign In</h2>
                  </div>
                  <p className="text-slate-500 mb-8 font-medium">Enter your 10-digit registered mobile number.</p>
                  
                  <form onSubmit={checkMobile} className="space-y-6">
                    <div className="relative">
                       <Smartphone className="absolute left-3 top-[38px] text-slate-400 z-10" size={20} />
                       <Input 
                         label="Mobile Number" 
                         type="tel" 
                         placeholder="9876543210" 
                         value={phone}
                         onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                         className="pl-10 font-bold tracking-widest text-lg h-14"
                         autoFocus
                       />
                    </div>

                    {error && <p className="text-xs font-bold text-red-500">{error}</p>}

                    <Button type="submit" className="w-full h-14 mt-4" size="lg" disabled={loading}>
                      {loading ? "Checking Database..." : <span className="flex items-center justify-center gap-2">Continue <ArrowRight size={18}/></span>}
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* STEP 2: PIN ENTRY */}
              {view === 'pin_entry' && (
                <motion.div key="pin" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="flex items-center gap-3 mb-2">
                     <Lock className="text-primary-600 w-8 h-8" />
                     <h2 className="text-2xl font-bold text-slate-900">Enter PIN</h2>
                  </div>
                  <p className="text-slate-500 mb-6 font-medium">
                    Welcome back! Please enter your 4-digit PIN for <span className="font-bold text-slate-800">+91 {phone}</span>.
                  </p>
                  
                  {successMessage && (
                    <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-sm font-bold border border-emerald-100 mb-6 flex items-start gap-2">
                      <ShieldCheck size={18} className="mt-0.5 shrink-0" />
                      {successMessage}
                    </div>
                  )}

                  <form onSubmit={verifyPin} className="space-y-6">
                    <div className="relative">
                       <KeyRound className="absolute left-3 top-[38px] text-slate-400 z-10" size={20} />
                       <Input 
                         label="Secure PIN" 
                         type="password" 
                         placeholder="••••" 
                         value={pin}
                         onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
                         className="pl-10 font-bold tracking-widest text-2xl h-14"
                         autoFocus
                       />
                    </div>

                    {error && <p className="text-xs font-bold text-red-500">{error}</p>}
                    
                    <div className="flex flex-col gap-3 mt-4">
                      <Button type="submit" className="w-full h-14 bg-slate-900 hover:bg-slate-800" size="lg" disabled={loading}>
                        {loading ? "Authenticating..." : "Secure Login"}
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setView('mobile_entry')} className="font-bold text-slate-500 h-12">
                        Change Mobile Number
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* STEP 3: SUCCESS */}
              {view === 'success' && (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full min-h-[300px]">
                   <motion.div 
                     initial={{ scale: 0 }} 
                     animate={{ scale: 1 }} 
                     transition={{ type: "spring", stiffness: 200, damping: 10 }}
                     className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm"
                   >
                     <ShieldCheck className="w-12 h-12" />
                   </motion.div>
                   <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Verified!</h2>
                   <p className="text-slate-500 font-medium">Securing session and redirecting...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
