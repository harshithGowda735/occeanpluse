import React, { useState, useEffect } from 'react';
import { ShieldCheck, Link as LinkIcon, Database, ExternalLink, CheckCircle2, History, Plus, RefreshCw, Box, User, Trash2, Factory } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Transaction {
  id: string;
  user: string;
  binId: string;
  wasteType: string;
  weight: number;
  status: string;
  timestamp: number;
  verified: boolean;
}

export default function Blockchain() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/blockchain/transactions');
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Failed to fetch blockchain transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAddWaste = async () => {
    try {
      setAdding(true);
      const response = await fetch('/api/blockchain/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
          binId: `BIN-00${Math.floor(Math.random() * 5) + 1}`,
          wasteType: ['plastic', 'organic', 'paper', 'metal'][Math.floor(Math.random() * 4)],
          weight: Math.floor(Math.random() * 2000) + 100
        })
      });
      
      if (response.ok) {
        await fetchTransactions();
      }
    } catch (error) {
      console.error("Failed to add waste to blockchain:", error);
    } finally {
      setAdding(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'disposed': return <Trash2 size={14} className="text-blue-500" />;
      case 'collected': return <Box size={14} className="text-amber-500" />;
      case 'recycled': return <CheckCircle2 size={14} className="text-emerald-500" />;
      default: return <RefreshCw size={14} className="text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Blockchain Waste Tracking</h1>
          <p className="text-slate-500 mt-1">Immutable ledger for waste lifecycle and circular economy transparency on Polygon.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-bold">Polygon Mainnet Connected</span>
          </div>
          <button 
            onClick={handleAddWaste}
            disabled={adding}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
          >
            {adding ? <RefreshCw size={18} className="animate-spin" /> : <Plus size={18} />}
            Log Waste TX
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Lifecycle Visualization */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Database size={120} />
            </div>
            <h2 className="font-bold text-slate-900 mb-8 flex items-center gap-2">
              <LinkIcon size={20} className="text-blue-600" />
              Waste Lifecycle Tracking
            </h2>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 hidden md:block"></div>
              
              {[
                { label: 'User', icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Smart Bin', icon: Trash2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Collector', icon: Box, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Recycling Plant', icon: Factory, color: 'text-emerald-600', bg: 'bg-emerald-50' }
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center gap-3 relative z-10">
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm border border-white", step.bg, step.color)}>
                    <step.icon size={28} />
                  </div>
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <History size={20} className="text-blue-600" />
                Immutable Transaction Ledger
              </h2>
              <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">View Explorer</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">TX Hash</th>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Waste Type</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Verified</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence mode="popLayout">
                    {transactions.map((tx) => (
                      <motion.tr 
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={tx.id} 
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        <td className="px-6 py-4 font-mono text-xs text-blue-600 font-bold">{tx.id}</td>
                        <td className="px-6 py-4 text-xs text-slate-500 font-mono">{tx.user}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 capitalize">{tx.wasteType}</span>
                            <span className="text-[10px] text-slate-400">{(tx.weight / 1000).toFixed(2)} kg</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(tx.status)}
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-wider",
                              tx.status === 'Recycled' ? "text-emerald-600" : 
                              tx.status === 'Collected' ? "text-amber-600" : "text-blue-600"
                            )}>
                              {tx.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {tx.verified ? (
                            <div className="flex items-center gap-1 text-emerald-600">
                              <ShieldCheck size={14} />
                              <span className="text-[10px] font-bold uppercase">Verified</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Pending</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <ExternalLink size={14} className="text-slate-300 group-hover:text-blue-600 cursor-pointer transition-colors" />
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <ShieldCheck size={48} className="text-blue-400 mb-6" />
            <h3 className="text-xl font-bold mb-2">Proof of Impact</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Every kilogram of waste collected is cryptographically verified and logged. This ensures zero double-counting in carbon credits.
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-xs text-slate-400">Total Verified Waste</span>
                <span className="font-bold">42,850 kg</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-xs text-slate-400">Smart Contracts</span>
                <span className="font-bold">12 Active</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6">Network Health</h3>
            <div className="space-y-4">
              {[
                { name: 'Polygon Validator', status: 'Online', latency: '12ms' },
                { name: 'OceanMind Node', status: 'Online', latency: '15ms' },
                { name: 'IPFS Gateway', status: 'Online', latency: '45ms' },
              ].map((node) => (
                <div key={node.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      node.status === 'Online' ? "bg-emerald-500" : "bg-amber-500"
                    )}></div>
                    <span className="text-sm font-medium text-slate-700">{node.name}</span>
                  </div>
                  <span className="text-xs text-slate-400">{node.latency}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
