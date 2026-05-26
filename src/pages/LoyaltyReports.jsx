import React, { useMemo, useState } from 'react';
import { Card, Button, Input } from '../components/ui';
import { useApp } from '../context/AppProvider';
import { BarChart3, Users, Gift, TrendingUp, ShieldCheck, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';

const REWARD_RULES_STORAGE_KEY = 'abhyaan_reward_rules';
const DEFAULT_REWARD_RULES = {
  purchasePoints: 1,
  purchaseAmount: 100,
  referralBonus: 500,
  redemptionValue: 1,
};

const formatCurrency = (value) => `₹${Math.round(value || 0).toLocaleString('en-IN')}`;

const getEstimateTotal = (estimate) => {
  const subtotal = (estimate?.items || []).reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 0)), 0);
  return subtotal + subtotal * 0.18;
};

const loadRewardRules = () => {
  try {
    const saved = localStorage.getItem(REWARD_RULES_STORAGE_KEY);
    return saved ? { ...DEFAULT_REWARD_RULES, ...JSON.parse(saved) } : DEFAULT_REWARD_RULES;
  } catch (e) {
    console.error('Error loading reward rules', e);
    return DEFAULT_REWARD_RULES;
  }
};

const metricCards = [
  { key: 'revenue', label: 'Total Revenue', icon: <TrendingUp />, color: 'text-emerald-500' },
  { key: 'inspections', label: 'Saved Reports', icon: <ShieldCheck />, color: 'text-blue-500' },
  { key: 'repeat', label: 'Repeat Customers', icon: <Users />, color: 'text-indigo-500' },
  { key: 'points', label: 'Points Earned', icon: <Gift />, color: 'text-amber-500' },
];

const LoyaltyReports = () => {
  const { jobsDb, customersDb } = useApp();
  const [rules, setRules] = useState(loadRewardRules);
  const [draftRules, setDraftRules] = useState(rules);
  const [editingRules, setEditingRules] = useState(false);

  const savedReports = useMemo(
    () => jobsDb.filter(job => job.status === 'Completed' && job.snapshot),
    [jobsDb]
  );

  const analytics = useMemo(() => {
    const revenue = savedReports.reduce((sum, report) => sum + getEstimateTotal(report.snapshot?.estimate), 0);
    const customersWithReports = new Map();

    savedReports.forEach(report => {
      const key = report.customerId || report.customerMobile || report.customerName;
      if (!key) return;
      customersWithReports.set(key, (customersWithReports.get(key) || 0) + 1);
    });

    const repeatFromReports = new Set(
      [...customersWithReports.entries()]
        .filter(([, count]) => count > 1)
        .map(([key]) => key)
    );

    customersDb.forEach(customer => {
      const key = customer.id || customer.mobile || customer.name;
      const hasMultipleVehicles = (customer.vehicles || []).length > 1;
      const hasHistory = (customer.pastInspections || []).length > 1;
      if (key && (hasMultipleVehicles || hasHistory)) repeatFromReports.add(key);
    });

    const activeCustomerCount = Math.max(customersWithReports.size, repeatFromReports.size);
    const repeatPercent = activeCustomerCount ? Math.round((repeatFromReports.size / activeCustomerCount) * 100) : 0;
    const pointsEarned = savedReports.reduce((sum, report) => {
      const total = getEstimateTotal(report.snapshot?.estimate);
      return sum + (Math.floor(total / rules.purchaseAmount) * rules.purchasePoints);
    }, 0);

    return {
      revenue,
      inspections: savedReports.length,
      repeatCustomers: repeatFromReports.size,
      repeatPercent,
      pointsEarned,
      recommendations: savedReports.filter(report => (report.snapshot?.recommendations || []).length > 0).length,
      estimates: savedReports.filter(report => (report.snapshot?.estimate?.items || []).length > 0).length,
      paid: savedReports.filter(report => report.snapshot?.estimate?.isPaid).length,
    };
  }, [customersDb, rules.purchaseAmount, rules.purchasePoints, savedReports]);

  const metrics = {
    revenue: formatCurrency(analytics.revenue),
    inspections: analytics.inspections.toLocaleString('en-IN'),
    repeat: `${analytics.repeatPercent}%`,
    points: analytics.pointsEarned.toLocaleString('en-IN'),
  };

  const funnel = [
    { stage: 'Reports Saved', count: analytics.inspections, pct: analytics.inspections ? '100%' : '0%', w: analytics.inspections ? '100%' : '0%', bg: 'bg-slate-300' },
    { stage: 'Recommendations Made', count: analytics.recommendations, pct: analytics.inspections ? `${Math.round((analytics.recommendations / analytics.inspections) * 100)}%` : '0%', w: analytics.inspections ? `${Math.round((analytics.recommendations / analytics.inspections) * 100)}%` : '0%', bg: 'bg-blue-200' },
    { stage: 'Estimates Shared', count: analytics.estimates, pct: analytics.inspections ? `${Math.round((analytics.estimates / analytics.inspections) * 100)}%` : '0%', w: analytics.inspections ? `${Math.round((analytics.estimates / analytics.inspections) * 100)}%` : '0%', bg: 'bg-indigo-200' },
    { stage: 'Paid Bills', count: analytics.paid, pct: analytics.inspections ? `${Math.round((analytics.paid / analytics.inspections) * 100)}%` : '0%', w: analytics.inspections ? `${Math.round((analytics.paid / analytics.inspections) * 100)}%` : '0%', bg: 'bg-emerald-200' },
  ];

  const saveRules = () => {
    const normalized = {
      purchasePoints: Math.max(1, Number(draftRules.purchasePoints) || DEFAULT_REWARD_RULES.purchasePoints),
      purchaseAmount: Math.max(1, Number(draftRules.purchaseAmount) || DEFAULT_REWARD_RULES.purchaseAmount),
      referralBonus: Math.max(0, Number(draftRules.referralBonus) || 0),
      redemptionValue: Math.max(1, Number(draftRules.redemptionValue) || DEFAULT_REWARD_RULES.redemptionValue),
    };

    setRules(normalized);
    setDraftRules(normalized);
    localStorage.setItem(REWARD_RULES_STORAGE_KEY, JSON.stringify(normalized));
    setEditingRules(false);
  };

  const updateDraftRule = (field, value) => {
    setDraftRules(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div className="mb-10">
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Analytics & Loyalty</h2>
        <p className="text-slate-500 font-medium text-lg mt-2">Live performance and customer retention data from saved reports.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((kpi, i) => (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} key={kpi.key}>
            <Card className="p-6 border-slate-100 shadow-md rounded-2xl flex flex-col justify-between h-full bg-white relative overflow-hidden group hover:border-primary-200 transition-colors">
              <div className="absolute top-0 right-0 -m-4 w-24 h-24 bg-slate-50 rounded-full z-0 group-hover:scale-150 transition-transform"></div>
              <div className="flex justify-between items-start z-10">
                <div>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">{kpi.label}</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter">{metrics[kpi.key]}</p>
                </div>
                <div className={`p-3 rounded-full bg-slate-50 ${kpi.color}`}>
                  {kpi.icon}
                </div>
              </div>
              <p className="mt-4 z-10 text-sm font-semibold text-slate-400">
                {savedReports.length ? 'Based on saved reports' : 'No saved data yet'}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8 pt-8">
        <Card className="p-8 border-slate-100 shadow-lg rounded-2xl bg-white">
          <h3 className="text-xl font-bold flex items-center gap-2 tracking-tight mb-8">
            <BarChart3 className="text-primary-600" /> Conversion Funnel
          </h3>

          {savedReports.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
              <BarChart3 className="mx-auto text-slate-300 mb-3" size={36} />
              <p className="font-bold text-slate-700">No analytics yet</p>
              <p className="text-sm font-medium text-slate-400 mt-1">Save reports to build the funnel.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {funnel.map((st, i) => (
                <div key={i} className="relative">
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-slate-700 text-sm">{st.stage}</span>
                    <span className="font-extrabold text-slate-900 text-sm">{st.count}</span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: st.w }} className={`h-full ${st.bg} rounded-full`}></motion.div>
                  </div>
                  <p className="text-xs font-bold text-slate-400 mt-1">{st.pct} conversion</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-8 border-slate-100 shadow-lg rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/20">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2 tracking-tight text-amber-900 mb-1">
                <Gift className="text-amber-600" /> Reward Program Rules
              </h3>
              <p className="text-sm font-semibold text-amber-700/70">
                {editingRules ? 'Update how customers earn points.' : 'Manager-controlled loyalty settings.'}
              </p>
            </div>
            {editingRules ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={saveRules} className="bg-amber-600 hover:bg-amber-700 text-white rounded-full gap-1">
                  <Save size={14} /> Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setDraftRules(rules); setEditingRules(false); }} className="rounded-full gap-1 bg-white">
                  <X size={14} /> Cancel
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => setEditingRules(true)} className="bg-amber-600 hover:bg-amber-700 text-white rounded-full">Edit Rules</Button>
            )}
          </div>

          <div className="space-y-4">
            <RuleRow
              title="Purchase Reward"
              description="Points earned on total bill amount"
              value={`${rules.purchasePoints} pt / ₹${rules.purchaseAmount}`}
              editing={editingRules}
            >
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" min="1" value={draftRules.purchasePoints} onChange={(e) => updateDraftRule('purchasePoints', e.target.value)} />
                <Input type="number" min="1" value={draftRules.purchaseAmount} onChange={(e) => updateDraftRule('purchaseAmount', e.target.value)} />
              </div>
            </RuleRow>

            <RuleRow
              title="Referral Bonus"
              description="When an existing customer refers a new customer"
              value={`${rules.referralBonus} pts`}
              editing={editingRules}
            >
              <Input type="number" min="0" value={draftRules.referralBonus} onChange={(e) => updateDraftRule('referralBonus', e.target.value)} />
            </RuleRow>

            <RuleRow
              title="Redemption Value"
              description="Discount calculation"
              value={`1 pt = ₹${rules.redemptionValue}`}
              editing={editingRules}
            >
              <Input type="number" min="1" value={draftRules.redemptionValue} onChange={(e) => updateDraftRule('redemptionValue', e.target.value)} />
            </RuleRow>
          </div>
        </Card>
      </div>
    </div>
  );
};

function RuleRow({ title, description, value, editing, children }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-amber-100">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <p className="font-bold text-slate-900">{title}</p>
          <p className="text-sm font-medium text-slate-500">{description}</p>
        </div>
        <div className="sm:min-w-[180px] sm:text-right">
          {editing ? children : <p className="font-black text-xl text-amber-600">{value}</p>}
        </div>
      </div>
    </div>
  );
}

export default LoyaltyReports;
