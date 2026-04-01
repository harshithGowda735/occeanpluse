// src/backend/services/routingService.ts

export interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  location?: string;
}

// Calculate straight-line distance (Haversine formula) in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const p = 0.017453292519943295; // Math.PI / 180
  const c = Math.cos;
  const a = 0.5 - c((lat2 - lat1) * p)/2 + 
            c(lat1 * p) * c(lat2 * p) * 
            (1 - c((lon2 - lon1) * p))/2;
  return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}

export class RoutingService {
  /**
   * Applies a greedy sequence optimization (Dijkstra-inspired for TSP) to find 
   * the shortest connected path across all targeted bins.
   */
  public optimizeDijkstraSequence(depot: Waypoint, binsToVisit: Waypoint[]): { route: Waypoint[], totalDistance: number } {
    if (binsToVisit.length === 0) {
      return { route: [depot], totalDistance: 0 };
    }

    const unvisited = [...binsToVisit];
    const route: Waypoint[] = [depot];
    let current = depot;
    let totalDist = 0;

    // Identify the shortest path to each unvisited bin sequentially
    while (unvisited.length > 0) {
      let minDistance = Infinity;
      let nearestIdx = -1;

      for (let i = 0; i < unvisited.length; i++) {
        const dist = calculateDistance(current.lat, current.lng, unvisited[i].lat, unvisited[i].lng);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      }

      totalDist += minDistance;
      current = unvisited[nearestIdx];
      route.push(current);
      unvisited.splice(nearestIdx, 1);
    }
    
    // Completing the loop back to the depot
    const returnDist = calculateDistance(current.lat, current.lng, depot.lat, depot.lng);
    totalDist += returnDist;
    route.push(depot);

    return { 
      route, 
      totalDistance: Number(totalDist.toFixed(2)) 
    };
  }
}
