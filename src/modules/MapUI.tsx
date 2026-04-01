import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Circle, LayersControl, LayerGroup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Filter, Layers, AlertTriangle, Droplets, Info, Maximize2, MousePointer2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { LoadingState, ErrorState } from '../components/Feedback';

interface Hotspot {
  id: number;
  lat: number;
  lng: number;
  intensity: number;
  type: string;
  area: string;
}

interface Report {
  id: string;
  lat: number;
  lng: number;
  wasteType: string;
  severity: string;
  description: string;
}

export default function MapUI() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [hotspotsRes, reportsRes] = await Promise.all([
        fetch('/api/ocean/hotspots'),
        fetch('/api/reports')
      ]);
      
      if (!hotspotsRes.ok || !reportsRes.ok) {
        throw new Error("Failed to fetch map data components.");
      }

      const hotspotsData = await hotspotsRes.json();
      const reportsData = await reportsRes.json();
      setHotspots(hotspotsData);
      setReports(reportsData);
    } catch (error) {
      console.error("Failed to fetch map data:", error);
      setError(error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="h-[calc(100vh-160px)] w-full rounded-3xl overflow-hidden border border-slate-200 shadow-xl relative bg-white">
      {loading && (
        <div className="absolute inset-0 z-[2000] bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <LoadingState message="Loading Planetary Map..." />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-[2000] bg-white flex items-center justify-center p-8">
          <ErrorState message={error} onRetry={fetchData} />
        </div>
      )}

      <MapContainer 
        center={[13.0827, 80.2707]} 
        zoom={6} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        <LayersControl position="topright">
          <LayersControl.Overlay checked name="Pollution Hotspots">
            <LayerGroup>
              {hotspots.map((spot) => (
                <Circle
                  key={`hotspot-${spot.id}`}
                  center={[spot.lat, spot.lng]}
                  radius={parseInt(spot.area) * 100}
                  pathOptions={{
                    fillColor: spot.intensity > 0.8 ? '#ef4444' : '#f59e0b',
                    color: spot.intensity > 0.8 ? '#b91c1c' : '#b45309',
                    fillOpacity: 0.2,
                    weight: 1
                  }}
                >
                  <Popup>
                    <div className="p-3 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn("w-2 h-2 rounded-full", spot.intensity > 0.8 ? "bg-red-500" : "bg-amber-500")}></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Satellite Detection</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-base">{spot.type}</h4>
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Intensity</span>
                          <span className="font-bold text-slate-900">{(spot.intensity * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Area</span>
                          <span className="font-bold text-slate-900">{spot.area}</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Circle>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="Crowd Reports">
            <LayerGroup>
              {reports.map((report) => (
                <CircleMarker
                  key={`report-${report.id}`}
                  center={[report.lat, report.lng]}
                  radius={10}
                  pathOptions={{
                    fillColor: report.severity === 'High' ? '#ef4444' : '#f59e0b',
                    color: '#fff',
                    weight: 2,
                    fillOpacity: 0.9
                  }}
                >
                  <Popup>
                    <div className="p-3 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={14} className="text-rose-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500">{report.severity} Severity</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-base">{report.wasteType}</h4>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">{report.description}</p>
                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified by AI</span>
                        <button className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest">Details</button>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay name="Heatmap Density">
            <LayerGroup>
              {hotspots.map((spot) => (
                <Circle
                  key={`heat-${spot.id}`}
                  center={[spot.lat, spot.lng]}
                  radius={parseInt(spot.area) * 200}
                  pathOptions={{
                    fillColor: spot.intensity > 0.8 ? '#ef4444' : '#f59e0b',
                    color: 'transparent',
                    fillOpacity: 0.1
                  }}
                />
              ))}
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>
      </MapContainer>

      {/* Floating UI Elements */}
      <div className="absolute top-6 left-6 z-[1000] space-y-4">
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-2xl min-w-[240px]">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Filter size={18} className="text-blue-600" />
            Map Filters
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Satellite Data</span>
              <div className="w-8 h-4 bg-blue-600 rounded-full relative">
                <div className="absolute right-1 top-1 w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Crowd Reports</span>
              <div className="w-8 h-4 bg-blue-600 rounded-full relative">
                <div className="absolute right-1 top-1 w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Cleanup Drones</span>
              <div className="w-8 h-4 bg-slate-200 rounded-full relative">
                <div className="absolute left-1 top-1 w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Critical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Medium</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2">
        <button className="p-3 bg-white/90 backdrop-blur-md rounded-xl border border-white/20 shadow-xl text-slate-700 hover:bg-white transition-all">
          <Maximize2 size={20} />
        </button>
        <button className="p-3 bg-white/90 backdrop-blur-md rounded-xl border border-white/20 shadow-xl text-slate-700 hover:bg-white transition-all">
          <Layers size={20} />
        </button>
        <button className="p-3 bg-white/90 backdrop-blur-md rounded-xl border border-white/20 shadow-xl text-slate-700 hover:bg-white transition-all">
          <MousePointer2 size={20} />
        </button>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-6 text-white">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold uppercase tracking-widest">Live Satellite Feed</span>
        </div>
        <div className="h-4 w-px bg-white/20"></div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Last Sync:</span>
          <span className="text-xs font-bold">Just Now</span>
        </div>
      </div>
    </div>
  );
}
