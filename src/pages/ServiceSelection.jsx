import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import { Button, Card } from '../components/ui';
import { ShoppingCart, Plus, Minus, Tag, ShieldCheck } from 'lucide-react';

const catalog = {
  tyres: [
    { id: 't1', name: 'CEAT Milaze X3', category: 'Good', price: 4200, warranty: '3 Years', tags: ['High Life'] },
    { id: 't2', name: 'Apollo Alnac 4G', category: 'Better', price: 5500, warranty: '4 Years', tags: ['Comfort', 'Grip'] },
    { id: 't3', name: 'Michelin Primacy 4 ST', category: 'Best', price: 7800, warranty: '5 Years', tags: ['Premium', 'Silent'] },
  ],
  services: [
    { id: 's1', name: 'Wheel Alignment', price: 450 },
    { id: 's2', name: 'Wheel Balancing (per wheel)', price: 150 },
    { id: 's3', name: 'General Service', price: 2999 },
    { id: 's4', name: 'Battery Replacement', price: 4500 },
  ]
};

const ServiceSelection = () => {
  const { estimate, setEstimate } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('tyres'); // tyres, services
  const cart = estimate.items || [];

  const updateCart = (item, qty) => {
    let newCart = [...cart];
    const existing = newCart.find(i => i.id === item.id);
    if (existing) {
      if (qty <= 0) newCart = newCart.filter(i => i.id !== item.id);
      else existing.qty = qty;
    } else if (qty > 0) {
      newCart.push({ ...item, qty });
    }
    setEstimate({ ...estimate, items: newCart });
  };

  const getQty = (id) => cart.find(i => i.id === id)?.qty || 0;

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-[calc(100vh-140px)] space-y-6">
      <div className="flex justify-between items-center shrink-0 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Catalog</h2>
          <p className="text-slate-500 font-medium text-lg mt-1">Select replacements and add-on services</p>
        </div>
        
        <Button onClick={() => navigate('/estimate')} size="lg" className="rounded-full shadow-lg h-14 relative px-8" variant={cart.length > 0 ? 'primary' : 'secondary'}>
          <ShoppingCart className="mr-2" size={24} /> 
          View Estimate 
          {cart.length > 0 && (
             <span className="absolute -top-2 -right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-sm ring-2 ring-white scale-in">
               {cart.reduce((a,c) => a + c.qty, 0)}
             </span>
          )}
        </Button>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full max-w-sm mb-2 shrink-0 border border-slate-200 shadow-inner">
        <button 
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold tracking-wide transition-all ${activeTab === 'tyres' ? 'bg-white text-primary-600 shadow-md transform scale-100' : 'text-slate-500 hover:text-slate-800'}`}
          onClick={() => setActiveTab('tyres')}
        >
          Tyres
        </button>
        <button 
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold tracking-wide transition-all ${activeTab === 'services' ? 'bg-white text-primary-600 shadow-md transform scale-100' : 'text-slate-500 hover:text-slate-800'}`}
          onClick={() => setActiveTab('services')}
        >
          Services
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 bg-transparent pb-[60px] md:pb-0">
        {activeTab === 'tyres' && (
          <div className="grid md:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {catalog.tyres.map((item) => (
              <Card key={item.id} className={`p-6 flex flex-col shadow-lg border-2 rounded-[2rem] transition-all relative overflow-hidden group
                ${item.category === 'Good' ? 'border-slate-200 hover:border-slate-300' : 
                  item.category === 'Better' ? 'border-blue-200 hover:border-blue-300 bg-gradient-to-br from-blue-50/50 to-white' : 
                  'border-amber-200 hover:border-amber-300 bg-gradient-to-br from-amber-50/50 to-white'}`}>
                
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-current opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-500"></div>

                <div className="mb-6 z-10">
                  <span className={`inline-block px-3 py-1 text-xs font-black uppercase tracking-widest rounded-full mb-3 shadow-sm border
                    ${item.category === 'Good' ? 'bg-slate-100 text-slate-600 border-slate-200' : 
                      item.category === 'Better' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                      'bg-amber-100 text-amber-700 border-amber-200'}`}>
                    {item.category} Choice
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">{item.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                     <ShieldCheck className="text-emerald-500" size={16} /> 
                     <span className="text-sm font-bold text-slate-500">{item.warranty}</span>
                  </div>
                </div>

                <div className="mt-auto z-10">
                   <div className="flex flex-wrap gap-2 mb-6">
                      {item.tags.map(t => <span key={t} className="text-xs bg-white text-slate-600 border border-slate-200 px-2 py-1 rounded-md font-semibold flex items-center gap-1 shadow-sm"><Tag size={12}/>{t}</span>)}
                   </div>
                   
                   <div className="flex items-end justify-between border-t border-slate-100 pt-5">
                      <div>
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Price</span>
                         <span className="text-3xl font-black text-slate-900 tracking-tighter">₹{item.price}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-full border border-slate-200 shadow-sm">
                        <button 
                           onClick={() => updateCart(item, getQty(item.id) - 1)}
                           className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-slate-600 hover:bg-slate-200 shadow-sm transition-colors disabled:opacity-50"
                           disabled={getQty(item.id) === 0}
                        >
                          <Minus size={18} />
                        </button>
                        <span className="w-6 text-center font-black text-lg text-slate-800">{getQty(item.id)}</span>
                        <button 
                           onClick={() => updateCart(item, getQty(item.id) + 1)}
                           className="w-10 h-10 rounded-full flex items-center justify-center bg-primary-600 text-white hover:bg-primary-700 shadow-md transition-colors"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                   </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'services' && (
          <div className="grid md:grid-cols-2 gap-4 animate-in fade-in duration-300">
             {catalog.services.map((item) => (
               <Card key={item.id} className="p-5 flex justify-between items-center shadow-md border-slate-100 rounded-2xl bg-white hover:border-slate-300 transition-colors">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 tracking-tight">{item.name}</h3>
                    <p className="text-primary-700 font-extrabold text-xl mt-1 tracking-tighter">₹{item.price}</p>
                  </div>
                  <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <button 
                       onClick={() => updateCart(item, getQty(item.id) - 1)}
                       disabled={getQty(item.id) === 0}
                       className="p-2 text-slate-600 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Minus size={20} />
                    </button>
                    <span className="w-4 text-center font-bold text-lg">{getQty(item.id)}</span>
                    <button 
                       onClick={() => updateCart(item, getQty(item.id) + 1)}
                       className="p-2 text-primary-600 hover:bg-white rounded-lg transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
               </Card>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceSelection;
