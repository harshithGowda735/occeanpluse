import React, { useState, useEffect } from 'react';
import { Brain, AlertTriangle, TrendingUp, MapPin, ShieldAlert, Sparkles, RefreshCw, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';

interface RiskZone {
  lat: number;
  lng: number;
  severity: 'high' | 'medium' | 'low';
  reason: string;
}

interface Alert {
  title: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
}

interface PredictionData {
  predictedIncrease: number;
  riskZones: RiskZone[];
  alerts: Alert[];
}

export default function Predictions() {
  const [data, setData] = useState<PredictionData | null>(null);
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPredictions = async () => {
    // Only show full loading state if we have no data yet (first load)
    if (!data) {
      setLoading(true);
    }
    
    try {
      const [predRes, zonesRes] = await Promise.all([
        fetch('/api/predict'),
        fetch('/api/risk-zones')
      ]);
      const predResult = await predRes.json();
      const zonesResult = await zonesRes.json();
      
      setData(predResult);
      if (zonesResult.success) {
        setZones(zonesResult.zones);
      }
    } catch (error) {
      console.error("Failed to fetch predictions:", error);
    } finally {
      if (!data) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchPredictions();
    
    // Auto-refresh every 60 seconds for real-time live data feel
    const interval = setInterval(() => {
      fetchPredictions();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Brain className="text-blue-600" />
            AI Prediction Engine
          </h1>
          <p className="text-slate-500 mt-1">Advanced waste forecasting and high-risk zone identification.</p>
        </div>
        <button 
          onClick={fetchPredictions}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
        >
          <RefreshCw size={18} className={cn(loading && "animate-spin")} />
          Refresh Forecast
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Prediction Card */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 text-blue-600">
              <Sparkles size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-blue-600 mb-4">
                <TrendingUp size={20} />
                <span className="text-xs font-bold uppercase tracking-widest">24-Hour Forecast</span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl font-bold text-slate-900">
                  {loading ? "..." : `+${data?.predictedIncrease}%`}
                </span>
                <span className="text-slate-500 font-medium">Waste Increase Predicted</span>
              </div>
              <p className="text-slate-500 max-w-md leading-relaxed">
                Based on current bin fill rates and community reporting frequency, we expect a significant surge in waste generation over the next 24 hours.
              </p>
            </div>
          </div>

          {/* Risk Zone Map */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert size={20} className="text-red-500" />
                Live High-Risk Zones
              </h2>
              <div className="flex gap-3 text-xs font-medium">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> High</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Med</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Low</span>
              </div>
            </div>
            <div className="aspect-video relative z-0">
              <MapContainer center={[12.9716, 77.5946]} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {!loading && zones.map((zone, i) => (
                  <Circle
                    key={i}
                    center={[zone.lat, zone.lng]}
                    radius={1500}
                    pathOptions={{
                      fillColor: zone.risk === 'high' ? '#ef4444' : zone.risk === 'medium' ? '#f97316' : '#22c55e',
                      fillOpacity: 0.4,
                      stroke: false
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-[150px]">
                        <h4 className="font-bold text-slate-900 capitalize mb-2 border-b pb-1">{zone.name}</h4>
                        <div className="space-y-1 text-sm">
                          <p className="flex justify-between"><span className="text-slate-500">Risk:</span> <span className={cn("font-bold capitalize", zone.risk === 'high' ? 'text-red-600' : zone.risk === 'medium' ? 'text-orange-600' : 'text-green-600')}>{zone.risk}</span></p>
                          <p className="flex justify-between"><span className="text-slate-500">Score:</span> <span>{zone.score}/100</span></p>
                        </div>
                      </div>
                    </Popup>
                  </Circle>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="font-bold text-slate-900 flex items-center gap-2 px-2">
            <AlertTriangle size={20} className="text-amber-500" />
            Future Alerts
          </h2>
          
          <AnimatePresence mode="popLayout">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 animate-pulse">
                  <div className="h-4 w-2/3 bg-slate-100 rounded mb-3"></div>
                  <div className="h-3 w-full bg-slate-50 rounded mb-2"></div>
                  <div className="h-3 w-4/5 bg-slate-50 rounded"></div>
                </div>
              ))
            ) : (
              data?.alerts.map((alert, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "p-6 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all group cursor-pointer",
                    alert.severity === 'high' ? "border-l-4 border-l-red-500" : 
                    alert.severity === 'medium' ? "border-l-4 border-l-amber-500" : "border-l-4 border-l-blue-500"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-slate-900">{alert.title}</h4>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-600 transition-all" />
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">{alert.message}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                      alert.severity === 'high' ? "bg-red-50 text-red-600" : 
                      alert.severity === 'medium' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                    )}>
                      {alert.severity} Priority
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>

          <div className="bg-blue-600 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold mb-2">Smart Recommendation</h3>
              <p className="text-blue-100 text-sm leading-relaxed mb-6">
                Based on the predicted surge, we recommend increasing collection frequency in the South Marina district by 25%.
              </p>
              <button className="w-full py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all">
                Update Schedule
              </button>
            </div>
            <div className="absolute -bottom-4 -right-4 opacity-10">
              <Brain size={120} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
