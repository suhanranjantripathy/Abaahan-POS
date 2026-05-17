import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import { Button, Input, Card } from '../components/ui';
import { Car, Fuel, Calendar, Gauge } from 'lucide-react';

const VehicleDetails = () => {
  const { addVehicle, currentCustomer } = useApp();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear().toString(),
    fuelType: 'Petrol',
    odometer: ''
  });

  const fuelOptions = ['Petrol', 'Diesel', 'CNG', 'EV', 'Hybrid'];
  const brandOptions = [
    'Maruti Suzuki', 'Hyundai', 'Tata Motors', 'Mahindra', 'Kia',
    'Toyota', 'Honda', 'Skoda', 'Volkswagen', 'MG Motor',
    'Renault', 'Nissan', 'Jeep', 'Ford', 'Other'
  ];

  const modelsByBrand = {
    'Maruti Suzuki': ['Swift', 'Baleno', 'Brezza', 'Wagon R', 'Dzire', 'Ertiga', 'Alto', 'Grand Vitara', 'Fronx', 'Ignis', 'Celerio', 'XL6'],
    'Hyundai': ['Creta', 'Venue', 'i20', 'Grand i10 Nios', 'Verna', 'Exter', 'Alcazar', 'Tucson', 'Aura'],
    'Tata Motors': ['Nexon', 'Punch', 'Altroz', 'Tiago', 'Harrier', 'Safari', 'Tigor', 'Curvv'],
    'Mahindra': ['Scorpio-N', 'XUV700', 'Thar', 'Bolero', 'XUV300', 'XUV 3XO', 'Scorpio Classic'],
    'Kia': ['Seltos', 'Sonet', 'Carens', 'EV6'],
    'Toyota': ['Innova Crysta', 'Fortuner', 'Glanza', 'Urban Cruiser Hyryder', 'Innova Hycross', 'Camry', 'Rumion'],
    'Honda': ['City', 'Amaze', 'Elevate'],
    'Skoda': ['Slavia', 'Kushaq', 'Superb', 'Octavia', 'Kodiaq'],
    'Volkswagen': ['Virtus', 'Taigun', 'Tiguan'],
    'MG Motor': ['Hector', 'Astor', 'Gloster', 'Comet EV', 'ZSEV', 'Windsor EV'],
    'Renault': ['Kwid', 'Kiger', 'Triber'],
    'Nissan': ['Magnite', 'X-Trail'],
    'Jeep': ['Compass', 'Meridian', 'Wrangler'],
    'Ford': ['EcoSport', 'Endeavour', 'Figo', 'Aspire', 'Freestyle'],
    'Other': ['Other Model']
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!vehicle.make || !vehicle.model) return;
    
    addVehicle(vehicle);
    navigate('/inspection');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 shadow-sm">
          <Car size={24} />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Add Vehicle</h2>
          <p className="text-slate-500 font-medium mt-1">For {currentCustomer?.name || 'Customer'}</p>
        </div>
      </div>

      <Card className="p-6 md:p-8 shadow-xl border-slate-100 rounded-[2rem]">
        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1">Make Brand</label>
              <div className="relative">
                 <select 
                    className="flex h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm font-medium"
                    value={vehicle.make}
                    onChange={(e) => setVehicle({...vehicle, make: e.target.value, model: ''})}
                    required
                 >
                   <option value="" disabled>Select Brand</option>
                   {brandOptions.map(b => <option key={b} value={b}>{b}</option>)}
                 </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1">Model</label>
              <div className="relative">
                 <select 
                    className={`flex h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 transition-all shadow-sm font-medium ${!vehicle.make ? 'opacity-70' : ''}`}
                    value={vehicle.model}
                    onChange={(e) => setVehicle({...vehicle, model: e.target.value})}
                    required
                    disabled={!vehicle.make}
                 >
                   <option value="" disabled>{!vehicle.make ? "Select Brand First" : "Select Model"}</option>
                   {vehicle.make && modelsByBrand[vehicle.make]?.map(m => (
                     <option key={m} value={m}>{m}</option>
                   ))}
                 </select>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-semibold text-slate-700 block gap-1 mb-1">
                <span>Model Year</span>
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="1990"
                  max={new Date().getFullYear()}
                  value={vehicle.year}
                  onChange={(e) => setVehicle({...vehicle, year: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1">Fuel Type</label>
              <div className="relative">
                 <select 
                    className="flex h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm font-medium"
                    value={vehicle.fuelType}
                    onChange={(e) => setVehicle({...vehicle, fuelType: e.target.value})}
                 >
                   {fuelOptions.map(f => <option key={f} value={f}>{f}</option>)}
                 </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1">Odometer (km)</label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="e.g. 45000"
                  value={vehicle.odometer}
                  onChange={(e) => setVehicle({...vehicle, odometer: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 mt-2 p-4 rounded-xl flex items-center gap-3">
             <Gauge className="text-slate-400 shrink-0" />
             <p className="text-sm text-slate-600 font-medium">Entering accurate odometer reading helps in generating predictive maintenance reminders for the customer.</p>
          </div>

          <Button type="submit" size="lg" className="w-full">
            Save & Start Inspection
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default VehicleDetails;
