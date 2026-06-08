import React, { useMemo } from 'react';
import { useData } from '../context/AppProvider';
import { Card } from '../components/ui';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Users, Wrench, ShieldCheck, PieChart as PieChartIcon, IndianRupee, Star } from 'lucide-react';
import { PageSkeleton } from '../components/Skeleton';
import { motion } from 'framer-motion';

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

const AnalyticsDashboard = () => {
  const { jobsDb, inspectionLogs, isLoading } = useData();

  const analytics = useMemo(() => {
    if (!jobsDb || jobsDb.length === 0) return null;

    const completedJobs = jobsDb.filter(j => j.status === 'Completed' && j.snapshot?.estimate);
    const inProgressJobs = jobsDb.filter(j => j.status === 'In Progress' || j.status === 'pending' || j.status === 'in_progress');
    const reminderJobs = jobsDb.filter(j => j.status === 'Pending Reminder');
    const lostJobs = jobsDb.filter(j => j.status === 'Lost Opportunity');
    const estimates = jobsDb.filter(j => j.snapshot?.estimate?.items?.length);
    const reminderConversion = reminderJobs.length
      ? Math.round((completedJobs.filter(job => job.snapshot?.estimate?.customerDecision === 'approved').length / reminderJobs.length) * 100)
      : 0;
    const completedInspectionLogs = inspectionLogs.filter(log => log.status === 'completed');
    const compliance = inspectionLogs.length ? Math.round((completedInspectionLogs.length / inspectionLogs.length) * 100) : 0;
    const tyreLifeByTerrain = {};

    let totalRevenue = 0;
    let totalDiscount = 0;
    const revenueByDateMap = {};
    const servicesMap = {};

    completedJobs.forEach(job => {
      const estimate = job.snapshot.estimate;
      const dateStr = new Date(job.date || job.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Compute exact total
      const cart = estimate.items || [];
      const subtotal = cart.reduce((acc, current) => acc + (current.price * current.qty), 0);
      const discount = (estimate.loyaltyApplied || 0) * 1; // Assuming 1 pt = 1 rupee
      const taxableAmount = Math.max(0, subtotal - discount);
      const finalTotal = taxableAmount * 1.18; // Adding 18% GST

      totalRevenue += finalTotal;
      totalDiscount += discount;

      // Group by date
      if (!revenueByDateMap[dateStr]) revenueByDateMap[dateStr] = 0;
      revenueByDateMap[dateStr] += finalTotal;

      // Group by services
      cart.forEach(item => {
        if (!servicesMap[item.name]) servicesMap[item.name] = { name: item.name, count: 0, revenue: 0 };
        servicesMap[item.name].count += item.qty;
        servicesMap[item.name].revenue += item.price * item.qty;
      });

      Object.values(estimate?.inspectionData?.tyres || job.snapshot?.inspectionData?.tyres || {}).forEach(tyre => {
        const terrain = job.snapshot?.inspectionData?.usage?.terrain || 'unknown';
        if (!tyreLifeByTerrain[terrain]) tyreLifeByTerrain[terrain] = { name: terrain, treadTotal: 0, count: 0 };
        tyreLifeByTerrain[terrain].treadTotal += Number(tyre.tread || 0);
        tyreLifeByTerrain[terrain].count += 1;
      });
    });

    const revenueByDate = Object.keys(revenueByDateMap).map(date => ({
      date,
      revenue: Math.round(revenueByDateMap[date])
    }));

    const topServices = Object.values(servicesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const statusData = [
      { name: 'Completed', value: completedJobs.length },
      { name: 'In Progress/Pending', value: inProgressJobs.length },
    ];

    return {
      totalRevenue,
      totalDiscount,
      totalJobs: completedJobs.length,
      arpu: completedJobs.length > 0 ? totalRevenue / completedJobs.length : 0,
      revenueByDate,
      topServices,
      statusData,
      reminderConversion,
      compliance,
      pendingReminders: reminderJobs.length,
      lostOpportunities: lostJobs.length,
      estimateCount: estimates.length,
      tyreLifeByTerrain: Object.values(tyreLifeByTerrain).map(item => ({
        name: item.name,
        avgTread: item.count ? Number((item.treadTotal / item.count).toFixed(1)) : 0,
      })),
    };
  }, [inspectionLogs, jobsDb]);

  if (isLoading) return <PageSkeleton />;

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center">
        <PieChartIcon size={64} className="text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-700">No Data Available</h2>
        <p className="text-slate-500">Complete some jobs to see analytics populate here.</p>
      </div>
    );
  }

  const kpis = [
    { title: 'Total Revenue', value: `₹${analytics.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: <IndianRupee size={24} className="text-emerald-500" />, bg: 'bg-emerald-50' },
    { title: 'Avg. Revenue Per Job', value: `₹${analytics.arpu.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: <TrendingUp size={24} className="text-indigo-500" />, bg: 'bg-indigo-50' },
    { title: 'Completed Jobs', value: analytics.totalJobs, icon: <ShieldCheck size={24} className="text-amber-500" />, bg: 'bg-amber-50' },
    { title: 'Total Discounts Given', value: `₹${analytics.totalDiscount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: <Users size={24} className="text-pink-500" />, bg: 'bg-pink-50' },
    { title: 'Pending Reminders', value: analytics.pendingReminders, icon: <Wrench size={24} className="text-blue-500" />, bg: 'bg-blue-50' },
    { title: 'Reminder Conversion', value: `${analytics.reminderConversion}%`, icon: <TrendingUp size={24} className="text-emerald-500" />, bg: 'bg-emerald-50' },
    { title: 'Inspection Compliance', value: `${analytics.compliance}%`, icon: <ShieldCheck size={24} className="text-indigo-500" />, bg: 'bg-indigo-50' },
    { title: 'Lost Opportunities', value: analytics.lostOpportunities, icon: <Users size={24} className="text-red-500" />, bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
          <PieChartIcon className="text-primary-600" size={32} /> Analytics Dashboard
        </h2>
        <p className="text-slate-500 font-medium mt-1">Real-time performance metrics and revenue insights.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="p-6 flex items-center gap-4 rounded-[2rem] border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${kpi.bg}`}>
                {kpi.icon}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{kpi.title}</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{kpi.value}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Revenue Line Chart */}
        <Card className="p-6 rounded-[2rem] border-slate-100 shadow-lg lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary-500" /> Revenue Trend
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.revenueByDate}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `₹${val/1000}k`} />
                <RechartsTooltip 
                  cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8, stroke: '#6366f1', strokeWidth: 2, fill: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Status Pie Chart */}
        <Card className="p-6 rounded-[2rem] border-slate-100 shadow-lg">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Wrench size={20} className="text-amber-500" /> Job Floor Status
          </h3>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {analytics.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#f59e0b'} />
                  ))}
                </Pie>
                <RechartsTooltip 
                   contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
             {analytics.statusData.map((entry, index) => (
               <div key={entry.name} className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: index === 0 ? '#10b981' : '#f59e0b' }}></div>
                 <span className="text-sm font-bold text-slate-600">{entry.name} ({entry.value})</span>
               </div>
             ))}
          </div>
        </Card>
      </div>

      {/* Top Services Bar Chart */}
      <Card className="p-6 rounded-[2rem] border-slate-100 shadow-lg">
        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Star size={20} className="text-pink-500" /> Top Selling Services & Parts (By Revenue)
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.topServices} layout="vertical" margin={{ left: 50, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `₹${val/1000}k`} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} width={120} />
              <RechartsTooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [`₹${value}`, 'Revenue']}
              />
              <Bar dataKey="revenue" radius={[0, 8, 8, 0]} barSize={32}>
                {analytics.topServices.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {analytics.tyreLifeByTerrain.length > 0 && (
        <Card className="p-6 rounded-[2rem] border-slate-100 shadow-lg">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-500" /> Tyre Life vs Usage Terrain
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.tyreLifeByTerrain}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <RechartsTooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value) => [`${value} mm`, 'Avg Tread']} />
                <Bar dataKey="avgTread" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
