import React, { useState, useEffect } from 'react';
import { Trophy, Star, TrendingUp, Users, Award, Zap, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

// Leaderboard interface
interface LeaderboardUser {
  rank: number;
  name: string;
  points: number;
  impact: string;
  avatar: string;
}

export default function Rewards() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ points: 0, level: 1, rank: 'Citizen', impact: 0 });
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, leaderboardRes] = await Promise.all([
          fetch('/api/user/profile', {
            headers: {
              'x-user-id': user?.id || '',
              'x-user-email': user?.email || ''
            }
          }),
          fetch('/api/leaderboard')
        ]);
        
        const profileData = await profileRes.json();
        const leaderboardData = await leaderboardRes.json();
        
        setStats(profileData);
        setLeaderboard(leaderboardData.map((u: any, i: number) => ({
          rank: i + 1,
          name: u.name,
          points: u.points,
          impact: `${(u.points/10).toFixed(1)}kg`, // Mock impact for leaderboard users
          avatar: `https://picsum.photos/seed/user${i}/40/40`
        })));
      } catch (err) {
        console.error('Failed to fetch rewards data:', err);
      }
    };
    fetchData();
  }, []);
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gamification & Rewards</h1>
          <p className="text-slate-500 mt-1">Earn points for every action and climb the global leaderboards.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200">
          <div className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl flex items-center gap-2">
            <Star size={20} fill="currentColor" />
            <span className="font-bold">{stats.points.toLocaleString()} Points</span>
          </div>
          <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl flex items-center gap-2">
            <Zap size={20} fill="currentColor" />
            <span className="font-bold">Level {stats.level}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl text-white shadow-xl">
              <Trophy size={32} className="text-blue-200 mb-4" />
              <h3 className="text-sm font-medium text-blue-100">Current Rank</h3>
              <p className="text-2xl font-bold mt-1">{stats.rank}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-blue-200">
                <TrendingUp size={14} />
                Top 5% globally
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <Award size={32} className="text-amber-500 mb-4" />
              <h3 className="text-sm font-medium text-slate-500">Badges Earned</h3>
              <p className="text-2xl font-bold text-slate-900 mt-1">14</p>
              <div className="mt-4 flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center">
                    <Star size={14} className="text-amber-500" />
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400">
                  +10
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <Users size={32} className="text-emerald-500 mb-4" />
              <h3 className="text-sm font-medium text-slate-500">Impact Score</h3>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.impact} <span className="text-sm font-normal text-slate-400">kg</span></p>
              <div className="mt-4 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-2/3 h-full bg-emerald-500"></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Global Leaderboard</h2>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-slate-100 text-slate-900 rounded-lg text-xs font-bold">Weekly</button>
                <button className="px-3 py-1 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-50">All Time</button>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {leaderboard.map((user) => (
                <div key={user.rank} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all">
                  <div className="flex items-center gap-6">
                    <span className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                      user.rank === 1 ? "bg-amber-100 text-amber-600" :
                      user.rank === 2 ? "bg-slate-100 text-slate-600" :
                      user.rank === 3 ? "bg-orange-100 text-orange-600" : "text-slate-400"
                    )}>
                      {user.rank}
                    </span>
                    <div className="flex items-center gap-4">
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-slate-200" />
                      <div>
                        <p className="font-bold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.impact} waste diverted</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{user.points.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Points</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6">Daily Quests</h3>
            <div className="space-y-4">
              {[
                { title: 'Scan 5 Plastic Items', reward: '+50 pts', progress: 3, total: 5 },
                { title: 'Verify 2 Reports', reward: '+100 pts', progress: 0, total: 2 },
                { title: 'Visit a Smart Bin', reward: '+30 pts', progress: 1, total: 1 },
              ].map((quest) => (
                <div key={quest.title} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-slate-900">{quest.title}</p>
                    <span className="text-xs font-bold text-blue-600">{quest.reward}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${(quest.progress / quest.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 p-8 rounded-3xl">
            <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2">
              <Star size={20} fill="currentColor" />
              Special Event
            </h3>
            <p className="text-sm text-amber-800 leading-relaxed mb-6">
              Participate in the "Coastal Cleanup Weekend" to earn 3x points and a limited edition badge.
            </p>
            <button className="w-full py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all flex items-center justify-center gap-2">
              Join Event <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
