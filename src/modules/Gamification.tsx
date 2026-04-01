import React, { useState, useEffect } from 'react';
import { Trophy, Star, Medal, Target, TrendingUp, Users, Award, Zap, ChevronRight, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { LoadingState, ErrorState } from '../components/Feedback';

interface LeaderboardUser {
  id: number;
  name: string;
  points: number;
  rank: number;
  avatar: string;
}

export default function Gamification() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/leaderboard');
      if (!response.ok) throw new Error("Failed to fetch leaderboard data.");
      const data = await response.json();
      setLeaderboard(data);
      const current = data.find((u: LeaderboardUser) => u.name === "Harshith G.");
      setCurrentUser(current || null);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
      setError(error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Mock Brain icon since it's not imported from lucide-react in this file but used in pointRules
  const Brain = ({ size, className }: { size?: number, className?: string }) => (
    <svg 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54Z"/>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54Z"/>
    </svg>
  );

  const pointRules = [
    { action: 'Recycling', points: '+20', icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50' },
    { action: 'Report Waste', points: '+10', icon: Target, color: 'text-amber-600', bg: 'bg-amber-50' },
    { action: 'Scan Waste', points: '+5', icon: Brain, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Trophy className="text-amber-500" />
            Community Leaderboard
          </h1>
          <p className="text-slate-500 mt-1">Track your impact and compete with other Ocean Guardians.</p>
        </div>
        <button 
          onClick={fetchLeaderboard}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
        >
          <RefreshCw size={18} className={cn(loading && "animate-spin")} />
          Refresh Stats
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Current User Stats */}
          <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Star size={140} />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-3xl font-bold border-4 border-white/20 shadow-2xl">
                  {currentUser?.avatar || 'H'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">{currentUser?.name || 'Harshith G.'}</h2>
                  <div className="flex items-center gap-2 text-blue-400">
                    <Medal size={16} />
                    <span className="text-sm font-bold uppercase tracking-wider">Rank #{currentUser?.rank || '4'} • Ocean Guardian</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-8">
                <div className="text-center">
                  <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Points</p>
                  <p className="text-3xl font-bold">{currentUser?.points || '850'}</p>
                </div>
                <div className="text-center">
                  <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-1">Impact Level</p>
                  <p className="text-3xl font-bold">4</p>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase mb-1">Reports</span>
                <span className="font-bold">24</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase mb-1">Recycled</span>
                <span className="font-bold">156kg</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase mb-1">Scans</span>
                <span className="font-bold">42</span>
              </div>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <Users size={20} className="text-blue-600" />
                Top Guardians
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <LoadingState message="Calculating rankings..." className="py-12" />
                ) : error ? (
                  <ErrorState message={error} onRetry={fetchLeaderboard} className="py-12" />
                ) : (
                  leaderboard.map((user, i) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        "p-6 flex items-center gap-4 transition-all hover:bg-slate-50 group",
                        user.name === "Harshith G." && "bg-blue-50/50"
                      )}
                    >
                      <div className="w-8 flex justify-center">
                        {user.rank === 1 ? <Trophy size={20} className="text-amber-500" /> :
                         user.rank === 2 ? <Medal size={20} className="text-slate-400" /> :
                         user.rank === 3 ? <Medal size={20} className="text-amber-700" /> :
                         <span className="text-sm font-bold text-slate-400">{user.rank}</span>}
                      </div>
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm",
                        user.rank === 1 ? "bg-amber-500" : "bg-slate-200 text-slate-600"
                      )}>
                        {user.avatar}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                          {user.name}
                          {user.name === "Harshith G." && (
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase">You</span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-500">Level {Math.floor(user.points / 200) + 1}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">{user.points.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Points</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Point Rules */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Award size={20} className="text-blue-600" />
              How to Earn Points
            </h3>
            <div className="space-y-6">
              {pointRules.map((rule) => (
                <div key={rule.action} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", rule.bg, rule.color)}>
                      <rule.icon size={20} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{rule.action}</span>
                  </div>
                  <span className={cn("font-bold", rule.color)}>{rule.points}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Achievement Card */}
          <div className="bg-emerald-600 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden group cursor-pointer">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={20} />
                <span className="text-xs font-bold uppercase tracking-widest">Next Milestone</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Ocean Defender</h3>
              <p className="text-emerald-100 text-sm leading-relaxed mb-6">
                Reach 1,000 points to unlock the exclusive "Ocean Defender" badge and 5% marketplace discount.
              </p>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-2">
                <div className="w-[85%] h-full bg-white rounded-full"></div>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-emerald-100 uppercase">
                <span>850 / 1000</span>
                <span>85%</span>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform">
              <Medal size={120} />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6">Recent Activity</h3>
            <div className="space-y-6">
              {[
                { action: 'Recycled 5kg Plastic', points: '+20', time: '2h ago' },
                { action: 'Reported Waste', points: '+10', time: '5h ago' },
                { action: 'Scanned Waste', points: '+5', time: '1d ago' },
              ].map((activity, i) => (
                <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{activity.time}</p>
                  </div>
                  <span className="text-xs font-bold text-blue-600">{activity.points}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
