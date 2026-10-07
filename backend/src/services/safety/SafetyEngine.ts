import { ChatResponse, RiskLevel } from '../../types';
import { EmergencyDetector } from './EmergencyDetector';

export class SafetyEngine {
  public static readonly MANDATORY_DISCLAIMER =
    'MediGuide AI provides educational and informational support only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for medical concerns.';

  public static readonly EMERGENCY_PREFIX =
    '⚠️ EMERGENCY WARNING: Your symptoms may require urgent medical attention. Please contact your local emergency services (911 / 112 / 108) or visit the nearest emergency department immediately.';

  public static buildSystemPrompt(): string {
    return `You are MediGuide AI, an intelligent, empathetic, and responsible medical information assistant.

CRITICAL MEDICAL SAFETY RULES:
1. You are NOT a doctor and must NEVER claim to be one, nor formulate a definitive medical diagnosis.
2. NEVER prescribe medication dosages or encourage self-medication for unprescribed pharmaceuticals.
3. Use uncertainty-aware and educational phrasing: "These symptoms can sometimes be associated with...", "Possible considerations include...", "A healthcare professional might evaluate...".
4. When serious red-flags appear, immediately direct the user to emergency services or in-person urgent care.
5. Always provide structured, clear, and reassuring responses in plain language.

RESPONSE FORMAT REQUIREMENTS:
You MUST respond with valid JSON formatted strictly as follows (no markdown fences around the raw JSON string if possible, or standard JSON):
{
  "summary": "Clear, concise 1-2 sentence overview of the health topic or query.",
  "possibleExplanations": [
    "Educational explanation 1 without claiming certainty",
    "Educational explanation 2"
  ],
  "importantInformation": [
    "Key health, lifestyle, or supportive care context",
    "First aid or non-prescriptive symptom management"
  ],
  "whenToSeeDoctor": [
    "Specific warning sign or timeline to seek medical consultation"
  ],
  "emergencyWarning": "Include ONLY if high risk symptoms are detected, otherwise null",
  "disclaimer": "${this.MANDATORY_DISCLAIMER}"
}`;
  }

  public static sanitizeAndValidateResponse(
    rawResponse: Partial<ChatResponse>,
    riskLevel: RiskLevel
  ): ChatResponse {
    const summary = rawResponse.summary || 'Here is educational health information regarding your inquiry.';
    const possibleExplanations = Array.isArray(rawResponse.possibleExplanations) && rawResponse.possibleExplanations.length > 0
      ? rawResponse.possibleExplanations
      : ['Please consult a healthcare professional for specific clinical differential evaluations.'];
    const importantInformation = Array.isArray(rawResponse.importantInformation) && rawResponse.importantInformation.length > 0
      ? rawResponse.importantInformation
      : ['Rest, adequate hydration, and symptom monitoring are important general practices.'];
    const whenToSeeDoctor = Array.isArray(rawResponse.whenToSeeDoctor) && rawResponse.whenToSeeDoctor.length > 0
      ? rawResponse.whenToSeeDoctor
      : ['Consult a doctor if symptoms persist for more than 48-72 hours, worsen, or cause significant distress.'];

    let emergencyWarning = rawResponse.emergencyWarning;
    if (riskLevel === 'EMERGENCY') {
      emergencyWarning = this.EMERGENCY_PREFIX;
    }

    return {
      summary,
      possibleExplanations,
      importantInformation,
      whenToSeeDoctor,
      emergencyWarning: emergencyWarning || undefined,
      disclaimer: this.MANDATORY_DISCLAIMER,
      riskLevel,
      isEmergency: riskLevel === 'EMERGENCY',
      provider: rawResponse.provider || 'mediguide-safety-layer',
    };
  }

  public static generateEmergencyBypassResponse(condition: string, action: string, helplines?: string[]): ChatResponse {
    return {
      summary: `Urgent attention required: Symptoms matching "${condition}" were detected.`,
      possibleExplanations: [
        'These symptoms can indicate a time-sensitive medical situation requiring immediate clinical evaluation.',
        'Emergency clinicians have specialized diagnostic equipment and treatments that must not be delayed.',
      ],
      importantInformation: [
        action,
        'Do NOT attempt to drive yourself if you are feeling faint, dizzy, or experiencing severe pain.',
        helplines ? `Helplines: ${helplines.join(' | ')}` : 'Contact 911 / 112 / 108 immediately.',
      ],
      whenToSeeDoctor: [
        'IMMEDIATELY — Call emergency services or proceed to the nearest emergency department right now.',
      ],
      emergencyWarning: this.EMERGENCY_PREFIX,
      disclaimer: this.MANDATORY_DISCLAIMER,
      riskLevel: 'EMERGENCY',
      isEmergency: true,
      provider: 'safety-interceptor',
    };
  }
}
