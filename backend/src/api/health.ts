import { Router, Request, Response } from 'express';
import { config } from '../config';

const router = Router();

router.get('/', (_req: Request, res: Response): void => {
  res.json({
    status: 'healthy',
    system: 'MediGuide AI Assistant Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    configuredProvider: config.aiProvider,
    supportedProviders: ['gemini', 'openai', 'anthropic', 'groq', 'fallback'],
    features: {
      emergencySafetyEngine: true,
      reportTextExtraction: true,
      medicalVisionAnalysis: true,
      liveHospitalLocator: true,
      zeroStoragePrivacyCompliance: true,
    },
  });
});

export default router;
