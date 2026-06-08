import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const PageSkeleton = () => {
  return (
    <div className="flex-1 min-h-screen flex items-center justify-center bg-slate-50">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-500 tracking-wider uppercase animate-pulse">
          Loading...
        </p>
      </motion.div>
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-pulse w-full">
      <div className="w-12 h-12 bg-slate-200 rounded-xl mb-4"></div>
      <div className="h-5 bg-slate-200 rounded w-2/3 mb-2"></div>
      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
    </div>
  );
};

export const ListRowSkeleton = () => {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-slate-100 animate-pulse">
      <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
      <div className="flex-1">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-slate-200 rounded w-1/4"></div>
      </div>
      <div className="w-20 h-8 bg-slate-200 rounded-lg"></div>
    </div>
  );
};
