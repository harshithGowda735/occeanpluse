import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Fuel, CheckCircle2, RefreshCw, Truck, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { MapContainer, TileLayer, Circle, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { renderToString } from 'react-dom/server';

interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  location?: string;
}

interface RouteData {
  route: Waypoint[];
  totalDistance: number;
  binsCount: number;
  timestamp: number;
  message?: string;
}

interface TruckObj {
  id: string;
  status: string;
  battery: number;
  assignedRoute: Waypoint[] | null;
}

// Create a custom icon for the moving truck using Leaflet's divIcon
const createTruckIcon = () => {
  const iconHtml = renderToString(
    <div className="bg-blue-600 text-white p-2 rounded-xl shadow-lg border-2 border-white shadow-blue-500/50 relative">
      <Truck size={20} />
      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
    </div>
  );
  return L.divIcon({ html: iconHtml, className: '', iconSize: [36, 36], iconAnchor: [18, 18] });
};

function useTruckGPS(route: Waypoint[] | null) {
  const [position, setPosition] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (!route || route.length < 2) {
      setPosition(null);
      return;
    }
    
    let currentSegmentIndex = 0;
    let progress = 0; 
    const speed = 0.05; // Speed multiplier
    
    setPosition({ lat: route[0].lat, lng: route[0].lng });

    const interval = setInterval(() => {
      progress += speed;

      if (progress >= 1) {
        progress = 0;
        currentSegmentIndex++;
        if (currentSegmentIndex >= route.length - 1) {
           currentSegmentIndex = 0;
        }
      }
      
      const p1 = route[currentSegmentIndex];
      const p2 = route[currentSegmentIndex + 1];
      
      if (p1 && p2) {
        const currentLat = p1.lat + (p2.lat - p1.lat) * progress;
        const currentLng = p1.lng + (p2.lng - p1.lng) * progress;
        setPosition({ lat: currentLat, lng: currentLng });
      }
    }, 100); 

    return () => clearInterval(interval);
  }, [route]);

  return position;
}

function MovingTruck({ truck, icon }: { truck: TruckObj, icon: L.DivIcon, key?: string }) {
  const pos = useTruckGPS(truck.assignedRoute);
  if (!pos) return null;
  return (
    <Marker position={[pos.lat, pos.lng]} icon={icon}>
      <Popup>
        <div className="font-bold">{truck.id}</div>
        <div className="text-xs">Status: {truck.status}</div>
        <div className="text-xs text-blue-500">Mission: Dijkstra Optimized</div>
      </Popup>
    </Marker>
  );
}

export default function Routing() {
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [allBins, setAllBins] = useState<any[]>([]);
  const [trucks, setTrucks] = useState<TruckObj[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [truckIcon, setTruckIcon] = useState<L.DivIcon | null>(null);

  // Modals
  const [isAddTruckOpen, setIsAddTruckOpen] = useState(false);
  const [newTruckId, setNewTruckId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    setTruckIcon(createTruckIcon());
  }, []);

  // Removed old single truckPos hook as we'll map components
  // const truckPos = useTruckGPS(routeData?.route || []);

  const fetchRouteAndBins = async () => {
    try {
      setOptimizing(true);
      const [routeRes, binsRes, trucksRes] = await Promise.all([
        fetch('/api/routes'),
        fetch('/api/bins'),
        fetch('/api/trucks')
      ]);
      const rData = await routeRes.json();
      const bData = await binsRes.json();
      const tData = await trucksRes.json();
      
      setRouteData(rData);
      setAllBins(bData);
      setTrucks(tData);
    } catch (error) {
      console.error("Failed to fetch route/bins/trucks:", error);
    } finally {
      setLoading(false);
      setOptimizing(false);
    }
  };

  const handleRegisterTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTruckId) return;
    try {
      const res = await fetch('/api/trucks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newTruckId.toUpperCase() })
      });
      if (res.ok) {
        setIsAddTruckOpen(false);
        setNewTruckId('');
        fetchRouteAndBins();
      }
    } catch (err) { console.error(err); }
  };

  const handleAssignRoute = async (truckId: string) => {
    if (!routeData) return;
    try {
      setIsAssigning(true);
      const res = await fetch('/api/assign-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ truckId, route: routeData.route })
      });
      if (res.ok) fetchRouteAndBins();
    } catch (err) { console.error(err); }
    finally { setIsAssigning(false); }
  };

  useEffect(() => {
    fetchRouteAndBins();
    const interval = setInterval(fetchRouteAndBins, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AI Collection Routing</h1>
          <p className="text-slate-500 mt-1">Real-time Dijkstra tracking and automated fuel optimization paths.</p>
        </div>
        <button 
          onClick={fetchRouteAndBins}
          disabled={optimizing}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
        >
          {optimizing ? <RefreshCw size={20} className="animate-spin" /> : <Navigation size={20} />}
          Force Re-Optimization
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-100 rounded-3xl h-[450px] relative overflow-hidden group border border-slate-200 shadow-sm z-0">
            {/* Real React-Leaflet GPS Map */}
            {typeof window !== 'undefined' && !loading && (
              <MapContainer center={[12.9716, 77.5946]} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                />
                
                {/* Plot all network IoT Bins */}
                {allBins.map(bin => (
                    <Circle
                      key={`bg-${bin.id}`}
                      center={[bin.lat, bin.lng]}
                      radius={300}
                      pathOptions={{
                        fillColor: bin.fillLevel > 70 ? '#ef4444' : '#94a3b8',
                        color: bin.fillLevel > 70 ? '#ef4444' : '#cbd5e1',
                        weight: 2,
                        fillOpacity: 0.8
                      }}
                    >
                      <Popup autoPan={false}>
                        <div className="p-2">
                          <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", bin.fillLevel > 70 ? "bg-red-500 animate-pulse" : "bg-slate-400")} />
                            {bin.id}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">Location: {bin.location}</div>
                          <div className="text-xs font-bold text-slate-900">Current Fill: {bin.fillLevel}%</div>
                        </div>
                      </Popup>
                    </Circle>
                ))}

                {/* Plot Dijkstra Polyline Route */}
                {routeData?.route && (
                  <Polyline 
                    positions={routeData.route.map(r => [r.lat, r.lng])} 
                    pathOptions={{ color: '#2563eb', weight: 4, dashArray: "10, 10", opacity: 0.8 }} 
                  />
                )}

                {/* Animated Live GPS Trucks (all assigned) */}
                {!loading && truckIcon && trucks.map(truck => (
                  <MovingTruck key={truck.id} truck={truck} icon={truckIcon} />
                ))}
              </MapContainer>
            )}

            <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between z-10 pointer-events-none">
              <div className="flex items-center gap-4 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800 pointer-events-auto">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <Truck size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Fleet Operational Status</p>
                  <p className="text-lg font-bold text-white">{trucks.filter(t => t.status === 'En-Route').length} Trucks Active</p>
                </div>
              </div>
              <div className="flex gap-4 pointer-events-auto">
                <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 px-4 py-3 rounded-xl text-white text-sm font-bold flex items-center gap-2">
                  <Fuel size={16} className="text-emerald-400" />
                  {routeData?.totalDistance || 0} km Route
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Calculated Path Sequence</h2>
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-bottom border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Seq</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Waypoint</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Action Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {routeData?.route && routeData.route.map((waypoint, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="w-6 h-6 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold">
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 block">{waypoint.id}</span>
                        <span className="text-xs text-slate-500">{waypoint.location || 'Central Depot'}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {waypoint.id === 'Depot' ? (index === 0 ? 'Origin Departed' : 'Terminus Arrival') : 'Dijkstra Sequence - Stop & Collect'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6">AI Dispatcher</h2>
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-sm font-bold text-blue-900 mb-1">Dijkstra Active</p>
                <p className="text-xs text-blue-600 leading-relaxed">
                  The current path dynamically adapts utilizing Haversine weights to sequence high-risk IoT nodes optimally.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center">
                      <MapPin size={20} />
                    </div>
                    <span className="text-sm font-medium text-slate-600">Actionable Stops</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900">{routeData?.binsCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center">
                      <Clock size={20} />
                    </div>
                    <span className="text-sm font-medium text-slate-600">Route Time Estimate</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900">{Math.round((routeData?.totalDistance || 0) * 2.4)} min</span>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900">Live Fleet Command</h3>
                  <button 
                    onClick={() => setIsAddTruckOpen(true)}
                    className="p-1 hover:bg-slate-100 text-blue-600 rounded-md transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                  <AnimatePresence mode="popLayout">
                    {trucks.map((truck) => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={truck.id} 
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all shadow-sm"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <Truck size={14} className={truck.status === 'En-Route' ? 'text-blue-500 animate-pulse' : 'text-slate-400'} />
                            <span className="text-sm font-bold text-slate-900">{truck.id}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">{truck.status} • {truck.battery}% Batt</p>
                        </div>
                        {truck.status === 'Standby' && routeData && routeData.binsCount > 0 ? (
                          <button 
                            onClick={() => handleAssignRoute(truck.id)}
                            disabled={isAssigning}
                            className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 transition-all shadow-sm"
                          >
                            Dispatch
                          </button>
                        ) : (
                          <span className={cn(
                            "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase",
                            truck.status === 'En-Route' ? "bg-emerald-50 text-emerald-600" : 
                            truck.status === 'Charging' ? "bg-amber-50 text-amber-600" :
                            "bg-slate-100 text-slate-500"
                          )}>
                            {truck.status === 'En-Route' ? 'Active' : truck.status}
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-emerald-600 p-8 rounded-3xl text-white shadow-xl shadow-emerald-200">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="font-bold text-lg mb-2">Impact Report</h3>
            <p className="text-emerald-100 text-sm leading-relaxed">
              AI Dijkstra routing has reduced carbon emissions by 18.4% this week by minimizing backtracking.
            </p>
          </div>
        </div>
      </div>

      {/* Register Truck Modal */}
      {isAddTruckOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Provision Vehicle</h2>
              <button 
                onClick={() => setIsAddTruckOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleRegisterTruck} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Truck Identifier</label>
                <input 
                  type="text" 
                  value={newTruckId}
                  onChange={(e) => setNewTruckId(e.target.value)}
                  placeholder="e.g. TRUCK-05"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                  required
                />
              </div>
              <button 
                type="submit"
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
              >
                Add to Fleet
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Add Plus to imports
const Plus = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
