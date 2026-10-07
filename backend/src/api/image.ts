import { Router, Request, Response } from 'express';
import multer from 'multer';
import { AIProviderFactory } from '../services/ai/AIProviderFactory';
import { SafetyEngine } from '../services/safety/SafetyEngine';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, JPEG, PNG, WEBP) are allowed for image analysis.'));
    }
  },
});

router.post('/analyze', upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  try {
    let base64 = '';
    let mimeType = 'image/jpeg';
    const prompt = req.body.prompt || '';
    const providerName = req.body.provider;

    if (req.file) {
      base64 = req.file.buffer.toString('base64');
      mimeType = req.file.mimetype;
    } else if (req.body.imageBase64) {
      base64 = req.body.imageBase64.replace(/^data:image\/\w+;base64,/, '');
      mimeType = req.body.mimeType || 'image/jpeg';
    } else {
      res.status(400).json({ error: 'Please upload an image file or provide base64 image data.' });
      return;
    }

    const aiProvider = AIProviderFactory.getProvider(providerName);
    const analysis = await aiProvider.analyzeMedicalImage(base64, mimeType, prompt);

    res.json(analysis);
  } catch (err: any) {
    console.error('Image analysis API error:', err);
    res.status(500).json({
      error: err.message || 'Image analysis could not be completed.',
      disclaimer: 'I can provide general observations, but this image should be evaluated by a qualified healthcare professional.',
    });
  }
});

export default router;
