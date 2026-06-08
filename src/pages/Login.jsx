import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AppProvider';
import { Button, Input, Card } from '../components/ui';
import { APP_BRAND } from '../config/appConfig';
import { Wrench, UserCircle, ArrowRight, Lock, Store, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, isSupabaseEnabled } from '../services/supabaseClient';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // Views: 'signin', 'register'
  const [view, setView] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const resetForm = () => {
    setEmail(''); setPassword(''); setName(''); setShopName('');
    setError(''); setSuccessMsg('');
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!isSupabaseEnabled() || !supabase) {
        login({ role: 'Store Manager', name: 'Demo User', email, mobile: '9999999999' });
        navigate('/');
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*, shops(name)')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw new Error("Your account exists but no employee profile was found. Contact your manager.");

      login(profile);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!shopName.trim()) { setError("Shop name is required"); return; }
    if (!name.trim()) { setError("Your name is required"); return; }
    setLoading(true);
    try {
      if (!isSupabaseEnabled() || !supabase) {
        login({ role: 'Store Manager', name, email, mobile: email });
        navigate('/');
        return;
      }

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Registration failed. Please try again.");

      // 2. Ensure active session before calling RPC
      if (!authData.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw new Error("Account created! Please sign in manually.");
      }

      // 3. Call SECURITY DEFINER function — bypasses RLS safely
      const { error: rpcError } = await supabase.rpc('register_shop', {
        p_shop_name: shopName,
        p_user_name: name,
        p_user_id: authData.user.id,
      });
      if (rpcError) throw rpcError;

      setSuccessMsg("Shop registered! You can now sign in with your credentials.");
      setView('signin');
      setEmail(email);
      setPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 bg-primary-600 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1549643276-fbc2d8ca11e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center mix-blend-overlay opacity-30"></div>
        <div className="relative z-10 text-white max-w-lg">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-3 mb-8">
              <Wrench className="w-10 h-10" />
              <span className="text-3xl font-extrabold tracking-tight">{APP_BRAND.name}</span>
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight mb-6 leading-tight">Employee Portal.</h1>
            <p className="text-xl text-primary-100 font-medium leading-relaxed">Secure, role-based access for your entire team — POS Executives, Technicians, and Managers.</p>
          </motion.div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="mb-10 lg:hidden flex justify-center">
            <div className="font-bold text-3xl text-primary-700 tracking-tight flex items-center gap-2">
              <Wrench className="w-8 h-8"/> {APP_BRAND.name}
            </div>
          </div>

          <Card className="p-8 shadow-xl border-slate-100 rounded-[2rem] overflow-hidden">
            <AnimatePresence mode="wait">

              {/* ── SIGN IN VIEW ── */}
              {view === 'signin' && (
                <motion.div key="signin" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="flex items-center gap-3 mb-2">
                    <UserCircle className="text-primary-600 w-8 h-8" />
                    <h2 className="text-2xl font-bold text-slate-900">Employee Sign In</h2>
                  </div>
                  <p className="text-slate-500 mb-6 font-medium">Sign in with your work email and password.</p>

                  {successMsg && (
                    <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl p-3 flex items-start gap-2 text-sm font-semibold mb-5">
                      <ShieldCheck size={17} className="mt-0.5 shrink-0" />
                      {successMsg}
                    </div>
                  )}

                  <form onSubmit={handleSignIn} className="space-y-4">
                    <Input label="Work Email" type="email" placeholder="you@yourshop.com" value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }} className="h-12" required autoFocus />
                    <Input label="Password" type="password" placeholder="••••••••" value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }} className="h-12 tracking-widest" required />

                    {error && <p className="text-xs font-bold text-red-500">{error}</p>}

                    <Button type="submit" className="w-full h-14 mt-2" size="lg" disabled={loading}>
                      {loading ? "Signing in..." : <span className="flex items-center justify-center gap-2">Sign In <ArrowRight size={18}/></span>}
                    </Button>
                  </form>

                  {/* Divider */}
                  <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400 font-medium mb-3">Are you opening a new shop?</p>
                    <button type="button" onClick={() => { resetForm(); setView('register'); }}
                      className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors">
                      <Store size={15} /> Register New Workspace
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── REGISTER VIEW ── */}
              {view === 'register' && (
                <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="flex items-center gap-3 mb-2">
                    <Store className="text-primary-600 w-8 h-8" />
                    <h2 className="text-2xl font-bold text-slate-900">Register Shop</h2>
                  </div>
                  <p className="text-slate-500 mb-6 font-medium text-sm">
                    This creates a new workspace. Employees will be invited separately.
                  </p>

                  <form onSubmit={handleRegister} className="space-y-4">
                    <Input label="Shop Name" placeholder="AutoWorks Inc." value={shopName}
                      onChange={e => { setShopName(e.target.value); setError(''); }} className="h-12" required autoFocus />
                    <Input label="Your Name (Manager)" placeholder="John Doe" value={name}
                      onChange={e => { setName(e.target.value); setError(''); }} className="h-12" required />
                    <Input label="Email" type="email" placeholder="john@yourshop.com" value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }} className="h-12" required />
                    <Input label="Password" type="password" placeholder="Min. 6 characters" value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }} className="h-12 tracking-widest" required />

                    {error && <p className="text-xs font-bold text-red-500">{error}</p>}

                    <Button type="submit" className="w-full h-14 mt-2" size="lg" disabled={loading}>
                      {loading ? "Creating Workspace..." : <span className="flex items-center justify-center gap-2">Create Workspace <ArrowRight size={18}/></span>}
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <button type="button" onClick={() => { resetForm(); setView('signin'); }}
                      className="text-sm font-bold text-primary-600 hover:text-primary-700">
                      ← Back to Employee Sign In
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </Card>

          <p className="text-center text-xs text-slate-400 mt-6">
            <Lock size={11} className="inline mr-1" />
            Secured by Supabase Auth · Role-based access control
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
