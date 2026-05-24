import React, { useId, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import { Button } from '../components/ui';
import {
  Download, Share2, CheckCircle2, AlertTriangle,
  Battery, Gauge, ArrowLeft, Zap, Phone, Mail,
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────
const COND_COLOR = {
  good:   { dot: '#10b981', label: 'Good',        text: '#065f46' },
  uneven: { dot: '#f59e0b', label: 'Uneven Wear', text: '#92400e' },
  cracks: { dot: '#ef4444', label: 'Cracks/Cuts', text: '#991b1b' },
  bulge:  { dot: '#f43f5e', label: 'Bulge',       text: '#9f1239' },
};

function treadStatus(mm) {
  const v = parseFloat(mm || 0);
  if (!v) return { label: 'N/A', color: '#94a3b8' };
  if (v >= 5)  return { label: 'Excellent', color: '#10b981' };
  if (v >= 3)  return { label: 'Good',      color: '#22c55e' };
  if (v >= 2)  return { label: 'Monitor',   color: '#f59e0b' };
  return { label: 'Replace', color: '#ef4444' };
}

function pressureStatus(psi) {
  const v = parseFloat(psi || 0);
  if (!v) return { label: 'N/A', color: '#94a3b8' };
  if (v >= 28 && v <= 36) return { label: 'Good',  color: '#10b981' };
  if (v > 36)             return { label: 'High',  color: '#f97316' };
  return { label: 'Low',  color: '#ef4444' };
}

// ─── Mini bird-eye SVG for the report ────────────────────────────────────────
function ReportCarDiagram({ inspectionData }) {
  const condColor = {
    good: '#10b981', uneven: '#f59e0b', cracks: '#ef4444', bulge: '#f43f5e',
  };
  const positions = {
    FL: { x: 36,  y: 46 },
    FR: { x: 128, y: 46 },
    RL: { x: 36,  y: 110 },
    RR: { x: 128, y: 110 },
  };
  const tw = 16, th = 28;
  return (
    <svg viewBox="0 0 164 200" width="164" height="200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="rBodyG" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#e2e8f0"/>
          <stop offset="100%" stopColor="#94a3b8"/>
        </radialGradient>
      </defs>
      {/* body */}
      <rect x="48" y="20" width="68" height="148" rx="14" fill="url(#rBodyG)" stroke="#94a3b8" strokeWidth="1.2"/>
      {/* roof */}
      <rect x="57" y="50" width="50" height="88" rx="8" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.8" opacity="0.9"/>
      {/* windshields */}
      <rect x="61" y="36" width="42" height="18" rx="4" fill="#bfdbfe" opacity="0.75"/>
      <rect x="61" y="124" width="42" height="16" rx="4" fill="#bfdbfe" opacity="0.5"/>
      {/* grille */}
      <rect x="72" y="22" width="20" height="7" rx="2.5" fill="#334155" opacity="0.65"/>
      {/* tyres */}
      {Object.entries(positions).map(([pos, { x, y }]) => {
        const col = condColor[inspectionData?.tyres?.[pos]?.condition] || condColor.good;
        return (
          <g key={pos}>
            <rect x={x - tw/2} y={y - th/2} width={tw} height={th} rx={4} fill={col} opacity="0.9"/>
            <rect x={x - tw/2+3} y={y - th/2+5} width={tw-6} height={th-10} rx={2.5} fill="rgba(255,255,255,0.5)"/>
            <text x={x} y={y + th/2 + 10} textAnchor="middle" fontSize="8" fontWeight="700" fill="#475569">{pos}</text>
          </g>
        );
      })}
      {/* spare */}
      {(() => {
        const col = condColor[inspectionData?.tyres?.Spare?.condition] || condColor.good;
        return (
          <g>
            <circle cx="82" cy="186" r="10" fill={col} opacity="0.85"/>
            <circle cx="82" cy="186" r="5" fill="rgba(255,255,255,0.5)"/>
            <text x="82" y="200" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#475569">Spare</text>
          </g>
        );
      })()}
    </svg>
  );
}

// ─── Battery gauge arc SVG — Premium redesign ────────────────────────────────
function BatteryGauge({ health }) {
  const pct   = health === 'good' ? 85 : health === 'weak' ? 45 : 15;
  const arcColor  = pct > 65 ? '#10b981' : pct > 35 ? '#f59e0b' : '#ef4444';
  const glowColor = pct > 65 ? '#10b98140' : pct > 35 ? '#f59e0b40' : '#ef444440';
  const label = pct > 65 ? 'Healthy' : pct > 35 ? 'Weak' : 'Replace';

  // Semicircle: 180° (left) → clockwise → 360° (right), through 270° (top)
  const cx = 90, cy = 88, r = 62;

  function polarXY(deg, radius = r) {
    const rad = (deg * Math.PI) / 180;
    return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
  }

  function arcPath(startDeg, endDeg) {
    const [x1, y1] = polarXY(startDeg);
    const [x2, y2] = polarXY(endDeg);
    const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    return `M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)}`;
  }

  const pctAngle = 180 + (pct / 100) * 180;
  const [nx, ny]   = polarXY(pctAngle, r * 0.68);
  const [tx, ty]   = polarXY(pctAngle + 180, r * 0.14); // needle tail

  // Tick marks — 9 ticks evenly across 180°
  const ticks = Array.from({ length: 9 }, (_, i) => {
    const deg = 180 + i * (180 / 8);
    const [ox, oy] = polarXY(deg, r + 4);
    const [ix, iy] = polarXY(deg, r - 4);
    const isMajor = i % 4 === 0;
    return { ox, oy, ix, iy, isMajor };
  });

  return (
    <svg viewBox="0 0 180 130" width="180" height="130" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Glow filter */}
        <filter id="gaugeGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="pivotGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        {/* Gradient for fill arc */}
        <linearGradient id="fillGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={arcColor} stopOpacity="0.6"/>
          <stop offset="100%" stopColor={arcColor} stopOpacity="1"/>
        </linearGradient>
      </defs>

      {/* Outer shadow track */}
      <path d={arcPath(180, 360)} stroke="#e2e8f0" strokeWidth="13" strokeLinecap="round" fill="none"/>

      {/* Coloured background segments */}
      <path d={arcPath(180, 240)} stroke="#fecaca" strokeWidth="10" strokeLinecap="butt" fill="none"/>
      <path d={arcPath(240, 300)} stroke="#fef08a" strokeWidth="10" strokeLinecap="butt" fill="none"/>
      <path d={arcPath(300, 360)} stroke="#bbf7d0" strokeWidth="10" strokeLinecap="butt" fill="none"/>

      {/* Active fill arc with glow */}
      {pct > 0 && (
        <path
          d={arcPath(180, pctAngle)}
          stroke={arcColor}
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          filter="url(#gaugeGlow)"
          opacity="0.95"
        />
      )}

      {/* Tick marks */}
      {ticks.map(({ ox, oy, ix, iy, isMajor }, i) => (
        <line key={i}
          x1={ox.toFixed(2)} y1={oy.toFixed(2)}
          x2={ix.toFixed(2)} y2={iy.toFixed(2)}
          stroke={isMajor ? '#94a3b8' : '#cbd5e1'}
          strokeWidth={isMajor ? 1.8 : 1}
          strokeLinecap="round"
        />
      ))}

      {/* Glow halo behind pivot */}
      <circle cx={cx} cy={cy} r="10" fill={glowColor}/>

      {/* Needle shadow */}
      <line x1={tx.toFixed(2)} y1={ty.toFixed(2)} x2={nx.toFixed(2)} y2={ny.toFixed(2)}
        stroke="#0000001a" strokeWidth="5" strokeLinecap="round"/>

      {/* Needle */}
      <line x1={tx.toFixed(2)} y1={ty.toFixed(2)} x2={nx.toFixed(2)} y2={ny.toFixed(2)}
        stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round"/>

      {/* Pivot rings */}
      <circle cx={cx} cy={cy} r="7" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5"/>
      <circle cx={cx} cy={cy} r="4" fill="#1e293b" filter="url(#pivotGlow)"/>

      {/* Percentage */}
      <text x={cx} y={cy + 20} textAnchor="middle" fontSize="13"
        fontWeight="900" fill={arcColor} letterSpacing="0.5">{pct}%</text>

      {/* Status label */}
      <text x={cx} y={cy + 32} textAnchor="middle" fontSize="7.5"
        fontWeight="700" fill="#94a3b8" letterSpacing="1" textDecoration="none"
        style={{ textTransform: 'uppercase' }}>{label}</text>
    </svg>
  );
}

// ─── Tyre row ────────────────────────────────────────────────────────────────
function TyreRow({ pos, data, label }) {
  const cond = COND_COLOR[data?.condition] || COND_COLOR.good;
  const tr = treadStatus(data?.tread);
  const ps = pressureStatus(data?.pressure);

  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid #f1f5f9' }}>
      {/* SVG tyre icon */}
      <svg viewBox="0 0 36 60" width="30" height="50" style={{ shrink:0 }}>
        <rect x="1" y="1" width="34" height="58" rx="7" fill={cond.dot} opacity="0.85"/>
        <rect x="6" y="9" width="24" height="42" rx="5" fill="rgba(255,255,255,0.45)"/>
        <text x="18" y="35" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff">{pos}</text>
      </svg>

      <div style={{ flex:1 }}>
        <p style={{ margin:0, fontWeight:700, fontSize:13, color:'#1e293b' }}>{label}</p>
        <p style={{ margin:'2px 0 0', fontSize:11, color:'#64748b' }}>
          {data?.brand || '—'} {data?.size ? `· ${data.size}` : ''}
        </p>
      </div>

      {/* Metrics */}
      <div style={{ display:'flex', gap:16, fontSize:11, fontWeight:600 }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ color:'#94a3b8', fontSize:10, marginBottom:2 }}>Tread</div>
          <div style={{ color: tr.color }}>{data?.tread ? `${data.tread}mm` : '—'}</div>
          <div style={{ color: tr.color, fontSize:9 }}>{tr.label}</div>
        </div>
        <div style={{ textAlign:'center' }}>
          <div style={{ color:'#94a3b8', fontSize:10, marginBottom:2 }}>Pressure</div>
          <div style={{ color: ps.color }}>{data?.pressure ? `${data.pressure} PSI` : '—'}</div>
          <div style={{ color: ps.color, fontSize:9 }}>{ps.label}</div>
        </div>
        <div style={{ textAlign:'center' }}>
          <div style={{ color:'#94a3b8', fontSize:10, marginBottom:2 }}>Condition</div>
          <div style={{ color: cond.text, fontWeight:700 }}>{cond.label}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Report Component ────────────────────────────────────────────────────
const DigitalReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const liveContext = useApp();
  
  // If navigated from Reports Hub, use the snapshot. Otherwise use live session.
  const isHistoric = !!location.state?.jobSnapshot;
  const snapshot = location.state?.jobSnapshot?.snapshot;
  const jobRecord = location.state?.jobSnapshot;

  const currentCustomer = isHistoric ? { name: jobRecord.customerName, mobile: jobRecord.customerMobile } : liveContext.currentCustomer;
  const currentVehicle = isHistoric ? { make: jobRecord.vehicle.split(' ')[0], model: jobRecord.vehicle.split(' ').slice(1).join(' '), year: jobRecord.vehicleYear, fuelType: jobRecord.vehicleFuelType, odometer: jobRecord.vehicleOdometer } : liveContext.currentVehicle;
  
  const inspectionData = isHistoric ? snapshot?.inspectionData : liveContext.inspectionData;
  const recommendations = isHistoric ? snapshot?.recommendations || [] : liveContext.recommendations;
  const estimate = isHistoric ? snapshot?.estimate : liveContext.estimate;

  const reportRef = useRef(null);
  const liveReportId = useId();
  const [sharing, setSharing] = useState(false);

  const reportDate = isHistoric ? new Date(jobRecord.date) : new Date();
  const date = reportDate.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
  const time = reportDate.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
  const reportId = isHistoric ? jobRecord.id : `REP-${liveReportId.replace(/\W/g, '').toUpperCase()}`;

  const hasCritical = recommendations.some(r => r.status === 'replace_now');

  const TYRE_LABELS = {
    FL:'Front Left', FR:'Front Right', RL:'Rear Left', RR:'Rear Right', Spare:'Spare'
  };

  const handleDownload = () => {
    window.print();
  };

  const handleShare = () => {
    const name = currentCustomer?.name || 'Customer';
    const mobile = currentCustomer?.mobile || '';
    const vehicle = currentVehicle ? `${currentVehicle.make} ${currentVehicle.model} (${currentVehicle.year})` : 'your vehicle';
    const msg = encodeURIComponent(
      `Hi ${name}! 🚗 Your Vehicle Health Report from Abahaan is ready.\n` +
      `Vehicle: ${vehicle}\nReport ID: ${reportId}\nDate: ${date}\n\n` +
      `Thank you for visiting us. Drive safe! 🙏`
    );
    const waUrl = mobile
      ? `https://wa.me/91${mobile}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
    window.open(waUrl, '_blank');
    setSharing(true);
    setTimeout(() => setSharing(false), 3000);
  };

  // ── Styles (inline so they survive print) ──
  const S = {
    page: {
      fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
      background: '#fff',
      color: '#1e293b',
      maxWidth: 860,
      margin: '0 auto',
      padding: '0 0 48px',
    },
    topBar: {
      background: 'linear-gradient(135deg,#1e3a5f 0%, #2563eb 100%)',
      padding: '18px 36px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    brandName: { color:'#fff', fontWeight:900, fontSize:22, letterSpacing:1 },
    brandSub:  { color:'#93c5fd', fontSize:11, fontWeight:600, letterSpacing:2 },
    repId: { color:'#93c5fd', fontSize:11, fontWeight:700, textAlign:'right' },
    metaBar: {
      background:'#f8fafc', borderBottom:'1px solid #e2e8f0',
      padding:'10px 36px', display:'flex', gap:24,
      fontSize:12, fontWeight:600, color:'#475569', flexWrap:'wrap',
    },
    body: { padding:'24px 36px 0' },
    sectionTitle: {
      fontSize:16, fontWeight:900, color:'#1e293b',
      textTransform:'uppercase', letterSpacing:1,
      borderBottom:'2px solid #2563eb', paddingBottom:6,
      marginBottom:16, marginTop:28,
    },
    twoCol: { display:'flex', gap:24 },
    leftCol: { flex:'0 0 200px' },
    rightCol: { flex:1 },
    battCard: {
      border:'1px solid #e2e8f0', borderRadius:12,
      padding:'16px 16px 8px', background:'#f8fafc',
    },
    battTitle: { fontWeight:800, fontSize:13, color:'#1e293b', marginBottom:8 },
    battMeta: { fontSize:11, color:'#475569', lineHeight:1.7 },
    overallBadge: (crit) => ({
      background: crit ? '#fef2f2' : '#f0fdf4',
      border: `1.5px solid ${crit ? '#fca5a5' : '#86efac'}`,
      borderLeft: `5px solid ${crit ? '#ef4444' : '#22c55e'}`,
      borderRadius:10, padding:'12px 16px',
      display:'flex', gap:12, alignItems:'flex-start', marginBottom:16,
    }),
    recCard: {
      border:'1px solid #e2e8f0', borderRadius:10, padding:'10px 14px',
      marginBottom:8, display:'flex', alignItems:'flex-start', gap:10,
    },
  };

  return (
    <>
      {/* ── Print styles injected via <style> ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @media print {
          body * { visibility: hidden !important; }
          #report-printable, #report-printable * { visibility: visible !important; }
          #report-printable { position: fixed; top:0; left:0; width:100%; background:#fff; z-index:9999; }
          .no-print { display: none !important; }
          @page { margin: 0.4cm; size: A4; }
        }
      `}</style>

      {/* ── Screen toolbar (hidden on print) ── */}
      <div className="no-print max-w-4xl mx-auto mb-4 flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors"
        >
          <ArrowLeft size={18}/> Back
        </button>
        <div className="flex gap-3">
          <Button onClick={handleShare} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" size="lg">
            <Share2 size={16}/>
            {sharing ? 'Sent ✓' : 'Send WhatsApp'}
          </Button>
          <Button onClick={handleDownload} className="gap-2" size="lg">
            <Download size={16}/> Download PDF
          </Button>
        </div>
      </div>

      {/* ── The report document ── */}
      <div id="report-printable" ref={reportRef} style={S.page}>

        {/* Header bar */}
        <div style={S.topBar}>
          <div>
            <div style={S.brandName}>Abahaan</div>
            <div style={S.brandSub}>VEHICLE INSPECTION & SERVICE POS</div>
          </div>
          <div style={S.repId}>
            <div style={{ color:'#fff', fontWeight:800, fontSize:18 }}>Vehicle Health Report</div>
            <div>{reportId}</div>
            <div>{date} · {time}</div>
          </div>
        </div>

        {/* Meta bar */}
        <div style={S.metaBar}>
          <span>👤 Customer: <strong style={{color:'#1e293b'}}>{currentCustomer?.name || 'Walk-in'}</strong></span>
          <span>📱 {currentCustomer?.mobile || '—'}</span>
          <span>🚗 Vehicle: <strong style={{color:'#1e293b'}}>{currentVehicle ? `${currentVehicle.make} ${currentVehicle.model} (${currentVehicle.year})` : '—'}</strong></span>
          <span>📍 Odometer: <strong style={{color:'#1e293b'}}>{currentVehicle?.odometer ? `${currentVehicle.odometer} km` : '—'}</strong></span>
        </div>

        <div style={S.body}>

          {/* Overall health badge */}
          <div style={{ paddingTop:20 }}>
            <div style={S.overallBadge(hasCritical)}>
              <div style={{ marginTop:2 }}>
                {hasCritical
                  ? <AlertTriangle size={22} color="#ef4444"/>
                  : <CheckCircle2  size={22} color="#22c55e"/>}
              </div>
              <div>
                <p style={{ margin:0, fontWeight:800, fontSize:15, color: hasCritical ? '#991b1b' : '#166534' }}>
                  {hasCritical ? 'Action Required — Immediate Attention Needed' : 'Vehicle in Good Health'}
                </p>
                <p style={{ margin:'4px 0 0', fontSize:12, color:'#475569' }}>
                  {hasCritical
                    ? 'One or more tyres require immediate replacement based on tread depth and visual inspection results.'
                    : 'All tyres and battery are in acceptable condition. Keep up with regular maintenance for a safe drive.'}
                </p>
              </div>
            </div>
          </div>

          {/* Section: Tyre Inspection Analysis */}
          <div style={S.sectionTitle}>Tyre Inspection Analysis</div>

          <div style={S.twoCol}>
            {/* Bird-eye diagram */}
            <div style={S.leftCol}>
              <div style={{ border:'1px solid #e2e8f0', borderRadius:12, padding:12, background:'#f8fafc', display:'inline-block' }}>
                <ReportCarDiagram inspectionData={inspectionData}/>
                {/* legend */}
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px 12px', marginTop:6, justifyContent:'center' }}>
                  {Object.entries(COND_COLOR).map(([k, v]) => (
                    <span key={k} style={{ display:'flex', alignItems:'center', gap:4, fontSize:9, fontWeight:600, color:'#475569' }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:v.dot, display:'inline-block' }}/>
                      {v.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Battery Health */}
            <div style={S.rightCol}>
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                background: 'linear-gradient(160deg, #f0fdf4 0%, #f8fafc 60%, #eff6ff 100%)',
                overflow: 'visible',
                boxShadow: '0 1px 6px #0000000a',
              }}>
                {/* Card header */}
                <div style={{
                  background: 'linear-gradient(90deg, #1e3a5f 0%, #2563eb 100%)',
                  padding: '10px 16px',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <Battery size={16} color="#fff" />
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: 0.5 }}>Battery Health Check</span>
                </div>

                {/* Gauge centred */}
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 14, paddingBottom: 4 }}>
                  <BatteryGauge health={inspectionData?.battery?.health}/>
                </div>

                {/* Metadata grid */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  gap: '0', borderTop: '1px solid #e2e8f0',
                }}>
                  {[
                    { label: 'Status', value: inspectionData?.battery?.health === 'good' ? '✅ Good' : inspectionData?.battery?.health === 'weak' ? '⚠️ Weak' : '🔴 Replace' },
                    { label: 'Age', value: inspectionData?.battery?.age ? `${inspectionData.battery.age} months` : 'N/A' },
                    { label: 'Fuel Type', value: currentVehicle?.fuelType || '—' },
                    { label: 'Drive Style', value: inspectionData?.usage?.drivingStyle === 'aggressive' ? 'Highway' : inspectionData?.usage?.drivingStyle === 'commercial' ? 'Commercial' : 'City (Normal)' },
                    { label: 'Monthly Run', value: inspectionData?.usage?.monthlyKm ? `${inspectionData.usage.monthlyKm} km` : 'N/A' },
                  ].map((item, i) => (
                    <div key={i} style={{
                      padding: '8px 14px',
                      borderBottom: '1px solid #f1f5f9',
                      borderRight: i % 2 === 0 ? '1px solid #f1f5f9' : 'none',
                    }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Per-tyre rows */}
          <div style={{ marginTop:12 }}>
            {['FL','FR','RL','RR','Spare'].map(pos => (
              <TyreRow
                key={pos}
                pos={pos}
                label={TYRE_LABELS[pos]}
                data={inspectionData?.tyres?.[pos]}
              />
            ))}
          </div>

          {/* Section: Recommendations */}
          <div style={S.sectionTitle}>Smart Recommendations & Next Steps</div>
          <p style={{ fontSize:12, color:'#475569', marginBottom:12 }}>
            Based on your inspection data and driving pattern, we recommend:
          </p>

          {recommendations.length > 0 ? (
            recommendations.map((rec, i) => {
              const isCrit = rec.status === 'replace_now';
              return (
                <div key={i} style={{
                  ...S.recCard,
                  background: isCrit ? '#fef2f2' : '#f0fdf4',
                  borderLeft: `4px solid ${isCrit ? '#ef4444' : '#22c55e'}`,
                }}>
                  <div style={{ marginTop:1 }}>
                    {isCrit ? <AlertTriangle size={16} color="#ef4444"/> : <CheckCircle2 size={16} color="#22c55e"/>}
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ margin:0, fontWeight:700, fontSize:13, color:'#1e293b' }}>{rec.text}</p>
                    {rec.runText && <p style={{ margin:'2px 0 0', fontSize:11, color:'#059669' }}>✓ Safe for {rec.runText}</p>}
                    {rec.pos && <p style={{ margin:'2px 0 0', fontSize:11, color:'#6b7280' }}>Position: {TYRE_LABELS[rec.pos] || rec.pos}</p>}
                  </div>
                  <div style={{
                    fontSize:10, fontWeight:800, padding:'3px 8px', borderRadius:6,
                    background: isCrit ? '#ef4444' : '#22c55e', color:'#fff',
                  }}>
                    {isCrit ? 'URGENT' : 'MONITOR'}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ color:'#64748b', fontSize:12, fontStyle:'italic' }}>No specific recommendations. Vehicle is in good condition.</div>
          )}

          {/* Services rendered (if any) */}
          {estimate?.items?.length > 0 && (
            <>
              <div style={S.sectionTitle}>Services & Products</div>
              {estimate.items.map((item, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px dashed #e2e8f0', fontSize:12 }}>
                  <span style={{ fontWeight:600 }}>✓ {item.name} × {item.qty}</span>
                  {item.price && <span style={{ fontWeight:700, color:'#2563eb' }}>₹{(item.price * item.qty).toLocaleString('en-IN')}</span>}
                </div>
              ))}
            </>
          )}

          {/* Service history hint */}
          <div style={{ marginTop:28, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:'14px 18px', display:'flex', gap:16, alignItems:'center' }}>
            <div style={{ fontSize:28 }}>📋</div>
            <div>
              <div style={{ fontWeight:800, fontSize:13, color:'#1e293b', marginBottom:4 }}>Your Service History & Next Reminder</div>
              <div style={{ fontSize:11, color:'#475569' }}>
                Loyalty Points: <strong>{currentCustomer?.loyalty || 0} pts</strong> &nbsp;|&nbsp;
                Next Service Due: <strong>{currentVehicle?.odometer ? `${(parseInt(currentVehicle.odometer || 0) + 10000).toLocaleString('en-IN')} km` : '—'}</strong>
              </div>
              <div style={{ fontSize:10, color:'#94a3b8', marginTop:4 }}>
                You will receive a WhatsApp reminder when your vehicle is due for service.
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop:36, paddingTop:16, borderTop:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:10, color:'#94a3b8' }}>
              <div style={{ fontWeight:700, color:'#475569', marginBottom:2 }}>Abahaan Vehicle Inspection POS</div>
              <div>This report is auto-generated based on in-person inspection. Report ID: {reportId}</div>
            </div>
            <div style={{ textAlign:'right', fontSize:10, color:'#94a3b8' }}>
              <div>Powered by Abahaan Systems</div>
              <div style={{ fontWeight:700, color:'#2563eb' }}>abahaan.in</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DigitalReport;
