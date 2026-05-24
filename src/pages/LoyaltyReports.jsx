import React from 'react';
import { Card, Button } from '../components/ui';
import { BarChart3, Users, Gift, TrendingUp, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const LoyaltyReports = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div className="mb-10">
         <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Analytics & Loyalty</h2>
         <p className="text-slate-500 font-medium text-lg mt-2">Manage store performance and customer retention programs.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
         {/* KPI Cards */}
         {[
           { label: 'Total Revenue', value: '₹1.2M', trend: '+12%', icon: <TrendingUp/>, color: 'text-emerald-500' },
           { label: 'Inspections', value: '450', trend: '+5%', icon: <ShieldCheck/>, color: 'text-blue-500' },
           { label: 'Repeat Customers', value: '68%', trend: '+2%', icon: <Users/>, color: 'text-indigo-500' },
           { label: 'Points Redeemed', value: '15.4K', trend: '-1%', icon: <Gift/>, color: 'text-amber-500' }
         ].map((kpi, i) => (
           <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: i*0.1}} key={i}>
             <Card className="p-6 border-slate-100 shadow-md rounded-2xl flex flex-col justify-between h-full bg-white relative overflow-hidden group hover:border-primary-200 transition-colors">
               <div className="absolute top-0 right-0 -m-4 w-24 h-24 bg-slate-50 rounded-full z-0 group-hover:scale-150 transition-transform"></div>
               <div className="flex justify-between items-start z-10">
                 <div>
                   <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">{kpi.label}</p>
                   <p className="text-3xl font-black text-slate-900 tracking-tighter">{kpi.value}</p>
                 </div>
                 <div className={`p-3 rounded-full bg-slate-50 ${kpi.color}`}>
                   {kpi.icon}
                 </div>
               </div>
               <div className="mt-4 z-10 flex items-center gap-2 text-sm font-semibold">
                  <span className={kpi.trend.includes('+') ? 'text-emerald-600' : 'text-rose-600'}>{kpi.trend}</span>
                  <span className="text-slate-400">vs last month</span>
               </div>
             </Card>
           </motion.div>
         ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8 pt-8">
         <Card className="p-8 border-slate-100 shadow-lg rounded-[2rem] bg-white">
            <h3 className="text-xl font-bold flex items-center gap-2 tracking-tight mb-8">
              <BarChart3 className="text-primary-600" /> Conversion Funnel
            </h3>
            
            <div className="space-y-6">
               {[
                 { stage: 'Inspections Done', count: 450, pct: '100%', bg: 'bg-slate-100', w: '100%' },
                 { stage: 'Recommendations Made', count: 320, pct: '71%', bg: 'bg-blue-100', w: '71%' },
                 { stage: 'Estimates Shared', count: 280, pct: '62%', bg: 'bg-indigo-100', w: '62%' },
                 { stage: 'Confirmed Bills', count: 210, pct: '46%', bg: 'bg-emerald-100', w: '46%' },
               ].map((st, i) => (
                 <div key={i} className="relative">
                   <div className="flex justify-between mb-1">
                     <span className="font-bold text-slate-700 text-sm">{st.stage}</span>
                     <span className="font-extrabold text-slate-900 text-sm">{st.count}</span>
                   </div>
                   <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                     <motion.div initial={{width:0}} animate={{width: st.w}} className={`h-full ${st.bg} rounded-full`}></motion.div>
                   </div>
                   <p className="text-xs font-bold text-slate-400 mt-1">{st.pct} conversion</p>
                 </div>
               ))}
            </div>
         </Card>

         <Card className="p-8 border-slate-100 shadow-lg rounded-[2rem] bg-gradient-to-br from-amber-50 to-orange-50/20">
            <div className="flex items-start justify-between mb-8">
              <div>
                 <h3 className="text-xl font-bold flex items-center gap-2 tracking-tight text-amber-900 mb-1">
                   <Gift className="text-amber-600" /> Reward Program Rules
                 </h3>
                 <p className="text-sm font-semibold text-amber-700/70">Modify how customers earn points.</p>
              </div>
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white rounded-full">Edit Rules</Button>
            </div>

            <div className="space-y-4">
               <div className="bg-white p-5 rounded-2xl shadow-sm border border-amber-100">
                  <div className="flex justify-between items-center">
                     <div>
                        <p className="font-bold text-slate-900">Purchase Reward</p>
                        <p className="text-sm font-medium text-slate-500">Points earned on total bill amount</p>
                     </div>
                     <p className="font-black text-xl text-amber-600">1 pt / ₹100</p>
                  </div>
               </div>
               
               <div className="bg-white p-5 rounded-2xl shadow-sm border border-amber-100">
                  <div className="flex justify-between items-center">
                     <div>
                        <p className="font-bold text-slate-900">Referral Bonus</p>
                        <p className="text-sm font-medium text-slate-500">When existing refers a new customer</p>
                     </div>
                     <p className="font-black text-xl text-amber-600">500 pts</p>
                  </div>
               </div>

               <div className="bg-white p-5 rounded-2xl shadow-sm border border-amber-100">
                  <div className="flex justify-between items-center">
                     <div>
                        <p className="font-bold text-slate-900">Redemption Value</p>
                        <p className="text-sm font-medium text-slate-500">Discount calculation</p>
                     </div>
                     <p className="font-black text-xl text-amber-600">1 pt = ₹1</p>
                  </div>
               </div>
            </div>
         </Card>
      </div>
    </div>
  );
};

export default LoyaltyReports;
