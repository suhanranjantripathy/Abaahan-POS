import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import { Button, Input, Card } from '../components/ui';
import { Wrench, ShieldCheck, Zap, Lock, Smartphone, Shield, KeyRound, UserCircle } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
  const { login } = useApp();
  const navigate = useNavigate();
  
  // Views: 'login', 'forgot_request', 'forgot_verify', 'success'
  const [view, setView] = useState('login'); 
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  
  // OTP state
  const [otp, setOtp] = useState(['', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [timer, setTimer] = useState(30);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const MOCK_PIN = '1234';

  const roles = [
    { id: 'Store Manager', icon: <ShieldCheck className="w-6 h-6" /> },
    { id: 'Technician', icon: <Wrench className="w-6 h-6" /> },
    { id: 'POS Executive', icon: <Zap className="w-6 h-6" /> },
  ];

  useEffect(() => {
    if (view === 'forgot_verify' && timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [view, timer]);

  const handleStandardLogin = (e) => {
    e.preventDefault();
    if (!role) { setError('Please select your role'); return; }
    if (phone.length < 10) { setError('Enter a valid 10-digit mobile number'); return; }
    if (pin !== MOCK_PIN) { setError('Invalid PIN. Please try again or use Forgot PIN.'); return; }
    
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setView('success');
      setTimeout(() => {
         login(role);
         navigate('/');
      }, 1200);
    }, 1000);
  };

  const handleRequestOtp = (e) => {
    if (e) e.preventDefault();
    if (phone.length < 10) { setError('Enter a valid 10-digit mobile number to recover PIN'); return; }
    
    setError('');
    setLoading(true);
    
    const mockOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(mockOtp);

    // Mock network latency for sending OTP
    setTimeout(() => {
      setLoading(false);
      setView('forgot_verify');
      setTimer(30);
      setOtp(['', '', '', '']);
      setTimeout(() => alert(`[MOCK SMS - Abahaan]\nRequested OTP for PIN Recovery: ${mockOtp}`), 500);
    }, 1000);
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    setError('');
    
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    } else if (e.key === 'Enter') {
      verifyOtpAndRecoverPin();
    }
  };

  const verifyOtpAndRecoverPin = () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 4) { setError('Enter full 4-digit OTP'); return; }
    if (enteredOtp !== generatedOtp) { setError('Invalid OTP. Please try again.'); return; }
    
    setError('');
    setLoading(true);
    
    // Mock network latency for verification & dispatching PIN
    setTimeout(() => {
      setLoading(false);
      alert(`[MOCK SMS - Abahaan]\nRecovery Successful. Your secure PIN is: ${MOCK_PIN}`);
      setView('login');
      setPin(MOCK_PIN); // Auto-fill for convenience
    }, 1500);
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
                <Wrench className="w-8 h-8"/> Abahaan
             </div>
          </div>
          
          <Card className="p-8 shadow-xl border-slate-100 rounded-[2rem] overflow-hidden relative min-h-[500px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {view === 'login' && (
                <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="flex items-center gap-3 mb-2">
                     <UserCircle className="text-primary-600 w-8 h-8" />
                     <h2 className="text-2xl font-bold text-slate-900">Sign In</h2>
                  </div>
                  <p className="text-slate-500 mb-6 font-medium">Use your 10-digit number & PIN to access POS</p>
                  
                  <form onSubmit={handleStandardLogin} className="space-y-5">
                    <div className="space-y-2">
                      {roles.map((r) => (
                        <label 
                          key={r.id}
                          className={`flex items-center gap-4 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            role === r.id ? 'border-primary-500 bg-primary-50 shadow-sm' : 'border-slate-200 hover:border-primary-200 hover:bg-slate-50'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="role" 
                            value={r.id} 
                            checked={role === r.id} 
                            onChange={() => { setRole(r.id); setError(''); }} 
                            className="sr-only"
                          />
                          <div className={`mt-0.5 ${role === r.id ? 'text-primary-600' : 'text-slate-400'}`}>
                            {r.icon}
                          </div>
                          <div className="flex-1 font-bold text-slate-900 tracking-tight">{r.id}</div>
                          <div className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex justify-center items-center">
                            {role === r.id ? <div className="w-2 h-2 bg-primary-600 rounded-full" /> : null}
                          </div>
                        </label>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="relative col-span-2">
                         <Smartphone className="absolute left-3 top-[38px] text-slate-400 z-10" size={20} />
                         <Input 
                           label="Mobile" 
                           type="tel" 
                           placeholder="9876543210" 
                           value={phone}
                           onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                           className="pl-10 font-bold tracking-widest"
                         />
                      </div>
                      <div className="relative col-span-2">
                         <KeyRound className="absolute left-3 top-[38px] text-slate-400 z-10" size={20} />
                         <Input 
                           label="Secret PIN" 
                           type="password" 
                           placeholder="••••" 
                           value={pin}
                           onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
                           className="pl-10 font-bold tracking-widest"
                         />
                      </div>
                    </div>

                    {error && <p className="text-xs font-bold text-red-500">{error}</p>}
                    
                    <div className="flex justify-end pt-1">
                      <button type="button" onClick={() => { setView('forgot_request'); setError(''); }} className="text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors">
                        Forgot PIN?
                      </button>
                    </div>

                    <Button type="submit" className="w-full h-14 mt-2" size="lg" disabled={loading}>
                      {loading ? "Authenticating..." : "Secure Login"}
                    </Button>
                  </form>
                </motion.div>
              )}

              {view === 'forgot_request' && (
                <motion.div key="forgot_request" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-6">
                     <Lock className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Recover PIN</h2>
                  <p className="text-slate-500 mb-8 font-medium">Enter your registered mobile number and we'll send you an OTP to recover your PIN.</p>
                  
                  <form onSubmit={handleRequestOtp} className="space-y-6">
                    <div className="relative">
                       <Smartphone className="absolute left-3 top-[38px] text-slate-400 z-10" size={20} />
                       <Input 
                         label="Mobile Number" 
                         type="tel" 
                         placeholder="9876543210" 
                         value={phone}
                         onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                         className="pl-10 font-bold tracking-widest"
                       />
                       {error && <p className="text-xs font-bold text-red-500 mt-2">{error}</p>}
                    </div>

                    <div className="flex flex-col gap-3">
                      <Button type="submit" className="w-full h-14" size="lg" disabled={loading}>
                        {loading ? "Generating OTP..." : "Send OTP to Phone"}
                      </Button>
                      <Button type="button" variant="ghost" className="w-full h-12 font-bold" onClick={() => setView('login')}>
                        Back to Login
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}

              {view === 'forgot_verify' && (
                <motion.div key="forgot_verify" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
                     <Shield className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Verify Identity</h2>
                  <p className="text-slate-500 mb-8 font-medium">We've sent a 4-digit verification code to <span className="font-bold text-slate-800">+91 {phone}</span></p>

                  <div className="flex gap-4 justify-between mb-2">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-${idx}`}
                        type="text"
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-16 h-16 text-center text-2xl font-black bg-white border-2 border-slate-200 rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all shadow-sm"
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>
                  {error && <p className="text-xs font-bold text-red-500 mt-2 text-center">{error}</p>}

                  <div className="text-center mt-6 mb-8">
                     <p className="text-sm font-semibold text-slate-500">
                       {timer > 0 ? `Resend code in 00:${timer.toString().padStart(2, '0')}` : 
                         <button onClick={handleRequestOtp} className="text-primary-600 hover:text-primary-700">Resend OTP Now</button>}
                     </p>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="secondary" className="flex-1 h-14" onClick={() => { setView('login'); setOtp(['','','','']); }}>Cancel</Button>
                    <Button className="flex-[2] h-14" size="lg" onClick={verifyOtpAndRecoverPin} disabled={loading}>
                      {loading ? "Verifying..." : "Verify & Get PIN"}
                    </Button>
                  </div>
                </motion.div>
              )}

              {view === 'success' && (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full min-h-[400px]">
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
