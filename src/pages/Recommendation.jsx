import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import { Button, Card } from '../components/ui';
import { AlertCircle, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const Recommendation = () => {
  const { recommendations, currentCustomer } = useApp();
  const navigate = useNavigate();

  const replaceNow = recommendations.filter(r => r.status === 'replace_now');
  const monitor = recommendations.filter(r => r.status === 'can_run');

  return (
    <div className="max-w-4xl mx-auto space-y-8 mt-4 pb-20">
      <div className="text-center max-w-2xl mx-auto mb-10">
         <motion.div initial={{scale:0.8, opacity:0}} animate={{scale:1, opacity:1}} className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 mx-auto mb-4 shadow-sm">
            <Zap size={40} />
         </motion.div>
         <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Smart Analysis</h2>
         <p className="text-slate-500 font-medium text-lg mt-3 leading-relaxed">
           Based on {currentCustomer?.name}'s inspection data and usage pattern, here is the transparent assessment.
         </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.1}}>
          <h3 className="flex items-center gap-2 text-xl font-bold text-red-600 mb-4 px-2">
            <AlertCircle /> Action Required
          </h3>
          <Card className="border-red-200 shadow-md bg-white overflow-hidden rounded-[2rem]">
            {replaceNow.length > 0 ? (
              <div className="divide-y divide-red-100">
                {replaceNow.map((item, idx) => (
                  <div key={idx} className="p-5 flex justify-between items-center bg-red-50/50 hover:bg-red-50 transition-colors">
                    <div>
                      <p className="font-bold text-slate-900 text-lg tracking-tight">{item.text}</p>
                      {item.pos && <p className="text-sm font-semibold text-red-600 uppercase tracking-widest mt-1">Position: {item.pos}</p>}
                    </div>
                    <div className="text-right">
                       <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">Critical</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 font-medium bg-slate-50">
                <p>No critical replacements needed.</p>
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.2}}>
          <h3 className="flex items-center gap-2 text-xl font-bold text-emerald-600 mb-4 px-2">
            <CheckCircle2 /> Monitor & Plan
          </h3>
          <Card className="border-emerald-200 shadow-md bg-white overflow-hidden rounded-[2rem]">
            {monitor.length > 0 ? (
              <div className="divide-y divide-emerald-100">
                {monitor.map((item, idx) => (
                  <div key={idx} className="p-5 flex justify-between items-center bg-emerald-50/50 hover:bg-emerald-50 transition-colors">
                    <div>
                      <p className="font-bold text-slate-900 text-lg tracking-tight">{item.text}</p>
                      {item.runText && <p className="text-sm font-semibold text-emerald-600 mt-1 flex items-center gap-1"><Zap size={14}/> Safe for {item.runText}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 font-medium bg-slate-50">
                <p>Everything is perfect.</p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-12">
        <Button onClick={() => navigate('/report')} size="lg" className="flex-1 md:flex-none md:min-w-[240px] h-16 text-lg rounded-full shadow-xl bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
          📄 Download Report
        </Button>
        <Button onClick={() => navigate('/service-catalog')} size="lg" variant="outline" className="flex-1 md:flex-none md:min-w-[240px] h-16 text-lg rounded-full gap-2 border-2">
          View Catalog &amp; Suggest <ChevronRight className="ml-1 w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default Recommendation;
