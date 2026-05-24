import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import { Button, Input } from '../components/ui';
import {
  CheckCircle2, AlertTriangle, Battery, Gauge, ArrowRight, Zap, X
} from 'lucide-react';

// ─── Vehicle silhouette classifier ──────────────────────────────────────────
const VEHICLE_PROFILES = {
  suv: ['Creta', 'Venue', 'Nexon', 'Punch', 'XUV700', 'Scorpio-N', 'Thar', 'Seltos', 'Sonet',
        'Brezza', 'Grand Vitara', 'Fronx', 'Hector', 'Astor', 'Gloster', 'Fortuner', 'Harrier',
        'Safari', 'Tucson', 'Compass', 'Meridian', 'Wrangler', 'Taigun', 'Tiguan', 'Kushaq',
        'Kodiaq', 'Glanza', 'Urban Cruiser Hyryder', 'EV6', 'ZSEV', 'Windsor EV', 'Curvv',
        'XUV 3XO', 'XUV300', 'Bolero', 'Magnite', 'Kiger', 'Superb', 'X-Trail'],
  mpv:  ['Ertiga', 'XL6', 'Carens', 'Triber', 'Innova Crysta', 'Innova Hycross', 'Rumion', 'Alcazar'],
  sedan: ['City', 'Amaze', 'Verna', 'Dzire', 'Aura', 'Slavia', 'Virtus', 'Camry', 'Aspire', 'Tigor'],
  hatch: ['Swift', 'Baleno', 'i20', 'Grand i10 Nios', 'Wagon R', 'Alto', 'Celerio', 'Ignis',
          'Altroz', 'Tiago', 'Kwid', 'Glanza', 'Figo', 'Freestyle', 'Comet EV'],
};

function getProfile(model = '') {
  for (const [p, models] of Object.entries(VEHICLE_PROFILES)) {
    if (models.some(m => m.toLowerCase() === model.toLowerCase())) return p;
  }
  return 'sedan';
}

// ─── Bird-eye SVG car ────────────────────────────────────────────────────────
function CarBirdEye({ profile, selectedTyre, onSelectTyre, inspectionData, batteryHealth, isBatterySelected, onSelectBattery }) {
  const profiles = {
    suv:   { bodyW: 88, bodyH: 180, bodyRx: 14, bodyY: 30, roofW: 72, roofH: 120, roofY: 60, windshieldH: 28, windshieldY: 46 },
    mpv:   { bodyW: 86, bodyH: 188, bodyRx: 12, bodyY: 26, roofW: 70, roofH: 130, roofY: 58, windshieldH: 26, windshieldY: 42 },
    sedan: { bodyW: 82, bodyH: 172, bodyRx: 18, bodyY: 34, roofW: 62, roofH: 104, roofY: 68, windshieldH: 24, windshieldY: 50 },
    hatch: { bodyW: 80, bodyH: 160, bodyRx: 18, bodyY: 40, roofW: 62, roofH: 90,  roofY: 68, windshieldH: 22, windshieldY: 52 },
  };
  const p = profiles[profile] || profiles.sedan;
  const CX = 100; // canvas centre x
  const CY = 120; // canvas centre y (vertical centre of 240 tall svg)

  // Tyre dimensions & positions (cx=centre, cy=centre)
  const tw = 18, th = 36;
  const tyrePositions = {
    FL: { cx: CX - p.bodyW / 2 - tw / 2 - 2, cy: CY - p.bodyH / 2 + 44 },
    FR: { cx: CX + p.bodyW / 2 + tw / 2 + 2, cy: CY - p.bodyH / 2 + 44 },
    RL: { cx: CX - p.bodyW / 2 - tw / 2 - 2, cy: CY + p.bodyH / 2 - 44 },
    RR: { cx: CX + p.bodyW / 2 + tw / 2 + 2, cy: CY + p.bodyH / 2 - 44 },
  };

  const conditionColors = {
    good:   { fill: '#10b981', stroke: '#059669' },
    uneven: { fill: '#f59e0b', stroke: '#d97706' },
    cracks: { fill: '#ef4444', stroke: '#dc2626' },
    bulge:  { fill: '#f43f5e', stroke: '#e11d48' },
  };

  function getTyreColor(pos) {
    const cond = inspectionData.tyres[pos]?.condition || 'good';
    return conditionColors[cond] || conditionColors.good;
  }

  return (
    <svg
      viewBox="0 0 200 275"
      preserveAspectRatio="xMidYMid meet"
      style={{ width: '100%', height: '100%', maxHeight: '100%', maxWidth: '100%', display: 'block' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="bodyGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </radialGradient>
        <radialGradient id="roofGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </radialGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#00000033" />
        </filter>
        <filter id="tyreShadow">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#00000055" />
        </filter>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── Car body ── */}
      <rect
        x={CX - p.bodyW / 2}
        y={CY - p.bodyH / 2}
        width={p.bodyW}
        height={p.bodyH}
        rx={p.bodyRx}
        fill="url(#bodyGrad)"
        stroke="#94a3b8"
        strokeWidth="1.5"
        filter="url(#shadow)"
      />

      {/* Roof / cabin */}
      <rect
        x={CX - p.roofW / 2}
        y={CY - p.bodyH / 2 + (p.roofY - (CY - p.bodyH / 2))}
        width={p.roofW}
        height={p.roofH}
        rx={10}
        fill="url(#roofGrad)"
        stroke="#64748b"
        strokeWidth="1"
        opacity="0.9"
      />

      {/* Front windshield */}
      <rect
        x={CX - p.roofW / 2 + 6}
        y={CY - p.bodyH / 2 + p.windshieldY - (CY - p.bodyH / 2)}
        width={p.roofW - 12}
        height={p.windshieldH}
        rx={4}
        fill="#bfdbfe"
        opacity="0.7"
        stroke="#93c5fd"
        strokeWidth="0.8"
      />

      {/* Rear windshield */}
      <rect
        x={CX - p.roofW / 2 + 6}
        y={CY - p.bodyH / 2 + (p.roofY - (CY - p.bodyH / 2)) + p.roofH - p.windshieldH - 2}
        width={p.roofW - 12}
        height={p.windshieldH}
        rx={4}
        fill="#bfdbfe"
        opacity="0.5"
        stroke="#93c5fd"
        strokeWidth="0.8"
      />

      {/* Front grille accent */}
      <rect
        x={CX - 18}
        y={CY - p.bodyH / 2 + 5}
        width={36}
        height={5}
        rx={2}
        fill="#334155"
        opacity="0.6"
      />

      {/* ── Battery icon at front-hood ── */}
      {(() => {
        const bx = CX;      // centre x
        const by = CY - p.bodyH / 2 - 20; // above front bumper
        const battColor = {
          good:    { fill: '#10b981', stroke: '#059669', label: '#fff' },
          weak:    { fill: '#f59e0b', stroke: '#d97706', label: '#fff' },
          replace: { fill: '#ef4444', stroke: '#dc2626', label: '#fff' },
        }[batteryHealth] || { fill: '#10b981', stroke: '#059669', label: '#fff' };
        const isSel = isBatterySelected;
        return (
          <g
            onClick={onSelectBattery}
            style={{ cursor: 'pointer' }}
            filter={isSel ? 'url(#glow)' : 'url(#tyreShadow)'}
          >
            {/* Outer glow ring */}
            {isSel && (
              <ellipse cx={bx} cy={by} rx={20} ry={16}
                fill="none" stroke={battColor.fill} strokeWidth="2" opacity="0.5" />
            )}
            {/* Body of battery */}
            <rect x={bx - 14} y={by - 9} width={28} height={18} rx={4}
              fill={battColor.fill} stroke={battColor.stroke}
              strokeWidth={isSel ? 2 : 1.5} opacity={isSel ? 1 : 0.9} />
            {/* Battery terminal nub */}
            <rect x={bx + 14} y={by - 4} width={4} height={8} rx={1.5}
              fill={battColor.stroke} />
            {/* Horizontal lines (battery cells look) */}
            <line x1={bx - 6} y1={by - 6} x2={bx - 6} y2={by + 6}
              stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
            <line x1={bx} y1={by - 6} x2={bx} y2={by + 6}
              stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
            {/* ⚡ lightning bolt logo */}
            <text x={bx - 8} y={by + 5} fontSize="10" fontWeight="900"
              fill={battColor.label} opacity="0.95">⚡</text>
            {/* Label below */}
            <text x={bx} y={by + 20} textAnchor="middle" fontSize="8.5"
              fontWeight="700" fill={isSel ? battColor.fill : '#475569'}>
              Battery
            </text>
          </g>
        );
      })()}

      {/* ── Tyres ── */}
      {Object.entries(tyrePositions).map(([pos, { cx, cy }]) => {
        const isSelected = selectedTyre === pos;
        const col = getTyreColor(pos);
        const hasData = inspectionData.tyres[pos]?.pressure || inspectionData.tyres[pos]?.tread;
        return (
          <g
            key={pos}
            onClick={() => onSelectTyre(pos)}
            style={{ cursor: 'pointer' }}
            filter={isSelected ? 'url(#glow)' : 'url(#tyreShadow)'}
          >
            {/* Outer tyre */}
            <rect
              x={cx - tw / 2}
              y={cy - th / 2}
              width={tw}
              height={th}
              rx={5}
              fill={isSelected ? col.fill : (hasData ? col.fill : '#475569')}
              stroke={isSelected ? '#fff' : col.stroke}
              strokeWidth={isSelected ? 2.5 : 1.5}
              opacity={isSelected ? 1 : 0.85}
            />
            {/* Rim */}
            <rect
              x={cx - tw / 2 + 4}
              y={cy - th / 2 + 6}
              width={tw - 8}
              height={th - 12}
              rx={3}
              fill={isSelected ? '#ffffffcc' : '#94a3b8cc'}
              stroke="none"
            />
            {/* Pulse ring when selected */}
            {isSelected && (
              <rect
                x={cx - tw / 2 - 4}
                y={cy - th / 2 - 4}
                width={tw + 8}
                height={th + 8}
                rx={8}
                fill="none"
                stroke={col.fill}
                strokeWidth="2"
                opacity="0.5"
              />
            )}
            {/* Label */}
            <text
              x={cx}
              y={cy + th / 2 + 12}
              textAnchor="middle"
              fontSize="9"
              fontWeight="700"
              fill={isSelected ? col.fill : '#64748b'}
            >
              {pos}
            </text>
          </g>
        );
      })}

      {/* ── Spare tyre (bottom centre) ── */}
      {(() => {
        const sx = CX, sy = CY + p.bodyH / 2 + 22;
        const isSelected = selectedTyre === 'Spare';
        const col = getTyreColor('Spare');
        const hasData = inspectionData.tyres['Spare']?.pressure || inspectionData.tyres['Spare']?.tread;
        return (
          <g onClick={() => onSelectTyre('Spare')} style={{ cursor: 'pointer' }} filter={isSelected ? 'url(#glow)' : 'url(#tyreShadow)'}>
            <circle
              cx={sx}
              cy={sy}
              r={14}
              fill={isSelected ? col.fill : (hasData ? col.fill : '#475569')}
              stroke={isSelected ? '#fff' : col.stroke}
              strokeWidth={isSelected ? 2.5 : 1.5}
              opacity={isSelected ? 1 : 0.85}
            />
            <circle cx={sx} cy={sy} r={7} fill={isSelected ? '#ffffffcc' : '#94a3b8cc'} />
            {isSelected && (
              <circle cx={sx} cy={sy} r={18} fill="none" stroke={col.fill} strokeWidth="2" opacity="0.5" />
            )}
            <text x={sx} y={sy + 26} textAnchor="middle" fontSize="9" fontWeight="700"
              fill={isSelected ? col.fill : '#64748b'}>Spare</text>
          </g>
        );
      })()}
    </svg>
  );
}

// ─── Condition dot legend ────────────────────────────────────────────────────
const COND_META = {
  good:   { label: 'Good',       color: 'bg-emerald-500' },
  uneven: { label: 'Uneven Wear',color: 'bg-amber-400' },
  cracks: { label: 'Cracks',     color: 'bg-red-500' },
  bulge:  { label: 'Bulge',      color: 'bg-rose-600' },
};

// ─── Main component ──────────────────────────────────────────────────────────
const VehicleInspection = () => {
  const { inspectionData, setInspectionData, currentVehicle, generateRecommendations, setInspectionCompleted, completeInspectionLog } = useApp();
  const navigate = useNavigate();

  const [selectedTyre, setSelectedTyre] = useState(null); // null | 'FL'|'FR'|'RL'|'RR'|'Spare'
  const [showBattery, setShowBattery] = useState(false);

  const profile = useMemo(() => getProfile(currentVehicle?.model), [currentVehicle?.model]);

  const tyreBrands = ['CEAT', 'MRF', 'Apollo', 'Bridgestone', 'Michelin', 'Goodyear',
                      'JK Tyre', 'Yokohama', 'Continental', 'Pirelli', 'Other'];

  const handleTyreChange = (pos, field, value) => {
    setInspectionData(prev => {
      if (field === 'brand') {
        const updatedTyres = {};
        Object.keys(prev.tyres).forEach(tp => {
          updatedTyres[tp] = { ...prev.tyres[tp], brand: value };
        });
        return { ...prev, tyres: updatedTyres };
      }
      return {
        ...prev,
        tyres: { ...prev.tyres, [pos]: { ...prev.tyres[pos], [field]: value } }
      };
    });
  };

  const handleBatteryChange = (field, value) => {
    setInspectionData(prev => ({ ...prev, battery: { ...prev.battery, [field]: value } }));
  };

  const completeInspection = () => {
    generateRecommendations();
    setInspectionCompleted(true);
    completeInspectionLog();
    navigate('/recommendation');
  };

  // Tyre completeness badge
  const tyreComplete = (pos) => {
    const t = inspectionData.tyres[pos];
    return t.pressure && t.tread;
  };

  const conditions = [
    { id: 'good',   label: 'Good',        icon: <CheckCircle2 size={16} />, color: 'text-emerald-600 bg-emerald-50 border-emerald-300' },
    { id: 'uneven', label: 'Uneven Wear', icon: <AlertTriangle size={16} />, color: 'text-amber-600 bg-amber-50 border-amber-300' },
    { id: 'cracks', label: 'Cracks/Cuts', icon: <AlertTriangle size={16} />, color: 'text-red-600 bg-red-50 border-red-300' },
    { id: 'bulge',  label: 'Bulge',       icon: <AlertTriangle size={16} />, color: 'text-rose-600 bg-rose-50 border-rose-300' },
  ];

  const TYRE_LABELS = { FL: 'Front Left', FR: 'Front Right', RL: 'Rear Left', RR: 'Rear Right', Spare: 'Spare Tyre' };

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 shrink-0">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Visual Inspection</h2>
          <p className="text-slate-500 font-medium text-lg mt-0.5">
            {currentVehicle ? `${currentVehicle.make} ${currentVehicle.model}` : 'Select a vehicle'}&nbsp;
            <span className="text-xs uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-1 font-bold">{profile}</span>
          </p>
        </div>
        <Button onClick={completeInspection} size="lg">
          Finish Review <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
        {/* ── Left: Bird-eye diagram + battery btn ── */}
        <div
          className="w-full md:w-72 lg:w-80 shrink-0 flex flex-col gap-3"
          style={{ minHeight: 0 }}
        >
          {/* Car diagram card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg flex-1 flex flex-col p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Tap a tyre to inspect
            </p>

            {/* SVG area */}
            <div
              className="flex-1 flex items-center justify-center"
              style={{ minHeight: 200, aspectRatio: '200/275' }}
            >
              <CarBirdEye
                profile={profile}
                selectedTyre={selectedTyre}
                onSelectTyre={(pos) => { setSelectedTyre(pos); setShowBattery(false); }}
                inspectionData={inspectionData}
                batteryHealth={inspectionData.battery.health}
                isBatterySelected={showBattery}
                onSelectBattery={() => { setShowBattery(true); setSelectedTyre(null); }}
              />
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 justify-center mt-3 pt-3 border-t border-slate-100">
              {Object.entries(COND_META).map(([k, v]) => (
                <span key={k} className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${v.color}`} />
                  {v.label}
                </span>
              ))}
            </div>
          </div>

          {/* Battery button */}
          <button
            onClick={() => { setShowBattery(true); setSelectedTyre(null); }}
            className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl border-2 font-bold transition-all shadow-sm ${
              showBattery
                ? 'bg-amber-50 border-amber-400 text-amber-700'
                : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50'
            }`}
          >
            <Battery size={20} />
            Battery Health
            {inspectionData.battery.health === 'weak' && (
              <span className="ml-auto text-xs bg-amber-400 text-white px-2 py-0.5 rounded-full">Attention</span>
            )}
            {inspectionData.battery.health === 'replace' && (
              <span className="ml-auto text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">Replace</span>
            )}
          </button>
        </div>

        {/* ── Right: Detail panel ── */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-y-auto">
          {!selectedTyre && !showBattery && (
            <div className="h-full flex flex-col items-center justify-center text-center px-8 py-12">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <svg viewBox="0 0 40 40" width="48" height="48" fill="none">
                  <rect x="5" y="5" width="30" height="30" rx="6" stroke="#94a3b8" strokeWidth="2" fill="#e2e8f0"/>
                  <rect x="1" y="12" width="8" height="16" rx="2" fill="#64748b"/>
                  <rect x="31" y="12" width="8" height="16" rx="2" fill="#64748b"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-700">Select a Tyre</h3>
              <p className="text-slate-400 mt-2 text-sm leading-relaxed max-w-xs">
                Click any tyre on the bird-eye diagram to inspect it, or use the Battery Health button below.
              </p>
              {/* Quick status bar */}
              <div className="mt-8 grid grid-cols-5 gap-2 w-full max-w-sm">
                {['FL','FR','RL','RR','Spare'].map(pos => {
                  const done = tyreComplete(pos);
                  const cond = inspectionData.tyres[pos]?.condition || 'good';
                  const col = { good: 'bg-emerald-400', uneven: 'bg-amber-400', cracks: 'bg-red-400', bulge: 'bg-rose-500' }[cond];
                  return (
                    <button
                      key={pos}
                      onClick={() => setSelectedTyre(pos)}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black border-2 transition-colors ${done ? `${col} text-white border-transparent` : 'bg-slate-100 text-slate-400 border-slate-200 hover:border-slate-300'}`}>
                        {pos}
                      </div>
                      <span className="text-xs text-slate-400 font-medium">{done ? '✓' : '–'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tyre detail panel */}
          {selectedTyre && !showBattery && (
            <div className="p-6 lg:p-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
              {/* Panel header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg border-2 ${
                    { good:'bg-emerald-50 border-emerald-300 text-emerald-700', uneven:'bg-amber-50 border-amber-300 text-amber-700', cracks:'bg-red-50 border-red-300 text-red-700', bulge:'bg-rose-50 border-rose-300 text-rose-700' }[inspectionData.tyres[selectedTyre]?.condition] || 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}>
                    {selectedTyre}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{TYRE_LABELS[selectedTyre]}</h3>
                    <p className="text-sm text-slate-400 font-medium">Tyre Inspection Data</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTyre(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <X size={16} className="text-slate-500" />
                </button>
              </div>

              {/* Brand & Size */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Brand</label>
                  <select
                    className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base shadow-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                    value={inspectionData.tyres[selectedTyre].brand}
                    onChange={(e) => handleTyreChange(selectedTyre, 'brand', e.target.value)}
                  >
                    <option value="">Select Brand</option>
                    {tyreBrands.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  {inspectionData.tyres[selectedTyre].brand && (
                    <p className="text-xs text-emerald-600 font-semibold mt-1">✓ Applied to all tyres</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Size</label>
                  <input
                    className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base shadow-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="e.g. 215/60 R16"
                    value={inspectionData.tyres[selectedTyre].size}
                    onChange={(e) => handleTyreChange(selectedTyre, 'size', e.target.value)}
                  />
                </div>
              </div>

              {/* Pressure & Tread */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Pressure (PSI)</label>
                  <input
                    type="number"
                    className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base shadow-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="e.g. 32"
                    value={inspectionData.tyres[selectedTyre].pressure}
                    onChange={(e) => handleTyreChange(selectedTyre, 'pressure', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Tread Depth (mm)</label>
                  <div className="relative">
                    <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="number"
                      step="0.1"
                      className="flex h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-base shadow-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                      placeholder="e.g. 4.5"
                      value={inspectionData.tyres[selectedTyre].tread}
                      onChange={(e) => handleTyreChange(selectedTyre, 'tread', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Visual condition */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Visual Condition
                </label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {conditions.map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleTyreChange(selectedTyre, 'condition', c.id)}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all font-bold text-sm tracking-tight ${
                        inspectionData.tyres[selectedTyre].condition === c.id
                          ? `${c.color} ring-2 ring-offset-1 ring-current`
                          : 'border-slate-100 text-slate-400 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {c.icon}
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigate to next tyre */}
              <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                <p className="text-sm text-slate-400 font-medium">
                  {tyreComplete(selectedTyre)
                    ? <span className="text-emerald-600 font-bold">✓ This tyre is complete</span>
                    : 'Fill pressure & tread depth to mark complete'}
                </p>
                {/* Next tyre shortcut */}
                {(() => {
                  const order = ['FL', 'FR', 'RL', 'RR', 'Spare'];
                  const idx = order.indexOf(selectedTyre);
                  const next = idx < order.length - 1 ? order[idx + 1] : null;
                  return next ? (
                    <button
                      onClick={() => setSelectedTyre(next)}
                      className="flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-800 transition-colors"
                    >
                      Next: {TYRE_LABELS[next]} <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => { setSelectedTyre(null); setShowBattery(true); }}
                      className="flex items-center gap-2 text-sm font-bold text-amber-600 hover:text-amber-800 transition-colors"
                    >
                      Next: Battery <Battery size={14} />
                    </button>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Battery panel */}
          {showBattery && (
            <div className="p-6 lg:p-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-500">
                    <Battery size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Battery Health</h3>
                    <p className="text-sm text-slate-400 font-medium">& Usage Pattern</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBattery(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <X size={16} className="text-slate-500" />
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Overall Health</label>
                  <div className="flex gap-3">
                    {['good', 'weak', 'replace'].map(h => (
                      <button
                        key={h}
                        onClick={() => handleBatteryChange('health', h)}
                        className={`flex-1 py-3 px-3 rounded-xl border-2 font-bold capitalize transition-colors text-sm ${
                          inspectionData.battery.health === h
                            ? (h === 'good' ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                              : h === 'weak' ? 'bg-amber-50 border-amber-500 text-amber-700'
                              : 'bg-red-50 border-red-500 text-red-700')
                            : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {h === 'replace' ? 'Replace' : h.charAt(0).toUpperCase() + h.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Battery Age (Months)</label>
                  <input
                    type="number"
                    className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base shadow-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="e.g. 24"
                    value={inspectionData.battery.age}
                    onChange={e => handleBatteryChange('age', e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Zap size={16} className="text-amber-500" /> Customer Usage Pattern
                </h4>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">Avg. Monthly Run (km)</label>
                    <input
                      type="number"
                      className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base shadow-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                      placeholder="e.g. 1500"
                      value={inspectionData.usage.monthlyKm}
                      onChange={e => setInspectionData(p => ({ ...p, usage: { ...p.usage, monthlyKm: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">Driving Style</label>
                    <select
                      className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base shadow-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                      value={inspectionData.usage.drivingStyle}
                      onChange={e => setInspectionData(p => ({ ...p, usage: { ...p.usage, drivingStyle: e.target.value } }))}
                    >
                      <option value="normal">City Commute (Normal)</option>
                      <option value="aggressive">Highway / Aggressive</option>
                      <option value="commercial">Commercial / Cab</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleInspection;
