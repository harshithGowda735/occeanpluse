import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import { format } from "date-fns";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import mongoose from "mongoose";
import { Resend } from "resend";
import { getRiskZones } from "./src/backend/controllers/riskZoneController";
import { RoutingService } from "./src/backend/services/routingService";
import Snapshot from "./models/Snapshot";
import Report from "./models/Report";
import User from "./models/User";
import Bin from "./models/Bin";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key");
const routingService = new RoutingService();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let appInstance: express.Express | null = null;
let dbConnected = false;

export async function setupApp() {
  if (appInstance) return appInstance;

  const app = express();

  const PORT = Number(process.env.PORT) || 3000;
  const NODE_ENV = process.env.NODE_ENV || 'development';

  console.log(`\n🌊 OceanMind+ starting up (ENV: ${NODE_ENV}, PORT: ${PORT})`);

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // MongoDB Connection
  if (!dbConnected) {
    try {
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        console.warn("⚠️  MONGODB_URI is not defined. Using local fallback.");
      } else {
        console.log("🔗 Connecting to MongoDB...");
      }
      
      await mongoose.connect(mongoUri || "mongodb://localhost:27017/oceanmind");
      console.log("✅ Connected to MongoDB");
      dbConnected = true;
    } catch (err) {
      console.error("❌ MongoDB connection error:", err);
    }
  }

  // --- Data Stores ---
  let bins = [
    { id: "BIN-001", location: "North Beach", lat: 13.0116, lng: 77.5946, fillLevel: 45, wasteType: "plastic", battery: 88, status: "active", lastUpdated: Date.now() },
    { id: "BIN-002", location: "Central Pier", lat: 12.9716, lng: 77.6346, fillLevel: 72, wasteType: "organic", battery: 92, status: "active", lastUpdated: Date.now() },
    { id: "BIN-003", location: "South Marina", lat: 12.9316, lng: 77.5946, fillLevel: 12, wasteType: "metal", battery: 75, status: "active", lastUpdated: Date.now() },
    { id: "BIN-004", location: "Sunset Blvd", lat: 12.9716, lng: 77.5546, fillLevel: 95, wasteType: "plastic", battery: 45, status: "full", lastUpdated: Date.now() },
    { id: "BIN-005", location: "Eco Park", lat: 13.0016, lng: 77.6146, fillLevel: 30, wasteType: "paper", battery: 98, status: "active", lastUpdated: Date.now() },
    { id: "BIN-006", location: "MG Road", lat: 12.9756, lng: 77.6068, fillLevel: 55, wasteType: "mixed", battery: 90, status: "active", lastUpdated: Date.now() },
    { id: "BIN-007", location: "Indiranagar", lat: 12.9784, lng: 77.6408, fillLevel: 88, wasteType: "plastic", battery: 72, status: "critical", lastUpdated: Date.now() },
    { id: "BIN-008", location: "Koramangala", lat: 12.9352, lng: 77.6245, fillLevel: 25, wasteType: "organic", battery: 95, status: "active", lastUpdated: Date.now() },
    { id: "BIN-009", location: "Whitefield", lat: 12.9698, lng: 77.7500, fillLevel: 98, wasteType: "mixed", battery: 40, status: "full", lastUpdated: Date.now() },
    { id: "BIN-010", location: "Jayanagar", lat: 12.9250, lng: 77.5897, fillLevel: 10, wasteType: "paper", battery: 88, status: "active", lastUpdated: Date.now() },
    { id: "BIN-011", location: "Hebbal", lat: 13.0354, lng: 77.5988, fillLevel: 65, wasteType: "plastic", battery: 82, status: "active", lastUpdated: Date.now() },
    { id: "BIN-012", location: "Malleshwaram", lat: 12.9988, lng: 77.5714, fillLevel: 78, wasteType: "metal", battery: 65, status: "critical", lastUpdated: Date.now() },
    { id: "BIN-013", location: "Bannerghatta", lat: 12.8391, lng: 77.5963, fillLevel: 15, wasteType: "organic", battery: 99, status: "active", lastUpdated: Date.now() },
    { id: "BIN-014", location: "Electronics City", lat: 12.8452, lng: 77.6632, fillLevel: 92, wasteType: "plastic", battery: 52, status: "full", lastUpdated: Date.now() },
    { id: "BIN-015", location: "HSR Layout", lat: 12.9105, lng: 77.6450, fillLevel: 42, wasteType: "mixed", battery: 89, status: "active", lastUpdated: Date.now() },
  ];

  // Minimal Backend / Mock Routes (Quick Fix)
  app.get("/api/reports", async (req, res) => {
    try {
      const reports = await Report.find().sort({ timestamp: -1 }).limit(50);
      res.json(reports);
    } catch (err) {
      console.warn("⚠️ Minimal fallback: Failed to fetch real reports, returning empty list.");
      res.json([]);
    }
  });

  app.get("/api/ocean/hotspots", (req, res) => {
    // pollutionHotspots should be available globally or moved here
    res.json(typeof pollutionHotspots !== 'undefined' ? pollutionHotspots : [{ lat: 12.9716, lng: 77.5946, risk: "high", reason: "AI Predicted Hotspot" }]);
  });

  app.get("/api/user/profile", async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.json({ points: 0, impact: 0, rank: "Citizen", level: 1 });
    try {
      const user = await User.findOne({ uid: userId });
      if (!user) return res.json({ points: 0, impact: 0, rank: "Citizen", level: 1 });
      res.json({ points: user.points, impact: user.impact, rank: user.rank, level: Math.floor(user.points / 200) + 1 });
    } catch (err) {
      res.json({ points: 0, impact: 0, rank: "User", level: 1 });
    }
  });

  // Alias for send-verification (supporting multiple frontend patterns)
  app.post("/api/send-verification", (req, res, next) => {
    req.url = "/api/auth/send-verification";
    next();
  });

  let leaderboard = [
    { id: 1, name: "Sarah J.", points: 2450, rank: 1, avatar: "S" },
    { id: 2, name: "Mike R.", points: 2120, rank: 2, avatar: "M" },
    { id: 3, name: "Alex K.", points: 1890, rank: 3, avatar: "A" },
    { id: 4, name: "Harshith G.", points: 850, rank: 4, avatar: "H" }, // Current User
    { id: 5, name: "Elena V.", points: 720, rank: 5, avatar: "E" },
  ];

  let blockchainTransactions = [
    { id: "TX-9821", user: "0x71C...3E2", binId: "BIN-001", wasteType: "plastic", weight: 450, status: "Recycled", timestamp: Date.now() - 86400000, verified: true },
    { id: "TX-9822", user: "0x42A...9B1", binId: "BIN-002", wasteType: "organic", weight: 1200, status: "Collected", timestamp: Date.now() - 43200000, verified: false },
    { id: "TX-9823", user: "0x15D...F44", binId: "BIN-005", wasteType: "paper", weight: 300, status: "Disposed", timestamp: Date.now() - 3600000, verified: false },
  ];

  let crowdReports = [
    { id: 1, lat: 12.9716, lng: 77.5946, wasteType: 'plastic', description: 'Large pile of plastic bottles near the park.', status: 'Pending', severity: 'Medium', timestamp: new Date() },
    { id: 2, lat: 13.0827, lng: 80.2707, wasteType: 'hazardous', description: 'Leaking battery disposal in the alley.', status: 'In Progress', severity: 'High', timestamp: new Date() },
    { id: 3, lat: 19.0760, lng: 72.8777, wasteType: 'organic', description: 'Rotting food waste overflow.', status: 'Resolved', severity: 'Low', timestamp: new Date() },
  ];

  let marketItems = [
    { id: "MKT-001", type: "Plastic Flakes", quantity: "500kg", price: 1200, seller: "OceanClean Co.", category: "Recyclables", image: "https://picsum.photos/seed/plastic/400/400" },
    { id: "MKT-002", type: "Aluminum Ingots", quantity: "200kg", price: 3500, seller: "MetalRecycle Ltd.", category: "Materials", image: "https://picsum.photos/seed/metal/400/400" },
    { id: "MKT-003", type: "Crushed Glass", quantity: "1000kg", price: 800, seller: "GlassWorks", category: "Recyclables", image: "https://picsum.photos/seed/glass/400/400" },
    { id: "MKT-004", type: "Recycled Paper Pulp", quantity: "300kg", price: 1500, seller: "EcoPaper", category: "Materials", image: "https://picsum.photos/seed/paper/400/400" },
  ];

  const pollutionHotspots = [
    { 
      id: 1, 
      lat: 12.9716, 
      lng: 77.5946, 
      intensity: 0.82, 
      type: 'Plastic Patch', 
      area: '245 sq km', 
      lastUpdated: new Date(),
      spectralData: [45, 52, 68, 85, 42, 30], // Mock spectral signature
      confidence: 0.94,
      depth: '0-2m'
    },
    { 
      id: 2, 
      lat: 13.0827, 
      lng: 80.2707, 
      intensity: 0.65, 
      type: 'Oil Spill', 
      area: '118 sq km', 
      lastUpdated: new Date(),
      spectralData: [12, 18, 25, 40, 88, 95],
      confidence: 0.88,
      depth: 'Surface'
    },
    { 
      id: 3, 
      lat: 19.0760, 
      lng: 72.8777, 
      intensity: 0.91, 
      type: 'Microplastic Concentration', 
      area: '512 sq km', 
      lastUpdated: new Date(),
      spectralData: [60, 65, 70, 75, 55, 45],
      confidence: 0.91,
      depth: '0-5m'
    },
  ];

  let trucks = [
    { id: 'TRUCK-01', status: 'Standby', battery: 92, lastUpdated: Date.now(), assignedRoute: null },
    { id: 'TRUCK-02', status: 'Charging', battery: 14, lastUpdated: Date.now(), assignedRoute: null },
    { id: 'TRUCK-03', status: 'Standby', battery: 85, lastUpdated: Date.now(), assignedRoute: null },
    { id: 'TRUCK-04', status: 'Standby', battery: 78, lastUpdated: Date.now(), assignedRoute: null },
    { id: 'TRUCK-05', status: 'Maintenance', battery: 45, lastUpdated: Date.now(), assignedRoute: null },
    { id: 'TRUCK-06', status: 'Standby', battery: 99, lastUpdated: Date.now(), assignedRoute: null },
    { id: 'TRUCK-07', status: 'Charging', battery: 8, lastUpdated: Date.now(), assignedRoute: null },
  ];

  // Simulation Loop: Update bin levels every 15 seconds
  setInterval(() => {
    bins = bins.map(bin => {
      const increment = Math.floor(Math.random() * 5); // Random increase 0-5%
      const newLevel = Math.min(100, bin.fillLevel + increment);
      return {
        ...bin,
        fillLevel: newLevel,
        status: newLevel >= 90 ? "full" : (newLevel >= 75 ? "critical" : "active"),
        lastUpdated: Date.now()
      };
    });
    console.log("Bins simulated update completed");
  }, 15000);

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "OceanMind+ Backend Operational" });
  });

  // Smart Bin Endpoints
  app.get("/api/bins", (req, res) => {
    res.json(bins);
  });

  app.post("/api/bins", (req, res) => {
    const { id, location, wasteType } = req.body;
    if (!id || !location || !wasteType) {
      return res.status(400).json({ error: "Missing required bin fields" });
    }
    
    // Check for duplicates
    if (bins.some(b => b.id === id)) {
      return res.status(409).json({ error: "Bin ID already exists" });
    }

    const newBin = {
      id,
      location,
      lat: req.body.lat || Number((12.9 + Math.random() * 0.2).toFixed(4)),
      lng: req.body.lng || Number((77.5 + Math.random() * 0.2).toFixed(4)),
      fillLevel: 0,
      wasteType,
      battery: 100,
      status: "active",
      lastUpdated: Date.now()
    };
    
    bins.push(newBin);
    res.status(201).json({ success: true, bin: newBin });
  });

  app.delete("/api/bins/:id", (req, res) => {
    const binId = req.params.id;
    const initialLength = bins.length;
    bins = bins.filter(b => b.id !== binId);
    
    if (bins.length === initialLength) {
      return res.status(404).json({ error: "Bin not found" });
    }
    
    res.json({ success: true, message: `Bin ${binId} deleted successfully` });
  });

  // Fleet Endpoints
  app.get("/api/trucks", (req, res) => {
    res.json(trucks);
  });

  app.post("/api/trucks", (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "Truck ID is required" });
    
    if (trucks.some(t => t.id === id)) {
      return res.status(409).json({ error: "Truck ID already exists" });
    }

    const newTruck = { 
      id, 
      status: 'Standby', 
      battery: 100, 
      lastUpdated: Date.now(),
      assignedRoute: null
    };
    trucks.push(newTruck);
    res.status(201).json(newTruck);
  });

  app.delete("/api/trucks/:id", (req, res) => {
    const { id } = req.params;
    const initialLength = trucks.length;
    trucks = trucks.filter(t => t.id !== id);
    if (trucks.length === initialLength) return res.status(404).json({ error: "Truck not found" });
    res.json({ success: true, message: `Truck ${id} decommissioned` });
  });

  app.post("/api/assign-route", (req, res) => {
    const { truckId, route } = req.body;
    const truckIndex = trucks.findIndex(t => t.id === truckId);
    
    if (truckIndex === -1) return res.status(404).json({ error: "Truck not found" });
    
    trucks[truckIndex] = {
      ...trucks[truckIndex],
      status: route ? 'En-Route' : 'Standby',
      assignedRoute: route,
      lastUpdated: Date.now()
    };
    
    res.json(trucks[truckIndex]);
  });

  // Blockchain Endpoints
  app.get("/api/blockchain/transactions", (req, res) => {
    // Return sorted by recent first
    res.json(blockchainTransactions.sort((a, b) => b.timestamp - a.timestamp));
  });

  app.post("/api/blockchain/add", (req, res) => {
    const { user, binId, wasteType, weight } = req.body;
    const newTx = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      user: user || "0xUNK...NOWN",
      binId: binId || "BIN-XXX",
      wasteType: wasteType || "mixed",
      weight: weight || 0,
      status: "Disposed",
      timestamp: Date.now(),
      verified: false
    };
    blockchainTransactions.push(newTx);
    res.status(201).json(newTx);
  });

  // --- Routing Logic ---
  function findOptimizedRoute() {
    // 1. Identify bins that need collection (fillLevel > 70%)
    const binsToCollect = bins.filter(b => b.fillLevel > 70);

    const depot = { id: 'Depot', lat: 12.9716, lng: 77.5946, location: 'Central Hub' };

    if (binsToCollect.length === 0) {
      return { 
        route: [depot], 
        totalDistance: 0, 
        binsCount: 0, 
        timestamp: Date.now(), 
        message: "No collection needed" 
      };
    }

    // 2. Compute dynamic sequence using Dijkstra optimization
    const waypoints = binsToCollect.map(b => ({ id: b.id, lat: Number(b.lat), lng: Number(b.lng), location: b.location }));
    const optimizedSequence = routingService.optimizeDijkstraSequence(depot, waypoints);

    return {
      route: optimizedSequence.route, // This now returns Waypoint[] instead of string[]
      totalDistance: optimizedSequence.totalDistance,
      binsCount: binsToCollect.length,
      timestamp: Date.now()
    };
  }

  app.get("/api/routes", (req, res) => {
    const optimizedData = findOptimizedRoute();
    res.json(optimizedData);
  });

  app.post("/api/bins/update", (req, res) => {
    const { id, fillLevel, status } = req.body;
    const binIndex = bins.findIndex(b => b.id === id);
    if (binIndex !== -1) {
      bins[binIndex] = { 
        ...bins[binIndex], 
        fillLevel: fillLevel ?? bins[binIndex].fillLevel,
        status: status ?? bins[binIndex].status,
        lastUpdated: Date.now()
      };
      res.json({ success: true, bin: bins[binIndex] });
    } else {
      res.status(404).json({ error: "Bin not found" });
    }
  });

  // --- Gamification Logic ---

  // Community Leaderboard Endpoint (Real MongoDB)
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const topUsers = await User.find({})
        .sort({ points: -1 })
        .limit(10)
        .lean();

      const formattedLeaderboard = topUsers.map((u, i) => ({
        id: u.uid || u._id.toString(),
        name: u.email.split('@')[0], // Use email prefix as display name
        points: u.points,
        rank: i + 1,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`
      }));

      res.json(formattedLeaderboard);
    } catch (err) {
      console.error("Leaderboard fetch failed:", err);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Daily Snapshot Aggregator
  const captureDailySnapshot = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const existing = await Snapshot.findOne({ date: today });
      if (existing) return;

      const userStats = await User.aggregate([
        { $group: { _id: null, totalImpact: { $sum: "$impact" }, totalPoints: { $sum: "$points" }, count: { $sum: 1 } } }
      ]);

      const stats = userStats[0] || { totalImpact: 0, totalPoints: 0, count: 0 };

      await Snapshot.create({
        date: today,
        totalWaste: stats.totalImpact,
        totalRecycled: stats.totalPoints * 0.4, // Estimation of recycled material
        activeGuardians: stats.count
      });
      console.log("📈 Captured daily analytics snapshot");
    } catch (err) {
      console.error("Snapshot capture failed:", err);
    }
  };

  // Pre-seed some snapshots if empty (Simulation)
  const seedSnapshots = async () => {
    const count = await Snapshot.countDocuments();
    if (count === 0) {
      console.log("🌱 Seeding initial analytics snapshots...");
      const history = [];
      const now = new Date();
      for (let i = 7; i > 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setHours(0,0,0,0);
        history.push({
          date: d,
          totalWaste: 45000 + (Math.random() * 5000) - (i * 2000),
          totalRecycled: 28000 + (Math.random() * 3000) - (i * 1000),
          activeGuardians: 120 + Math.floor(Math.random() * 20) - i
        });
      }
      await Snapshot.insertMany(history);
    }
  };
  seedSnapshots();

  // Dashboard Stats API (Real Aggregation)
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      await captureDailySnapshot(); // Ensure today is logged

      const [userStats, snapshots, hotspotCount] = await Promise.all([
        User.aggregate([{ $group: { _id: null, totalImpact: { $sum: "$impact" }, count: { $sum: 1 } } }]),
        Snapshot.find().sort({ date: -1 }).limit(7),
        Report.countDocuments({ severity: 'High', status: { $ne: 'Resolved' } })
      ]);

      const stats = userStats[0] || { totalImpact: 0, count: 0 };
      const weeklyData = snapshots.reverse().map(s => ({
        name: format(s.date, 'eee'),
        waste: s.totalWaste,
        recycled: s.totalRecycled
      }));

      const composition = [
        { name: 'Plastic', value: 45 },
        { name: 'Organic', value: 30 },
        { name: 'Paper', value: 15 },
        { name: 'Metal', value: 10 },
      ];

      res.json({
        summary: {
          totalWaste: `${stats.totalImpact.toFixed(0)} kg`,
          recyclingRate: `72%`,
          activeGuardians: stats.count.toString(),
          pollutionHotspots: hotspotCount.toString()
        },
        weeklyData,
        composition
      });
    } catch (err) {
      console.error("Stats aggregation failed:", err);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  const incrementUserPoints = async (amount: number, impactAmount: number = 0, userId?: string, userEmail?: string) => {
    // 1. Update Mock Leaderboard (for legacy UI support)
    const userIndex = leaderboard.findIndex(u => u.name === "Harshith G." || String(u.id) === userId);
    if (userIndex !== -1) {
      leaderboard[userIndex].points += amount;
      leaderboard = leaderboard
        .sort((a, b) => b.points - a.points)
        .map((u, i) => ({ ...u, rank: i + 1 }));
    }

    // 2. Persist to MongoDB (Linked by Firebase UID)
    if (!userId) return;
    
    try {
      const user = await User.findOneAndUpdate(
        { uid: userId }, 
        { 
          $inc: { points: amount, impact: impactAmount },
          $setOnInsert: { email: userEmail || "anonymous@oceanmind.plus", password: "firebase_authenticated", role: "user", rank: "Ocean Guardian" } 
        },
        { upsert: true, new: true }
      );
      console.log(`✅ Awarded ${amount} pts to user ${userId}. Total: ${user?.points}`);
    } catch (err) {
      console.error("❌ Failed to update user rewards in MongoDB:", err);
    }
  };

  // Profile Stats Endpoint
  app.get("/api/user/profile", async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.json({ 
        points: 0, 
        impact: 0, 
        rank: "Citizen", 
        level: 1 
      });
    }

    try {
      const user = await User.findOne({ uid: userId });
      if (!user) {
        return res.json({ 
          points: 0, 
          impact: 0, 
          rank: "Citizen", 
          level: 1 
        });
      }
      res.json({
        points: user.points,
        impact: user.impact,
        rank: user.rank,
        level: Math.floor(user.points / 200) + 1 
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });


  // Mock AI Scan Endpoint (Registry)
  app.post("/api/scan", async (req, res) => {
    const { image, metadata } = req.body;
    console.log("Received waste scan request");
    
    await incrementUserPoints(5, 0.5, req.headers['x-user-id'] as string, req.headers['x-user-email'] as string); 

    // In a real scenario, this might interface with a specialized model or log to DB
    // For now, we acknowledge the scan and return metadata
    res.json({ 
      success: true, 
      timestamp: Date.now(),
      scanId: `SCAN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    });
  });

  // --- Blockchain Logic ---

  app.get("/api/blockchain/transactions", (req, res) => {
    res.json(blockchainTransactions);
  });

  app.post("/api/blockchain/add", async (req, res) => {
    const { user, binId, wasteType, weight } = req.body;
    
    await incrementUserPoints(20, Number(weight) || 1.0, req.headers['x-user-id'] as string, req.headers['x-user-email'] as string); 

    const newTx = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      user: user || "0xAnonymous",
      binId,
      wasteType,
      weight: weight || 0,
      status: "Disposed",
      timestamp: Date.now(),
      verified: false
    };
    blockchainTransactions.unshift(newTx);
    res.json({ success: true, transaction: newTx });
  });

  // Mock Blockchain API

app.get('/api/ocean/hotspots', (req, res) => {
  res.json(pollutionHotspots);
});

app.get('/api/ocean/pollution', (req, res) => {
  // Providing the requested endpoint for ocean monitoring
  res.json({
    hotspots: pollutionHotspots,
    summary: {
      totalAreaAffected: "870 sq km",
      activeOilSpills: 1,
      plasticDensityAvg: "0.75 mg/L",
      lastSatelliteSync: new Date()
    }
  });
});

app.post('/api/ocean/analyze', async (req, res) => {
  const { imageUrl } = req.body;
  
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ GEMINI_API_KEY is missing. Ocean analysis skipped.");
      return res.status(500).json({ error: "AI analysis is currently unavailable (API key missing)" });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageUrl.split(',')[1]
              }
            },
            {
              text: "Scan this satellite image for ocean pollution. Identify type (plastic, oil, chemical), area, and severity. Return JSON: { type, area, severity, description }"
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    res.json(JSON.parse(response.text || '{}'));
  } catch (error) {
    console.error("Ocean analysis error:", error);
    res.status(500).json({ error: "Analysis failed" });
  }
});

  // --- Crowd Waste Reporting ---

  // --- Crowd Reporting API (Real MongoDB) ---

  app.get("/api/reports", async (req, res) => {
    try {
      const reports = await Report.find().sort({ timestamp: -1 }).limit(50);
      res.json(reports);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  app.post("/api/report", async (req, res) => {
    const uid = req.headers['x-user-id'] as string || "anonymous";
    const { lat, lng, description, image } = req.body;
    
    try {
      // Basic AI logic for report (could use Gemini here too)
      const wasteType = ['plastic', 'organic', 'hazardous'][Math.floor(Math.random() * 3)];
      const severity = Math.random() > 0.7 ? 'High' : 'Medium';
      
      const newReport = await Report.create({
        lat,
        lng,
        wasteType,
        description,
        severity,
        status: 'Pending',
        uid
      });
      
      await incrementUserPoints(10, 2.0, uid, req.headers['x-user-email'] as string); 
      console.log(`✅ Logged new report in MongoDB from user ${uid}`);
      res.json(newReport);
    } catch (err) {
      console.error("Report creation failed:", err);
      res.status(500).json({ error: "Failed to save report" });
    }
  });

app.post('/api/reports/add', (req, res) => {
  // Legacy support
  const { lat, lng, wasteType, description, severity } = req.body;
  const newReport = {
    id: crowdReports.length + 1,
    lat,
    lng,
    wasteType,
    description,
    status: 'Pending',
    severity: severity || 'Medium',
    timestamp: new Date()
  };
  crowdReports.unshift(newReport);
  res.json(newReport);
});

  // --- Marketplace Logic ---

app.get("/api/market/all", (req, res) => {
  res.json(marketItems);
});

app.post("/api/market/add", (req, res) => {
  const { type, quantity, price, seller, category } = req.body;
  const newItem = {
    id: `MKT-${Math.floor(1000 + Math.random() * 9000)}`,
    type,
    quantity,
    price: Number(price),
    seller: seller || "Anonymous Guardian",
    category: category || "Recyclables",
    image: `https://picsum.photos/seed/${type.toLowerCase().replace(/\s+/g, '-')}/400/400`
  };
  marketItems.unshift(newItem);
  res.json({ success: true, item: newItem });
});

// --- AI Prediction Engine (ML Integration) ---
app.get('/api/predict', async (req, res) => {
  try {
    // 1. Collect live data from current mock state
    const reportCount = crowdReports.length;
    
    // Extrapolate a mock temperature from environmental module, or default to 25
    const envData = getEnvironmentalData();
    const currentTemp = envData.weather.temp || 25.0;
    
    // Time features
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    
    // Current baseline waste calculation (heuristic derived strictly from data)
    // Same formula as in python baseline training for consistency in calculation baseline comparison
    const currentWaste = 50.0 + (reportCount * 0.8) + (currentTemp * 1.5);

    // 2. Fetch ML Prediction from FastAPI Service
    const mlRequestData = {
      reports: reportCount,
      temp: currentTemp,
      day: currentDay,
      hour: currentHour
    };

    const mlResponse = await fetch("http://localhost:8000/predict-waste", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mlRequestData)
    });

    if (!mlResponse.ok) {
        throw new Error(`ML Engine Error: ${mlResponse.status} ${mlResponse.statusText}`);
    }

    const mlResult = await mlResponse.json();
    const predictedWaste = mlResult.prediction;

    // 3. Convert prediction to a percentage increase from the baseline
    let increase = ((predictedWaste - currentWaste) / currentWaste) * 100;
    // Cap or floor it sensibly
    if (increase < -50) increase = -50;
    
    // 4. Determine Dynamic Risk Zones and Alerts based on the prediction
    const riskZones = [];
    const alerts = [];
    
    if (increase > 20) {
      riskZones.push({ lat: 12.9716, lng: 77.5946, severity: 'high', reason: 'High likelihood of waste overflow predicted by ML model due to current trends.' });
      alerts.push({ title: 'Critical Waste Surge', message: `Model predicts a severe ${increase.toFixed(1)}% surge in waste over the next 24h. Dispatch extra teams.`, severity: 'high' });
    } else if (increase > 5) {
      riskZones.push({ lat: 13.0827, lng: 80.2707, severity: 'medium', reason: 'Moderate increase in waste volume anticipated based on time and environmental factors.' });
      alerts.push({ title: 'Elevated Waste Output', message: `A ${increase.toFixed(1)}% elevation in regular waste collection needs expected.`, severity: 'medium' });
    } else {
      riskZones.push({ lat: 19.0760, lng: 72.8777, severity: 'low', reason: 'Normal operations predicted. No unusual surge.' });
      alerts.push({ title: 'Stable Waste Forecast', message: 'Waste generation is trending at normal or reduced levels.', severity: 'low' });
    }

    res.json({
      predictedIncrease: Number(increase.toFixed(1)),
      riskZones,
      alerts
    });
    
  } catch (error) {
    console.error("Prediction integration error:", error);
    // Silent fallback to avoid breaking UI explicitly if Python is down
    res.json({
      predictedIncrease: 5.5,
      riskZones: [{ lat: 12.9716, lng: 77.5946, severity: 'medium', reason: 'Fallback risk zone prediction.' }],
      alerts: [{ title: 'ML Engine Unavailable', message: 'Using historical fallback estimates due to ML service timeout.', severity: 'medium' }]
    });
  }
});

// --- High-Risk Zone Detection Engine ---
app.get('/api/risk-zones', getRiskZones(() => ({
  bins,
  reports: crowdReports,
  pollution: pollutionHotspots
})));

// --- Environmental Data Module ---
const getEnvironmentalData = () => {
  return {
    weather: {
      temp: 24.5,
      humidity: 65,
      windSpeed: 12.4,
      condition: 'Stormy', // Changed to trigger alert
      uvIndex: 6
    },
    ocean: {
      seaLevel: '+0.12m',
      surfaceTemp: '22.8°C',
      waveHeight: '1.2m',
      salinity: '35.2 PSU'
    },
    chlorophyll: {
      concentration: '0.92 mg/m³', // Changed to trigger alert (> 0.8)
      trend: 'increasing',
      status: 'High'
    },
    methane: {
      concentration: '1950 ppb', // Changed to trigger alert (> 1900)
      anomaly: '+60 ppb',
      status: 'Critical'
    }
  };
};

app.get('/api/environment', (req, res) => {
  const data = getEnvironmentalData();
  const alerts = generateAlerts(data);
  res.json({ ...data, alerts });
});

const generateAlerts = (data: any) => {
  const alerts = [];
  
  // Rule: High methane -> Gas alert
  const methaneVal = parseInt(data.methane.concentration);
  if (methaneVal > 1900) {
    alerts.push({
      id: 'alert-methane',
      type: 'Gas Alert',
      severity: 'High',
      message: `Critical methane levels detected (${data.methane.concentration}). Potential leak in sector 7G.`,
      timestamp: new Date()
    });
  }

  // Rule: High chlorophyll -> Algal bloom
  const chloroVal = parseFloat(data.chlorophyll.concentration);
  if (chloroVal > 0.8) {
    alerts.push({
      id: 'alert-chloro',
      type: 'Algal Bloom',
      severity: 'Medium',
      message: `High chlorophyll concentration (${data.chlorophyll.concentration}) indicates a potential algal bloom in coastal zones.`,
      timestamp: new Date()
    });
  }

  // Rule: Storm -> Weather alert
  if (data.weather.condition.toLowerCase().includes('storm') || data.weather.condition.toLowerCase().includes('rain')) {
    alerts.push({
      id: 'alert-weather',
      type: 'Weather Alert',
      severity: 'High',
      message: `Severe ${data.weather.condition} warning. High winds and heavy precipitation expected.`,
      timestamp: new Date()
    });
  }

  return alerts;
};

app.get('/api/alerts', (req, res) => {
  const data = getEnvironmentalData();
  const alerts = generateAlerts(data);
  res.json(alerts);
});

// --- Resend Email Endpoints ---

app.post('/api/auth/send-verification', async (req, res) => {
  const { email, name, uid } = req.body;
  
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    // In a real app, this link would point to your frontend verification handler
    const verificationLink = `${process.env.APP_URL || 'http://localhost:3000'}/verify?uid=${uid}`;
    
    const { data, error } = await resend.emails.send({
      from: 'OceanMind+ <onboarding@resend.dev>',
      to: [email],
      subject: 'Welcome to OceanMind+ | Verify Your Email',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #2563eb; padding: 24px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">OceanMind+</h1>
          </div>
          <div style="padding: 32px; color: #1e293b; line-height: 1.6;">
            <h2 style="margin-top: 0;">Welcome, ${name || 'Guardian'}!</h2>
            <p>Thank you for joining our mission to save the oceans. To complete your registration and start contributing, please verify your email address.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verificationLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Verify Email Address</a>
            </div>
            <p style="font-size: 14px; color: #64748b;">If the button above doesn't work, copy and paste this link: <br/> ${verificationLink}</p>
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
            <p style="font-size: 12px; color: #94a3b8; text-align: center;">© 2026 OceanMind+ Team. Towards a cleaner ocean.</p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error("Resend Error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, data });
  } catch (err: any) {
    console.error("Server Resend Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/api/send-email', async (req, res) => {
  const { to, subject, body, html } = req.body;
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'OceanMind+ Alerts <alerts@resend.dev>',
      to: typeof to === 'string' ? [to] : to,
      subject: subject || 'OceanMind+ Notification',
      html: html || `<p>${body}</p>`
    });

    if (error) return res.status(500).json({ error });
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});



  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      // If the request is for an API but hasn't been handled, return a JSON 404, not HTML
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: "API endpoint not found", path: req.path });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  appInstance = app;
  return app;
}

// Development server startup
if (process.env.NODE_ENV !== "production") {
  const PORT = Number(process.env.PORT) || 3000;
  setupApp().then(app => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`OceanMind+ Local Server running on http://localhost:${PORT}`);
    });
  });
}
