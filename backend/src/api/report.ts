import { Router, Request, Response } from 'express';
import multer from 'multer';
import { ReportParser } from '../services/report/ReportParser';
import { extractHealthMetrics } from '../services/report/HealthMetricExtractor';
import { AIProviderFactory } from '../services/ai/AIProviderFactory';
import { SafetyEngine } from '../services/safety/SafetyEngine';

const router = Router();

// Configure in-memory upload (no permanent storage on disk for privacy)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'text/plain',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(pdf|txt|csv|png|jpg|jpeg)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Please upload PDF, PNG, JPG, or TXT.'));
    }
  },
});

router.post('/analyze', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    let reportText = '';
    let fileName = 'Direct Input Report';

    if (req.file) {
      fileName = req.file.originalname;
      reportText = await ReportParser.extractText(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname
      );
    } else if (req.body.text && typeof req.body.text === 'string') {
      reportText = req.body.text.trim();
      fileName = req.body.fileName || 'Pasted Medical Text';
    } else {
      res.status(400).json({
        error: 'Please upload a medical report file (PDF, Image, TXT) or paste report text.',
      });
      return;
    }

    if (!reportText || reportText.trim().length < 10) {
      res.status(400).json({
        error: 'Could not extract sufficient text from the uploaded document. Please check the file or paste the text directly.',
      });
      return;
    }

    const providerName = req.body.provider;
    const aiProvider = AIProviderFactory.getProvider(providerName);
    const analysis = await aiProvider.analyzeMedicalReport(reportText, fileName);

    res.json({
      ...analysis,
      healthMetrics: extractHealthMetrics(analysis),
    });
  } catch (err: any) {
    console.error('Report analysis error:', err);
    res.status(500).json({
      error: err.message || 'Failed to analyze medical report. Please try again.',
      disclaimer: SafetyEngine.MANDATORY_DISCLAIMER,
    });
  }
});

export default router;
