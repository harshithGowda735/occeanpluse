import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Wind, 
  Waves, 
  Activity, 
  RefreshCw, 
  Clock, 
  ChevronRight,
  Bell,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { LoadingState, ErrorState } from '../components/Feedback';

interface Alert {
  id: string;
  type: string;
  severity: 'High' | 'Medium' | 'Low';
  message: string;
  timestamp: string;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/alerts');
      if (!response.ok) throw new Error("Failed to fetch alerts.");
      const data = await response.json();
      setAlerts(data);
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
      setError(error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const filteredAlerts = alerts.filter(a => filter === 'All' || a.severity === filter);

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'High': return 'bg-rose-50 border-rose-100 text-rose-700 icon-bg-rose-500';
      case 'Medium': return 'bg-amber-50 border-amber-100 text-amber-700 icon-bg-amber-500';
      default: return 'bg-blue-50 border-blue-100 text-blue-700 icon-bg-blue-500';
    }
  };

  const getIcon = (type: string) => {
    if (type.includes('Gas')) return <Wind size={18} />;
    if (type.includes('Algal')) return <Activity size={18} />;
    if (type.includes('Weather')) return <ShieldAlert size={18} />;
    return <AlertTriangle size={18} />;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Bell className="text-rose-500" />
            Alert Center
          </h1>
          <p className="text-slate-500 mt-1">Unified monitoring of critical environmental and operational events.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            {['All', 'High', 'Medium'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  filter === f ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <button 
            onClick={fetchAlerts}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw size={18} className={cn(loading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="popLayout">
            {loading && alerts.length === 0 ? (
              <LoadingState message="Scanning for active alerts..." className="min-h-[400px]" />
            ) : error ? (
              <ErrorState message={error} onRetry={fetchAlerts} className="min-h-[400px]" />
            ) : filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert, i) => {
                const styles = getSeverityStyles(alert.severity);
                const iconBg = styles.split(' ').find(s => s.startsWith('icon-bg-'))?.replace('icon-bg-', 'bg-');
                
                return (
                  <motion.div
                    key={alert.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "p-6 rounded-3xl border flex gap-6 items-start group hover:shadow-lg transition-all",
                      styles.split(' ').filter(s => !s.startsWith('icon-bg-')).join(' ')
                    )}
                  >
                    <div className={cn("p-3 rounded-2xl text-white shadow-lg", iconBg)}>
                      {getIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{alert.type}</span>
                          <span className="w-1 h-1 rounded-full bg-current opacity-30" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">{alert.severity} Severity</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold opacity-50 uppercase tracking-wider">
                          <Clock size={12} />
                          {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <h3 className="text-lg font-bold mb-2">{alert.message}</h3>
                      <div className="flex items-center gap-4 mt-4">
                        <button className="text-xs font-bold underline underline-offset-4 hover:opacity-70 transition-opacity">
                          View Details
                        </button>
                        <button className="text-xs font-bold underline underline-offset-4 hover:opacity-70 transition-opacity">
                          Acknowledge
                        </button>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight size={20} />
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={48} />
                <h3 className="font-bold text-slate-900 text-xl">System Clear</h3>
                <p className="text-slate-500 mt-2">No active alerts found for the selected criteria.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          {/* Alert Stats */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Activity size={20} className="text-blue-600" />
              Alert Summary
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Active High Priority</span>
                <span className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-sm">
                  {alerts.filter(a => a.severity === 'High').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Active Medium Priority</span>
                <span className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
                  {alerts.filter(a => a.severity === 'Medium').length}
                </span>
              </div>
              <div className="w-full h-px bg-slate-100" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Total Active</span>
                <span className="font-bold text-slate-900">{alerts.length}</span>
              </div>
            </div>
          </div>

          {/* Protocol Card */}
          <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
              <ShieldAlert size={80} />
            </div>
            <div className="relative z-10">
              <h3 className="font-bold text-xl mb-2">Emergency Protocols</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                In case of High Severity alerts, automated containment systems are activated and local authorities are notified.
              </p>
              <button className="w-full py-3 bg-white text-slate-900 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all">
                Review Protocols
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
