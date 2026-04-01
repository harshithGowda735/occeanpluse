import React, { useState, useEffect } from 'react';
import { Waves, Map as MapIcon, AlertTriangle, Search, Info, Camera, RefreshCw, Layers, Droplets, Thermometer, Wind, Activity, ShieldCheck, Maximize2, Filter } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { LoadingState, ErrorState } from '../components/Feedback';

interface Hotspot {
  id: number;
  lat: number;
  lng: number;
  intensity: number;
  type: string;
  area: string;
  lastUpdated: string;
  spectralData: number[];
  confidence: number;
  depth: string;
}

interface Report {
  id: string;
  lat: number;
  lng: number;
  wasteType: string;
  severity: string;
  description: string;
}

// Helper to center map on selected hotspot
function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 10, { animate: true });
    }
  }, [center, map]);
  return null;
}

export default function Pollution() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showReports, setShowReports] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pollutionRes, reportsRes] = await Promise.all([
        fetch('/api/ocean/pollution'),
        fetch('/api/reports')
      ]);

      if (!pollutionRes.ok || !reportsRes.ok) {
        throw new Error("Failed to fetch ocean pollution data.");
      }

      const pollutionData = await pollutionRes.json();
      const reportsData = await reportsRes.json();
      
      setHotspots(pollutionData.hotspots);
      setSummary(pollutionData.summary);
      setReports(reportsData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      setAnalyzing(true);
      try {
        const response = await fetch('/api/ocean/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: reader.result })
        });
        const result = await response.json();
        setAnalysisResult(result);
      } catch (error) {
        console.error("Analysis failed:", error);
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8">
      {loading && !hotspots.length ? (
        <LoadingState message="Scanning ocean hotspots..." className="min-h-[600px]" />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} className="min-h-[400px]" />
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Ocean Pollution Monitoring</h1>
          <p className="text-slate-500 mt-1">Satellite-based AI detection of plastic patches and oil spills.</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-lg cursor-pointer transition-all">
            <Camera size={18} />
            Analyze Satellite Image
            <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-blue-600 mb-4">
            <Droplets size={24} />
            <h3 className="font-bold">Plastic Density</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">{summary?.plasticDensityAvg || '0.75 mg/L'}</p>
          <p className="text-xs text-rose-500 font-medium mt-1">+0.5% from last month</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-emerald-600 mb-4">
            <Waves size={24} />
            <h3 className="font-bold">Total Area Affected</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">{summary?.totalAreaAffected || '870 sq km'}</p>
          <p className="text-xs text-emerald-500 font-medium mt-1">Satellite Verified</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-amber-600 mb-4">
            <AlertTriangle size={24} />
            <h3 className="font-bold">Active Oil Spills</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">{summary?.activeOilSpills || '1'}</p>
          <p className="text-xs text-rose-500 font-medium mt-1">High Severity</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-indigo-600 mb-4">
            <Layers size={24} />
            <h3 className="font-bold">Satellite Source</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">Sentinel-2</p>
          <p className="text-xs text-slate-500 font-medium mt-1">NASA/ESA Mock API</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Real Leaflet Map */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative aspect-video group">
            <MapContainer center={[13.0827, 80.2707]} zoom={8} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapController center={selectedHotspot ? [selectedHotspot.lat, selectedHotspot.lng] : null} />
              
              {/* Pollution Zones (Large Circles) */}
              {showZones && hotspots.map((spot) => (
                <Circle
                  key={`zone-${spot.id}`}
                  center={[spot.lat, spot.lng]}
                  radius={parseInt(spot.area) * 100} // Scale area to radius for visualization
                  pathOptions={{
                    fillColor: spot.intensity > 0.8 ? '#ef4444' : '#f59e0b',
                    color: spot.intensity > 0.8 ? '#b91c1c' : '#b45309',
                    fillOpacity: 0.15,
                    weight: 1
                  }}
                >
                  <Popup>
                    <div className="p-2">
                      <p className="font-bold text-slate-900">{spot.type}</p>
                      <p className="text-xs text-slate-500">Area: {spot.area}</p>
                      <button 
                        onClick={() => setSelectedHotspot(spot)}
                        className="mt-2 text-xs font-bold text-blue-600 hover:underline"
                      >
                        View Spectral Data
                      </button>
                    </div>
                  </Popup>
                </Circle>
              ))}

              {/* Heatmap Simulation (Layered Circles) */}
              {showHeatmap && hotspots.map((spot) => (
                <React.Fragment key={`heat-${spot.id}`}>
                  <Circle
                    center={[spot.lat, spot.lng]}
                    radius={parseInt(spot.area) * 50}
                    pathOptions={{
                      fillColor: spot.intensity > 0.8 ? '#ef4444' : '#f59e0b',
                      color: 'transparent',
                      fillOpacity: 0.2
                    }}
                  />
                  <Circle
                    center={[spot.lat, spot.lng]}
                    radius={parseInt(spot.area) * 25}
                    pathOptions={{
                      fillColor: spot.intensity > 0.8 ? '#ef4444' : '#f59e0b',
                      color: 'transparent',
                      fillOpacity: 0.3
                    }}
                  />
                </React.Fragment>
              ))}

              {/* Waste Locations (Crowd Reports) */}
              {showReports && reports.map((report) => (
                <CircleMarker
                  key={`report-${report.id}`}
                  center={[report.lat, report.lng]}
                  radius={8}
                  pathOptions={{
                    fillColor: report.severity === 'High' ? '#ef4444' : '#f59e0b',
                    color: '#fff',
                    weight: 2,
                    fillOpacity: 0.8
                  }}
                >
                  <Popup>
                    <div className="p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500">{report.severity}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Crowd Report</span>
                      </div>
                      <p className="font-bold text-slate-900">{report.wasteType}</p>
                      <p className="text-xs text-slate-500 mt-1">{report.description}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>

            {/* Map Controls Overlay */}
            <div className="absolute bottom-6 left-6 flex items-center gap-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-xl z-[1000]">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    showHeatmap ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                  )}
                >
                  Heatmap
                </button>
                <button 
                  onClick={() => setShowZones(!showZones)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    showZones ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                  )}
                >
                  Zones
                </button>
                <button 
                  onClick={() => setShowReports(!showReports)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    showReports ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                  )}
                >
                  Reports
                </button>
              </div>
              <div className="h-4 w-px bg-slate-200 mx-2"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Satellite Feed</span>
            </div>

            <div className="absolute top-6 right-6 flex flex-col gap-2 z-[1000]">
              <button className="p-3 bg-white/90 backdrop-blur-md rounded-xl border border-white/20 shadow-lg text-slate-700 hover:bg-white transition-all">
                <Layers size={20} />
              </button>
              <button className="p-3 bg-white/90 backdrop-blur-md rounded-xl border border-white/20 shadow-lg text-slate-700 hover:bg-white transition-all">
                <Maximize2 size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Waves size={80} />
              </div>
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Info size={18} className="text-blue-600" />
                Pollution Trends
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Current data shows a 12% increase in microplastic density in the Arabian Sea over the last quarter. AI models predict a northward drift of the major plastic patch.
              </p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-emerald-500">
                <RefreshCw size={80} />
              </div>
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <RefreshCw size={18} className="text-emerald-600" />
                Cleanup Progress
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Ocean Cleanup Project has successfully intercepted 45 tons of plastic from the Mumbai coastline using the latest AI-guided barriers.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {analyzing ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]"
              >
                <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <h3 className="font-bold text-slate-900">AI Analysis in Progress</h3>
                <p className="text-slate-500 text-sm">Processing multispectral bands to identify chemical signatures...</p>
              </motion.div>
            ) : analysisResult ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">AI Analysis Result</h3>
                  <button onClick={() => setAnalysisResult(null)} className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase">Clear</button>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Detection Type</span>
                    <span className="text-sm font-bold text-slate-900 capitalize">{analysisResult.type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Severity</span>
                    <span className="text-sm font-bold text-slate-900">{(analysisResult.severity * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</span>
                  <p className="text-sm text-slate-600 leading-relaxed">{analysisResult.description}</p>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Area</span>
                    <span className="text-sm font-bold text-slate-900">{analysisResult.area}</span>
                  </div>
                </div>
              </motion.div>
            ) : selectedHotspot ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">Hotspot Details</h3>
                  <button onClick={() => setSelectedHotspot(null)} className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase">Close</button>
                </div>
                <div className={cn(
                  "p-6 rounded-2xl border flex flex-col items-center text-center gap-3",
                  selectedHotspot.intensity > 0.8 ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100"
                )}>
                  <AlertTriangle size={32} className={selectedHotspot.intensity > 0.8 ? "text-red-500" : "text-amber-500"} />
                  <div>
                    <h4 className="font-bold text-slate-900">{selectedHotspot.type}</h4>
                    <p className="text-xs text-slate-500">ID: #OSM-{selectedHotspot.id}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Spectral Signature</span>
                    <div className="flex items-center gap-1 text-emerald-600">
                      <ShieldCheck size={14} />
                      <span className="text-[10px] font-bold">{(selectedHotspot.confidence * 100).toFixed(0)}% Confidence</span>
                    </div>
                  </div>
                  <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selectedHotspot.spectralData.map((val, i) => ({ name: i, value: val }))}>
                        <defs>
                          <linearGradient id="colorSpectral" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={selectedHotspot.intensity > 0.8 ? "#ef4444" : "#f59e0b"} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={selectedHotspot.intensity > 0.8 ? "#ef4444" : "#f59e0b"} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke={selectedHotspot.intensity > 0.8 ? "#ef4444" : "#f59e0b"} 
                          fillOpacity={1} 
                          fill="url(#colorSpectral)" 
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Intensity</span>
                    <span className="text-lg font-bold text-slate-900">{(selectedHotspot.intensity * 100).toFixed(0)}%</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Depth</span>
                    <span className="text-lg font-bold text-slate-900">{selectedHotspot.depth}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Coordinates</span>
                  <div className="flex items-center justify-between text-sm font-mono text-slate-600">
                    <span>Lat: {selectedHotspot.lat.toFixed(4)}</span>
                    <span>Lng: {selectedHotspot.lng.toFixed(4)}</span>
                  </div>
                </div>
                <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                  Deploy Cleanup Drone
                </button>
              </motion.div>
            ) : (
              <div className="bg-slate-50 p-8 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
                <MapIcon size={48} className="text-slate-300" />
                <div>
                  <h3 className="font-bold text-slate-900">No Hotspot Selected</h3>
                  <p className="text-slate-500 text-sm">Select a marker on the map to view detailed satellite data.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )}
</div>
);
}
