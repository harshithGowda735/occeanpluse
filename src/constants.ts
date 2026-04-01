import { 
  LayoutDashboard, 
  Camera, 
  Trash2, 
  MapPin, 
  ShieldCheck, 
  Waves, 
  AlertTriangle, 
  Trophy, 
  ShoppingBag,
  Brain,
  Star,
  Globe,
  Bell,
  Map as MapIcon
} from 'lucide-react';

export const MODULES = [
  { id: 'dashboard', name: 'Analytics', icon: LayoutDashboard },
  { id: 'map', name: 'Ocean Map', icon: MapIcon },
  { id: 'predictions', name: 'AI Predictions', icon: Brain },
  { id: 'alerts', name: 'Alert Center', icon: Bell },
  { id: 'gamification', name: 'Leaderboard', icon: Star },
  { id: 'environment', name: 'Environment', icon: Globe },
  { id: 'scanner', name: 'AI Scanner', icon: Camera },
  { id: 'bins', name: 'IoT Bins', icon: Trash2 },
  { id: 'routing', name: 'Routing', icon: MapPin },
  { id: 'blockchain', name: 'Tracking', icon: ShieldCheck },
  { id: 'pollution', name: 'Ocean Monitor', icon: Waves },
  { id: 'reports', name: 'Crowd Report', icon: AlertTriangle },
  { id: 'rewards', name: 'Rewards', icon: Trophy },
  { id: 'marketplace', name: 'Marketplace', icon: ShoppingBag },
];

export const WASTE_TYPES = [
  { id: 'plastic', label: 'Plastic', color: '#3b82f6' },
  { id: 'metal', label: 'Metal', color: '#64748b' },
  { id: 'paper', label: 'Paper', color: '#f59e0b' },
  { id: 'organic', label: 'Organic', color: '#10b981' },
  { id: 'glass', label: 'Glass', color: '#06b6d4' },
  { id: 'other', label: 'Other', color: '#94a3b8' },
];
