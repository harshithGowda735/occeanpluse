export interface WasteReport {
  id: string;
  type: 'plastic' | 'metal' | 'paper' | 'organic' | 'glass' | 'other';
  location: { lat: number; lng: number };
  timestamp: number;
  status: 'pending' | 'collected' | 'verified';
  imageUrl?: string;
  reporterId: string;
}

export interface BinStatus {
  id: string;
  location: string;
  fillLevel: number; // 0-100
  lastEmptied: number;
  status: 'active' | 'full' | 'maintenance';
}

export interface Transaction {
  id: string;
  wasteId: string;
  from: string;
  to: string;
  timestamp: number;
  hash: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  points: number;
  rank: string;
  impact: number; // kg of waste diverted
}
