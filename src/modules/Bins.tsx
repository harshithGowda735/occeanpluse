import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, MapPin, Battery, Signal, AlertTriangle, CheckCircle2, RefreshCw, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface Bin {
  id: string;
  location: string;
  fillLevel: number;
  wasteType: string;
  battery: number;
  status: string;
  lastUpdated: number;
}

export default function Bins() {
  const [bins, setBins] = useState<Bin[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  // Registration Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBin, setNewBin] = useState({ id: '', location: '', wasteType: 'mixed' });

  // 1. Listen to Firestore for real-time updates
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'bins'), (snapshot) => {
      const binsData: Bin[] = [];
      snapshot.forEach((doc) => {
        binsData.push(doc.data() as Bin);
      });
      if (binsData.length > 0) {
        setBins(binsData.sort((a, b) => a.id.localeCompare(b.id)));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchBins = useCallback(async () => {
    try {
      setSyncing(true);
      const response = await fetch('/api/bins');
      if (!response.ok) throw new Error('Failed to fetch bins');
      const data: Bin[] = await response.json();
      
      // Sync API data to Firestore to keep them in sync
      const promises = data.map(bin => 
        setDoc(doc(db, 'bins', bin.id), bin, { merge: true })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error("Failed to fetch bins:", error);
    } finally {
      setSyncing(false);
    }
  }, []);

  // Periodic sync from server simulation to Firestore
  useEffect(() => {
    fetchBins();
    const interval = setInterval(fetchBins, 15000);
    return () => clearInterval(interval);
  }, [fetchBins]);

  const handleManualUpdate = async (id: string) => {
    try {
      const bin = bins.find(b => b.id === id);
      if (!bin) return;

      const newFill = Math.min(100, bin.fillLevel + 10);
      const newStatus = newFill >= 90 ? "full" : (newFill >= 75 ? "critical" : "active");

      const response = await fetch('/api/bins/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, fillLevel: newFill, status: newStatus })
      });

      if (response.ok) {
        const { bin: updatedBin } = await response.json();
        // Optimistically update local state
        setBins(prev => prev.map(b => b.id === id ? { ...b, ...updatedBin } : b));
      }
    } catch (error) {
      console.error("Manual update failed:", error);
    }
  };

  const handleDeleteBin = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete ${id}? This action cannot be undone.`)) return;
    
    try {
      setSyncing(true);
      // 1. Delete from Express API memory
      const response = await fetch(`/api/bins/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete from server');
      
      // 2. Delete from Firestore mirror
      await deleteDoc(doc(db, 'bins', id));
      
      // 3. Update local UI (since the snapshot listener is active, it handles UI, but we can optimistically filter)
      setBins(prev => prev.filter(b => b.id !== id));
      
    } catch (error) {
      console.error("Bin deletion failed:", error);
      alert("Failed to delete the bin. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const handleRegisterBin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBin.id || !newBin.location) return;

    try {
      setIsSubmitting(true);
      // 1. Post to Express API memory
      const response = await fetch('/api/bins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBin)
      });
      
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to register bin');
      
      // 2. Mirror newly created bin to Firestore
      await setDoc(doc(db, 'bins', payload.bin.id), payload.bin);
      
      // Reset form on success
      setIsAddModalOpen(false);
      setNewBin({ id: '', location: '', wasteType: 'mixed' });
      // UI updates automatically from onSnapshot or next poll, but we can push immediately
      setBins(prev => [...prev, payload.bin].sort((a, b) => a.id.localeCompare(b.id)));
      
    } catch (error: any) {
      console.error("Bin registration failed:", error);
      alert(error.message || "Failed to register the bin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'full': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'critical': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'maintenance': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const fullBins = bins.filter(b => b.fillLevel >= 90).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Smart IoT Bins</h1>
            {syncing && <RefreshCw size={18} className="text-blue-500 animate-spin" />}
          </div>
          <p className="text-slate-500 mt-1">Real-time monitoring of waste levels and sensor health.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all shadow-sm">
            <RefreshCw size={18} />
            Force Sync
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
          >
            <Plus size={18} />
            Register Bin
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Initializing real-time stream...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {bins.map((bin) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={bin.id} 
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between group gap-6"
                >
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => handleDeleteBin(bin.id)}
                      className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden",
                        bin.fillLevel > 90 ? "bg-rose-50 text-rose-600 scale-110 hover:bg-rose-600 hover:text-white" : "bg-slate-50 text-slate-600 hover:bg-rose-500 hover:text-white group-hover:bg-rose-50 group-hover:text-rose-600 hover:shadow-lg hover:shadow-rose-200"
                      )}
                      title="Click to Delete Bin"
                    >
                      <Trash2 size={24} className="hover:scale-110 transition-transform" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900">{bin.id}</h3>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                          getStatusColor(bin.status)
                        )}>
                          {bin.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                        <MapPin size={14} />
                        {bin.location}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold uppercase">
                          {bin.wasteType}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 sm:gap-12 w-full sm:w-auto">
                    <div className="flex-1 sm:flex-none w-full sm:w-auto">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Fill Level</p>
                        <span className="text-sm font-bold text-slate-900">{bin.fillLevel}%</span>
                      </div>
                      <div className="w-full sm:w-32 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${bin.fillLevel}%` }}
                          className={cn(
                            "h-full transition-colors duration-500", 
                            bin.fillLevel > 90 ? "bg-rose-500" : bin.fillLevel > 70 ? "bg-amber-500" : "bg-blue-500"
                          )}
                        ></motion.div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-start">
                      <div className="flex flex-col items-center gap-1">
                        <Battery size={18} className={bin.battery < 20 ? "text-rose-500" : "text-slate-400"} />
                        <span className="text-[10px] font-bold text-slate-500">{bin.battery}%</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Signal size={18} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500">Strong</span>
                      </div>
                      <button 
                        onClick={() => handleManualUpdate(bin.id)}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                        title="Simulate Fill"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-fit">
              <h2 className="text-xl font-bold text-slate-900 mb-6">System Health</h2>
              <div className="space-y-6">
                <div className="p-4 bg-emerald-50 rounded-2xl flex items-center gap-4 border border-emerald-100">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-900">All Sensors Online</p>
                    <p className="text-xs text-emerald-600">98.2% uptime this month</p>
                  </div>
                </div>

                {fullBins > 0 && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-4 bg-rose-50 rounded-2xl flex items-center gap-4 border border-rose-100"
                  >
                    <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-rose-900">{fullBins} Bins Need Emptying</p>
                      <p className="text-xs text-rose-600">Priority: High</p>
                    </div>
                  </motion.div>
                )}

                <div className="pt-4">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Maintenance Logs</h3>
                  <div className="space-y-4">
                    {[
                      { action: 'Battery Replaced', bin: 'BIN-042', time: '2 hours ago' },
                      { action: 'Sensor Calibrated', bin: 'BIN-009', time: '5 hours ago' },
                      { action: 'Firmware Updated', bin: 'All Bins', time: '1 day ago' },
                    ].map((log, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-1 h-8 bg-slate-100 rounded-full"></div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{log.action} - {log.bin}</p>
                          <p className="text-[10px] text-slate-500">{log.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-600 p-8 rounded-3xl text-white shadow-xl shadow-blue-200">
              <h3 className="font-bold text-lg mb-2">Optimization Tip</h3>
              <p className="text-blue-100 text-sm leading-relaxed">
                Based on current fill rates, routing for North Beach should be prioritized in the next 2 hours to prevent overflow.
              </p>
              <button className="mt-6 w-full py-3 bg-white text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors">
                Optimize Routes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Bin Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
          >
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Plus size={24} className="text-blue-600" />
                Register New Bin
              </h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleRegisterBin} className="p-8 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Unique Bin ID</label>
                <input 
                  type="text" 
                  value={newBin.id}
                  onChange={(e) => setNewBin({...newBin, id: e.target.value.toUpperCase()})}
                  placeholder="e.g. BIN-015"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Deploy Location</label>
                <input 
                  type="text" 
                  value={newBin.location}
                  onChange={(e) => setNewBin({...newBin, location: e.target.value})}
                  placeholder="e.g. MG Road, Bengaluru"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Primary Waste Category</label>
                <select 
                  value={newBin.wasteType}
                  onChange={(e) => setNewBin({...newBin, wasteType: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
                >
                  <option value="organic">Organic</option>
                  <option value="plastic">Plastic</option>
                  <option value="paper">Paper</option>
                  <option value="glass">Glass</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <RefreshCw className="animate-spin" size={20} /> : "Provision Bin"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
