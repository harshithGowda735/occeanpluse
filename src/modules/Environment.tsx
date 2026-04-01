import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Wind, 
  Thermometer, 
  Droplets, 
  Waves, 
  Activity, 
  AlertCircle, 
  Sun, 
  TrendingUp, 
  TrendingDown,
  Globe,
  Zap,
  RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface EnvData {
  weather: {
    temp: number;
    humidity: number;
    windSpeed: number;
    condition: string;
    uvIndex: number;
  };
  ocean: {
    seaLevel: string;
    surfaceTemp: string;
    waveHeight: string;
    salinity: string;
  };
  chlorophyll: {
    concentration: string;
    trend: string;
    status: string;
  };
  methane: {
    concentration: string;
    anomaly: string;
    status: string;
  };
  alerts: Array<{
    id: number;
    type: string;
    severity: string;
    message: string;
  }>;
}

export default function Environment() {
  const [data, setData] = useState<EnvData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEnvData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/environment');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch environmental data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvData();
    const interval = setInterval(fetchEnvData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (!data && loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Globe className="text-emerald-600" />
            Environmental Intelligence
          </h1>
          <p className="text-slate-500 mt-1">Real-time planetary health metrics and atmospheric monitoring.</p>
        </div>
        <button 
          onClick={fetchEnvData}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
        >
          <RefreshCw size={16} className={cn(loading && "animate-spin")} />
          Sync Satellite Data
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Weather Card */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
            <Cloud size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <Sun className="text-amber-500" />
                Atmospheric State
              </h2>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                {data.weather.condition}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Temperature</p>
                <div className="flex items-center gap-2">
                  <Thermometer size={18} className="text-rose-500" />
                  <span className="text-2xl font-bold text-slate-900">{data.weather.temp}°C</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Humidity</p>
                <div className="flex items-center gap-2">
                  <Droplets size={18} className="text-blue-500" />
                  <span className="text-2xl font-bold text-slate-900">{data.weather.humidity}%</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wind Speed</p>
                <div className="flex items-center gap-2">
                  <Wind size={18} className="text-slate-500" />
                  <span className="text-2xl font-bold text-slate-900">{data.weather.windSpeed} km/h</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">UV Index</p>
                <div className="flex items-center gap-2">
                  <Zap size={18} className="text-amber-500" />
                  <span className="text-2xl font-bold text-slate-900">{data.weather.uvIndex}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ocean State Card */}
        <div className="lg:col-span-2 bg-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <Waves size={120} />
          </div>
          <div className="relative z-10">
            <h2 className="font-bold mb-8 flex items-center gap-2">
              <Waves className="text-blue-400" />
              Oceanic State
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sea Level</p>
                <p className="text-2xl font-bold">{data.ocean.seaLevel}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Surface Temp</p>
                <p className="text-2xl font-bold">{data.ocean.surfaceTemp}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Wave Height</p>
                <p className="text-2xl font-bold">{data.ocean.waveHeight}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Salinity</p>
                <p className="text-2xl font-bold">{data.ocean.salinity}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chlorophyll Card */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm group">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Activity size={24} />
            </div>
            {data.chlorophyll.trend === 'increasing' ? (
              <TrendingUp className="text-emerald-500" size={20} />
            ) : (
              <TrendingDown className="text-rose-500" size={20} />
            )}
          </div>
          <h3 className="font-bold text-slate-900 mb-1">Chlorophyll-a</h3>
          <p className="text-xs text-slate-500 mb-4">Phytoplankton concentration</p>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-slate-900">{data.chlorophyll.concentration}</p>
            <p className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              data.chlorophyll.status === 'Normal' ? "text-emerald-600" : "text-amber-600"
            )}>Status: {data.chlorophyll.status}</p>
          </div>
        </div>

        {/* Methane Card */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm group">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Globe size={24} />
            </div>
            <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-lg">
              {data.methane.anomaly}
            </span>
          </div>
          <h3 className="font-bold text-slate-900 mb-1">Methane (CH₄)</h3>
          <p className="text-xs text-slate-500 mb-4">Atmospheric concentration</p>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-slate-900">{data.methane.concentration}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Status: {data.methane.status}
            </p>
          </div>
        </div>

        {/* Alerts Feed */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
            <AlertCircle size={20} className="text-rose-500" />
            Environmental Alerts
          </h3>
          <div className="space-y-4">
            {data.alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={cn(
                  "p-4 rounded-2xl border flex gap-4 items-start transition-all hover:scale-[1.02]",
                  alert.severity === 'High' ? "bg-rose-50 border-rose-100" : 
                  alert.severity === 'Medium' ? "bg-amber-50 border-amber-100" : 
                  "bg-blue-50 border-blue-100"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl",
                  alert.severity === 'High' ? "bg-rose-500 text-white" : 
                  alert.severity === 'Medium' ? "bg-amber-500 text-white" : 
                  "bg-blue-500 text-white"
                )}>
                  <AlertCircle size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{alert.type}</span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest",
                      alert.severity === 'High' ? "text-rose-600" : 
                      alert.severity === 'Medium' ? "text-amber-600" : 
                      "text-blue-600"
                    )}>{alert.severity} Priority</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 leading-relaxed">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
