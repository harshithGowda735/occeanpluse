import React, { useState, useEffect, useRef } from 'react';
import { MapPin, AlertCircle, Plus, Filter, Search, CheckCircle2, Clock, Trash2, Camera, Send, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LoadingState, ErrorState } from '../components/Feedback';

// Custom SVG Marker to avoid asset import issues
const customMarkerIcon = L.divIcon({
  html: `<div class="w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
           <div class="w-2 h-2 bg-white rounded-full"></div>
         </div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

interface Report {
  id: number;
  lat: number;
  lng: number;
  wasteType: string;
  description: string;
  status: string;
  timestamp: string;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newReport, setNewReport] = useState({ description: '', image: '' });
  const [submitting, setSubmitting] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.9716, 77.5946]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/reports', {
        headers: {
          'x-user-id': user?.id || '',
          'x-user-email': user?.email || ''
        }
      });
      if (!response.ok) throw new Error("Failed to fetch reports.");
      const data = await response.json();
      setReports(data);
      if (data.length > 0) {
        setMapCenter([data[0].lat, data[0].lng]);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      setError(error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewReport({ ...newReport, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Get current location
    let lat = 12.9716;
    let lng = 77.5946;
    
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } catch (err) {
        console.warn("Geolocation failed, using default coordinates");
      }
    }

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-user-email': user?.email || ''
        },
        body: JSON.stringify({
          ...newReport,
          lat,
          lng
        })
      });
      if (response.ok) {
        setShowForm(false);
        setNewReport({ description: '', image: '' });
        fetchReports();
      }
    } catch (error) {
      console.error("Failed to submit report:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {loading && !reports.length ? (
        <LoadingState message="Fetching community reports..." className="min-h-[600px]" />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchReports} className="min-h-[400px]" />
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Crowd Waste Reporting</h1>
          <p className="text-slate-500 mt-1">Community-driven pollution detection and AI-powered classification.</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
        >
          <Plus size={18} />
          Report Waste
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Leaflet Map */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative aspect-video z-0">
            <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <MapUpdater center={mapCenter} />
              
              {/* Heat Zones (Simulated) */}
              {reports.map((report) => (
                <Circle
                  key={`heat-${report.id}`}
                  center={[report.lat, report.lng]}
                  radius={500}
                  pathOptions={{
                    fillColor: report.wasteType === 'hazardous' ? '#ef4444' : 
                               report.wasteType === 'plastic' ? '#3b82f6' : '#10b981',
                    fillOpacity: 0.2,
                    stroke: false
                  }}
                />
              ))}

              {/* Report Pins */}
              {reports.map((report) => (
                <Marker key={report.id} position={[report.lat, report.lng]} icon={customMarkerIcon}>
                  <Popup>
                    <div className="p-2">
                      <h4 className="font-bold text-slate-900 capitalize mb-1">{report.wasteType} Waste</h4>
                      <p className="text-xs text-slate-500">{report.description}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-blue-600 uppercase">{report.status}</span>
                        <span className="text-[10px] text-slate-400">{new Date(report.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-[400]">
              <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Map Legend</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-[10px] font-bold text-slate-600">Hazardous</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-[10px] font-bold text-slate-600">Plastic</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-[10px] font-bold text-slate-600">Organic</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <Clock size={20} className="text-blue-600" />
                Live Feed
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {reports.map((report) => (
                <div key={report.id} className="p-6 flex items-start gap-4 hover:bg-slate-50 transition-all group cursor-pointer" onClick={() => setMapCenter([report.lat, report.lng])}>
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                    report.wasteType === 'plastic' ? "bg-blue-50 text-blue-600" :
                    report.wasteType === 'hazardous' ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                  )}>
                    <Trash2 size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-slate-900 capitalize">{report.wasteType} Waste</h4>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                        report.status === 'Resolved' ? "bg-emerald-100 text-emerald-600" :
                        report.status === 'In Progress' ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                      )}>
                        {report.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-2">{report.description}</p>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <MapPin size={10} />
                        {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
                      </span>
                      <span>{new Date(report.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-blue-600">
              <AlertCircle size={80} />
            </div>
            <h3 className="font-bold text-slate-900 mb-4">Impact Score</h3>
            <div className="flex items-end gap-2 mb-6">
              <span className="text-4xl font-bold text-slate-900">850</span>
              <span className="text-sm font-bold text-emerald-500 mb-1">+12%</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Your reports have helped divert 120kg of plastic from the ocean. Keep reporting to earn more rewards!
            </p>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="w-[85%] h-full bg-blue-600 rounded-full"></div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Level 4</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">1000 XP</span>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl">
            <h3 className="font-bold mb-6">Community Leaderboard</h3>
            <div className="space-y-4">
              {[
                { name: 'Sarah J.', points: 2450, rank: 1 },
                { name: 'Mike R.', points: 2120, rank: 2 },
                { name: 'Alex K.', points: 1890, rank: 3 },
              ].map((user) => (
                <div key={user.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 w-4">{user.rank}</span>
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs font-bold">
                      {user.name[0]}
                    </div>
                    <span className="text-sm font-medium">{user.name}</span>
                  </div>
                  <span className="text-xs font-bold text-blue-400">{user.points} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Report Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-slate-900">Report Waste</h2>
                  <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                    <X size={24} className="text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Waste Image</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-all overflow-hidden relative"
                    >
                      {newReport.image ? (
                        <img src={newReport.image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Camera size={32} className="text-slate-300" />
                          <span className="text-xs font-bold text-slate-400">Click to upload or take photo</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                    </div>
                    {newReport.image && (
                      <p className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Image attached - AI will detect type
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description</label>
                    <textarea 
                      required
                      value={newReport.description}
                      onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                      placeholder="Describe the waste location and severity..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[100px]"
                    ></textarea>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button 
                      type="submit" 
                      disabled={submitting || !newReport.image}
                      className="flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" />
                          AI Analyzing & Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          Submit Report
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-wider">
                      AI will automatically detect waste type and location
                    </p>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </>
      )}
    </div>
  );
}
