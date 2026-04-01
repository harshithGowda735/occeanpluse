import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Trash2, 
  Users, 
  Waves, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity,
  Calendar,
  Download,
  Cloud,
  Thermometer,
  Droplets,
  AlertCircle,
  Map as MapIcon,
  RefreshCw
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { LoadingState, ErrorState } from '../components/Feedback';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardData {
  summary: {
    totalWaste: string;
    recyclingRate: string;
    activeGuardians: string;
    pollutionHotspots: string;
  };
  weeklyData: Array<{ name: string; waste: number; recycled: number }>;
  composition: Array<{ name: string; value: number }>;
}

interface EnvData {
  weather: {
    temp: number;
    humidity: number;
    condition: string;
  };
  ocean: {
    surfaceTemp: string;
    waveHeight: string;
  };
}

interface Alert {
  id: string;
  type: string;
  severity: string;
  message: string;
}

interface Report {
  id: string;
  lat: number;
  lng: number;
  wasteType: string;
  severity: string;
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [envData, setEnvData] = useState<EnvData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, envRes, alertRes, reportRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/environment'),
        fetch('/api/alerts'),
        fetch('/api/reports')
      ]);

      if (!dashRes.ok || !envRes.ok || !alertRes.ok || !reportRes.ok) {
        throw new Error("Failed to fetch dashboard data. Please check your connection.");
      }

      const [dash, env, alrt, rpt] = await Promise.all([
        dashRes.json(),
        envRes.json(),
        alertRes.json(),
        reportRes.json()
      ]);

      setDashboardData(dash);
      setEnvData(env);
      setAlerts(alrt);
      setReports(rpt);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setError(error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !dashboardData) {
    return <LoadingState message="Initializing dashboard..." className="h-screen" />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen p-8">
        <ErrorState message={error} onRetry={fetchData} />
      </div>
    );
  }

  const lineData = {
    labels: dashboardData?.weeklyData.map(d => d.name) || [],
    datasets: [
      {
        label: 'Waste Collected',
        data: dashboardData?.weeklyData.map(d => d.waste) || [],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Recycled',
        data: dashboardData?.weeklyData.map(d => d.recycled) || [],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  };

  const doughnutData = {
    labels: dashboardData?.composition.map(c => c.name) || [],
    datasets: [{
      data: dashboardData?.composition.map(c => c.value) || [],
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#6366F1'],
      borderWidth: 0,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#1e293b',
        bodyColor: '#64748b',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { weight: 'bold' as const } } },
      y: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { weight: 'bold' as const } } }
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Command Center</h1>
          <p className="text-slate-500 mt-1">Unified planetary health and waste management oversight.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <RefreshCw size={18} className={cn(loading && "animate-spin")} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Calendar size={16} />
            Real-time
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Waste', value: dashboardData?.summary.totalWaste, trend: '+12.5%', up: true, icon: Trash2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Recycling Rate', value: dashboardData?.summary.recyclingRate, trend: '+4.2%', up: true, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Active Guardians', value: dashboardData?.summary.activeGuardians, trend: '+18%', up: true, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Hotspots', value: dashboardData?.summary.pollutionHotspots, trend: 'Active', up: true, icon: Waves, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group hover:border-blue-200 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg, stat.color)}>
                <stat.icon size={24} />
              </div>
              <div className={cn(
                "text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider",
                stat.up ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}>
                {stat.trend}
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Activity size={20} className="text-blue-600" />
                Waste & Recycling Trends
              </h3>
              <p className="text-xs text-slate-400 mt-1">Weekly collection performance metrics.</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <Line data={lineData} options={chartOptions} />
          </div>
        </div>

        {/* Weather & Ocean Quick View */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
              <Cloud size={80} />
            </div>
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Cloud className="text-blue-500" size={20} />
              Environment
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Air Temp</p>
                <div className="flex items-center gap-2">
                  <Thermometer size={16} className="text-rose-500" />
                  <span className="text-xl font-bold text-slate-900">{envData?.weather.temp}°C</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Humidity</p>
                <div className="flex items-center gap-2">
                  <Droplets size={16} className="text-blue-500" />
                  <span className="text-xl font-bold text-slate-900">{envData?.weather.humidity}%</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sea Temp</p>
                <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
                  {envData?.ocean.surfaceTemp}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waves</p>
                <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
                  {envData?.ocean.waveHeight}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-3xl text-white relative overflow-hidden">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <AlertCircle size={20} className="text-rose-500" />
              Active Alerts
            </h3>
            <div className="space-y-4">
              {alerts.slice(0, 2).map(alert => (
                <div key={alert.id} className="p-3 bg-white/10 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400">{alert.severity}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{alert.type}</span>
                  </div>
                  <p className="text-xs font-medium leading-relaxed">{alert.message}</p>
                </div>
              ))}
              {alerts.length === 0 && (
                <p className="text-xs text-slate-500 italic">No critical alerts detected.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Heatmap Section */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <MapIcon size={20} className="text-emerald-600" />
                Waste Concentration Heatmap
              </h3>
              <p className="text-xs text-slate-400 mt-1">Real-time crowd-sourced pollution density.</p>
            </div>
          </div>
          <div className="h-[400px] rounded-2xl overflow-hidden border border-slate-100">
            <MapContainer center={[12.9716, 77.5946]} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {reports.map((report) => (
                <CircleMarker 
                  key={report.id}
                  center={[report.lat, report.lng]}
                  radius={report.severity === 'High' ? 20 : 12}
                  pathOptions={{ 
                    fillColor: report.severity === 'High' ? '#ef4444' : '#f59e0b',
                    color: 'transparent',
                    fillOpacity: 0.4
                  }}
                >
                  <Popup>
                    <div className="p-2">
                      <p className="font-bold text-slate-900">{report.wasteType}</p>
                      <p className="text-xs text-slate-500">Severity: {report.severity}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Composition Chart */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-8 flex items-center gap-2">
            <Activity size={20} className="text-indigo-600" />
            Waste Composition
          </h3>
          <div className="h-[250px] w-full relative">
            <Doughnut data={doughnutData} options={{ ...chartOptions, cutout: '70%' }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-slate-900">4</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categories</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-8">
            {dashboardData?.composition.map((type, i) => (
              <div key={type.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#6366F1'][i] }}></div>
                <span className="text-xs font-bold text-slate-600">{type.name}</span>
                <span className="text-xs font-bold text-slate-400 ml-auto">{type.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
