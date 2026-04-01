// src/backend/services/riskZoneService.ts

export interface ZoneData {
  name: string;
  lat: number;
  lng: number;
  radiusKm: number;
}

export interface ZoneRisk {
  name: string;
  lat: number;
  lng: number;
  risk: 'low' | 'medium' | 'high';
  score: number;
  factors: {
    avgBinFill: number;
    reportCount: number;
    pollutionLevel: number;
  };
}

// Distance utility (Haversine formula placeholder)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const p = 0.017453292519943295; // Math.PI / 180
  const c = Math.cos;
  const a = 0.5 - c((lat2 - lat1) * p)/2 + 
            c(lat1 * p) * c(lat2 * p) * 
            (1 - c((lon2 - lon1) * p))/2;
  return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}

export class RiskZoneService {
  private zones: ZoneData[] = [
    { name: "North Beach", lat: 12.9716, lng: 77.5946, radiusKm: 5 },
    { name: "Central Pier", lat: 13.0827, lng: 80.2707, radiusKm: 5 },
    { name: "South Marina", lat: 19.0760, lng: 72.8777, radiusKm: 5 },
    { name: "Sunset Blvd", lat: 15.2993, lng: 74.1240, radiusKm: 5 },
    { name: "Eco Park", lat: 22.5726, lng: 88.3639, radiusKm: 5 }
  ];

  public calculateZoneRisks(bins: any[], reports: any[], pollution: any[]): ZoneRisk[] {
    return this.zones.map(zone => {
      // 1. Waste Level Factor
      const zoneBins = bins.filter(b => b.location === zone.name);
      const avgBinFill = zoneBins.length > 0 
        ? zoneBins.reduce((acc, curr) => acc + curr.fillLevel, 0) / zoneBins.length 
        : 0;

      // 2. Crowd Reports Factor
      const zoneReports = reports.filter(r => {
        const dist = calculateDistance(zone.lat, zone.lng, r.lat, r.lng);
        return dist <= zone.radiusKm;
      });
      const reportCount = zoneReports.length;

      // 3. Pollution Factor
      const zonePollution = pollution.filter(p => {
        const dist = calculateDistance(zone.lat, zone.lng, p.lat, p.lng);
        return dist <= zone.radiusKm;
      });
      const avgPollution = zonePollution.length > 0
        ? zonePollution.reduce((acc, curr) => acc + curr.intensity, 0) / zonePollution.length
        : 0;

      // Scoring Algorithm
      // Weights: Bin Fill (40%), Reports (30%), Pollution (30%)
      const fillScore = (avgBinFill / 100) * 40;
      
      // Assume 5 reports is 'max' for the 30% weight cap
      const reportScore = Math.min((reportCount / 5) * 30, 30);
      
      // Pollution intensity is 0-1
      const pollutionScore = avgPollution * 30;

      const totalScore = Math.round(fillScore + reportScore + pollutionScore);

      // Classification
      let risk: 'high' | 'medium' | 'low' = 'low';
      if (totalScore >= 70) risk = 'high';
      else if (totalScore >= 40) risk = 'medium';

      return {
        name: zone.name,
        lat: zone.lat,
        lng: zone.lng,
        risk,
        score: totalScore,
        factors: { avgBinFill, reportCount, pollutionLevel: avgPollution }
      };
    });
  }
}
