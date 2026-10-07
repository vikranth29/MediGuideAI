import { Router, Request, Response } from 'express';
import { HospitalService } from '../services/hospital/HospitalService';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const lat = req.query.latitude ? parseFloat(req.query.latitude as string) : undefined;
    const lng = req.query.longitude ? parseFloat(req.query.longitude as string) : undefined;
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 15;
    const query = req.query.query ? (req.query.query as string) : undefined;
    const type = req.query.type ? (req.query.type as string) : undefined;

    const results = await HospitalService.searchHospitals({
      latitude: isNaN(lat as number) ? undefined : lat,
      longitude: isNaN(lng as number) ? undefined : lng,
      radiusKm: isNaN(radius) ? 15 : radius,
      query,
      type,
    });

    res.json(results);
  } catch (err: any) {
    console.error('Hospitals endpoint error:', err);
    res.status(500).json({
      error: 'Failed to search nearby medical facilities.',
      hospitals: [],
    });
  }
});

export default router;
