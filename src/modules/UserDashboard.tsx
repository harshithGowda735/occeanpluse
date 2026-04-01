import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Trash2, 
  Star, 
  Zap, 
  Award, 
  MapPin, 
  ChevronRight,
  Clock,
  LayoutDashboard
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { cn } from '../lib/utils';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface UserActivity {
  id: string;
  type: string;
  location: string;
  points: number;
  time: string;
}

const recentActivities: UserActivity[] = [
  { id: '1', type: 'Plastic Bin Deposit', location: 'Marina Beach', points: 50, time: '2 hours ago' },
  { id: '2', type: 'Pollution Report', location: 'Coastal Road', points: 100, time: 'Yesterday' },
  { id: '3', type: 'Glass Recycling', location: 'Central Park Bin', points: 30, time: '2 days ago' },
];

const UserDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    points: 0,
    impact: 0,
    rank: 'Citizen',
    level: 1
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/user/profile', {
          headers: {
            'x-user-id': user?.id || '',
            'x-user-email': user?.email || ''
          }
        });
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch user stats:', err);
      }
    };
    fetchStats();
  }, []);

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Waste Recycled (kg)',
        data: [12, 19, 15, 8, 22, 30, 25],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#3B82F6',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1E293B',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' as const },
        bodyFont: { size: 13 },
        cornerRadius: 8,
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94A3B8' } },
      y: { grid: { color: '#F1F5F9' }, ticks: { color: '#94A3B8' } }
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <LayoutDashboard size={24} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Your Impact</h1>
          </div>
          <p className="text-slate-500 mt-2">Welcome back, {user?.email?.split('@')[0] || 'Guardian'}. Here's your ocean-saving progress.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Rank</span>
              <span className="text-lg font-bold text-slate-900">#422</span>
            </div>
            <div className="w-[1px] h-8 bg-slate-100"></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Growth</span>
              <span className="text-lg font-bold text-emerald-500">+12%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Points', value: stats.points.toLocaleString(), icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Waste Diverted', value: `${stats.impact} kg`, icon: Trash2, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Citizen Level', value: `Level ${stats.level}`, icon: Zap, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Impact Chart (CRT) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-600" />
                Recycling Analytics (CRT)
              </h3>
              <p className="text-xs text-slate-400 mt-1">Your weekly environmental contribution trends.</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">This Week</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Clock size={20} className="text-slate-400" />
            Recent Activity
          </h3>
          <div className="space-y-6">
            {recentActivities.map((activity, i) => (
              <div key={activity.id} className="flex gap-4 relative">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-600 z-10">
                    {i === 0 ? <Zap size={14} /> : <Award size={14} />}
                  </div>
                  {i !== recentActivities.length - 1 && (
                    <div className="w-[1px] h-full bg-slate-100 absolute top-8"></div>
                  )}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-bold text-slate-900">{activity.type}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><MapPin size={10} /> {activity.location}</span>
                    <span className="text-blue-500">+{activity.points} pts</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
            View All History <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Rewards Teaser */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-10 rounded-[32px] text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 transition-transform duration-700">
          <Award size={160} />
        </div>
        <div className="relative z-10 max-w-lg">
          <h2 className="text-2xl font-bold mb-4">You're close to a new badge!</h2>
          <p className="text-blue-100 leading-relaxed mb-8">
            Complete 2 more recycling deposits this week to earn the "Coastal Guardian" achievement and 500 bonus points.
          </p>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/bins')}
              className="px-8 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-lg"
            >
              Find a Smart Bin
            </button>
             <button 
              onClick={() => navigate('/rewards')}
              className="px-8 py-3 bg-blue-500/20 border border-white/20 text-white rounded-xl font-bold hover:bg-blue-500/40 transition-all"
            >
              View Rewards
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
