// src/backend/controllers/riskZoneController.ts
import { Request, Response } from 'express';
import { RiskZoneService } from '../services/riskZoneService';

const riskZoneService = new RiskZoneService();

export const getRiskZones = (getDataContext: () => { bins: any[], reports: any[], pollution: any[] }) => {
  return (req: Request, res: Response) => {
    try {
      // 1. Fetch real-time data from internal memory context
      const { bins, reports, pollution } = getDataContext();

      // 2. Delegate to Service Layer for Complex Algorithm Processing
      const classifiedZones = riskZoneService.calculateZoneRisks(bins, reports, pollution);

      // 3. Optional: Integration Trigger Placeholder (e.g., dispatching events for high-risk zones)
      const highRiskZones = classifiedZones.filter(z => z.risk === 'high');
      if (highRiskZones.length > 0) {
         console.log(`[Alert System Triggered] High Risk Zones detected: ${highRiskZones.map(z => z.name).join(', ')}`);
         // Here we could trigger a websocket broadcast or an automated recommendation pipeline.
      }

      // 4. Return formatted data
      res.json({
        success: true,
        zones: classifiedZones
      });

    } catch (error) {
      console.error('Error fetching risk zones:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  };
};
