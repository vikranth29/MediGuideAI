import { Router, Request, Response } from 'express';
import { EmergencyDetector } from '../services/safety/EmergencyDetector';
import { SafetyEngine } from '../services/safety/SafetyEngine';
import { AIProviderFactory } from '../services/ai/AIProviderFactory';
import { ChatMessage } from '../types';

const router = Router();

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, messages, provider } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ error: 'Message field is required.' });
      return;
    }

    const userMessage = message.trim();
    const history: ChatMessage[] = Array.isArray(messages) ? messages : [];

    // 1. Instant Pre-flight Emergency Safety Interception
    const emergencyCheck = EmergencyDetector.check(userMessage);

    if (emergencyCheck.isEmergency) {
      const emergencyResponse = SafetyEngine.generateEmergencyBypassResponse(
        emergencyCheck.matchedCondition || 'Emergency Symptoms Detected',
        emergencyCheck.emergencyAction || 'Call emergency services immediately.',
        emergencyCheck.emergencyHelplines
      );
      res.json(emergencyResponse);
      return;
    }

    // 2. Resolve AI Provider
    const aiProvider = AIProviderFactory.getProvider(provider);

    // 3. Generate structured AI response
    const aiResult = await aiProvider.generateChatResponse(history, userMessage);

    // 4. Update risk level if moderate signs were identified
    if (emergencyCheck.riskLevel === 'MODERATE' && aiResult.riskLevel === 'LOW') {
      aiResult.riskLevel = 'MODERATE';
    }

    res.json(aiResult);
  } catch (err) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({
      error: 'An error occurred while processing your message. Please try again.',
      disclaimer: SafetyEngine.MANDATORY_DISCLAIMER,
    });
  }
});

export default router;
