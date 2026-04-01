import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Camera, Upload, RefreshCw, CheckCircle2, AlertTriangle, Trash2, MapPin, Info, ArrowRight, ShieldAlert, Leaf, Droplets } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

interface ScanResult {
  category: 'plastic' | 'organic' | 'hazardous' | 'other';
  confidence: number;
  description: string;
  disposalInstructions: string[];
  recyclability: string;
  impactPoints: number;
}

const MOCK_CENTERS = [
  { name: 'GreenCycle Coastal Hub', distance: '1.2 km', type: 'Plastic & Metal' },
  { name: 'EcoSafe Hazardous Disposal', distance: '3.5 km', type: 'Hazardous Only' },
  { name: 'BioBloom Compost Center', distance: '2.1 km', type: 'Organic' },
];

export default function Scanner() {
  const { user } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const scanWaste = async () => {
    if (!image) return;
    setIsScanning(true);
    setError(null);
    
    if (!apiKey || apiKey.includes('Placeholder')) {
      setError("Gemini API Key is missing or invalid. Please check your .env configuration.");
      setIsScanning(false);
      return;
    }

    try {
      const base64Data = image.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: "Identify the waste in this image. Categorize it strictly as one of: 'plastic', 'organic', 'hazardous', or 'other'. Provide a brief description, step-by-step disposal instructions, recyclability status, and impact points (1-50). Return as JSON format." },
              { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const data = JSON.parse(response.text || '{}') as ScanResult;
      setResult(data);

      // Log to backend (as requested)
      await fetch('/api/scan', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-user-email': user?.email || ''
        },
        body: JSON.stringify({ image: base64Data, metadata: data })
      });

    } catch (err) {
      console.error("Scanning failed:", err);
      setError("AI analysis failed. Please ensure the image is clear and try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">AI Waste Scanner</h1>
          <p className="text-slate-500 mt-2 text-lg">Instant classification and disposal guidance powered by OceanMind AI.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={reset}
            className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <RefreshCw size={18} /> Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Upload & Preview */}
        <div className="lg:col-span-5 space-y-6">
          <div 
            className={cn(
              "relative aspect-[4/5] rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-white flex items-center justify-center transition-all overflow-hidden shadow-sm",
              !image && "hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer"
            )}
            onClick={() => !image && fileInputRef.current?.click()}
          >
            {image ? (
              <div className="relative w-full h-full group">
                <img src={image} alt="Waste Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className="bg-white/90 backdrop-blur px-4 py-2 rounded-full font-bold text-sm text-slate-900 shadow-xl"
                  >
                    Change Image
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 text-slate-400 p-12 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center shadow-inner">
                  <Upload size={32} className="text-slate-300" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">Drop waste image here</p>
                  <p className="text-sm mt-2">or click to browse from your device</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold uppercase tracking-widest">JPG</span>
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold uppercase tracking-widest">PNG</span>
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold uppercase tracking-widest">WEBP</span>
                </div>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              className="hidden" 
              accept="image/*" 
            />
          </div>

          <button 
            onClick={scanWaste}
            disabled={!image || isScanning}
            className={cn(
              "w-full py-5 rounded-[2rem] font-bold text-lg shadow-2xl transition-all flex items-center justify-center gap-3",
              !image || isScanning 
                ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200"
            )}
          >
            {isScanning ? (
              <>
                <RefreshCw size={24} className="animate-spin" />
                Processing Analysis...
              </>
            ) : (
              <>
                <Camera size={24} />
                Analyze Composition
              </>
            )}
          </button>
        </div>

        {/* Right Column: Results & Guidance */}
        <div className="lg:col-span-7 space-y-8">
          <AnimatePresence mode="wait">
            {!result && !isScanning && !error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center space-y-6 min-h-[500px]"
              >
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <Info size={40} />
                </div>
                <div className="max-w-sm">
                  <h2 className="text-2xl font-bold text-slate-900">Ready to Scan</h2>
                  <p className="text-slate-500 mt-3 leading-relaxed">
                    Our AI will identify the material and provide precise disposal instructions to protect our oceans.
                  </p>
                </div>
              </motion.div>
            )}

            {isScanning && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center space-y-8 min-h-[500px]"
              >
                <div className="relative">
                  <div className="w-32 h-32 border-4 border-blue-50 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera size={32} className="text-blue-600 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-slate-900">Scanning Pixels...</h2>
                  <p className="text-slate-500">Comparing with 1.2M waste samples</p>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-rose-50 p-12 rounded-[2.5rem] border border-rose-100 flex flex-col items-center justify-center text-center space-y-6 min-h-[500px]"
              >
                <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
                  <AlertTriangle size={32} />
                </div>
                <div className="max-w-sm">
                  <h2 className="text-2xl font-bold text-rose-900">Analysis Error</h2>
                  <p className="text-rose-700 mt-2">{error}</p>
                </div>
                <button onClick={reset} className="px-6 py-2 bg-rose-600 text-white rounded-full font-bold">Try Again</button>
              </motion.div>
            )}

            {result && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                {/* Result Header */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2",
                      result.category === 'plastic' ? "bg-blue-50 text-blue-600" :
                      result.category === 'organic' ? "bg-emerald-50 text-emerald-600" :
                      result.category === 'hazardous' ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-600"
                    )}>
                      {result.category === 'plastic' && <Droplets size={14} />}
                      {result.category === 'organic' && <Leaf size={14} />}
                      {result.category === 'hazardous' && <ShieldAlert size={14} />}
                      {result.category}
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                      <CheckCircle2 size={18} />
                      AI Verified
                    </div>
                  </div>

                  <h2 className="text-3xl font-bold text-slate-900 leading-tight">{result.description}</h2>
                  <p className="text-slate-500 mt-4 text-lg leading-relaxed">
                    This item has been identified as <span className="font-bold text-slate-900">{result.category}</span> waste. 
                    Proper disposal is critical to prevent it from entering marine ecosystems.
                  </p>

                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <div className="p-6 bg-slate-50 rounded-3xl">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recyclability</p>
                      <p className="text-xl font-bold text-slate-900 mt-1">{result.recyclability}</p>
                    </div>
                    <div className="p-6 bg-blue-50 rounded-3xl">
                      <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Impact Points</p>
                      <p className="text-2xl font-bold text-blue-600 mt-1">+{result.impactPoints}</p>
                    </div>
                  </div>
                </div>

                {/* Disposal Instructions */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                    <Trash2 size={24} className="text-blue-600" />
                    Disposal Instructions
                  </h3>
                  <div className="space-y-4">
                    {result.disposalInstructions.map((step, i) => (
                      <div key={i} className="flex gap-4 group">
                        <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-sm font-bold text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-slate-600 leading-relaxed pt-1">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nearby Centers */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                    <MapPin size={24} className="text-emerald-600" />
                    Nearby Recycling Centers
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {MOCK_CENTERS.map((center) => (
                      <div key={center.name} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer group">
                        <p className="font-bold text-slate-900 text-sm leading-tight group-hover:text-emerald-700">{center.name}</p>
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-xs text-slate-500">{center.distance}</span>
                          <ArrowRight size={14} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
