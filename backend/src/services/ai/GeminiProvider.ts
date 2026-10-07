import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider } from './AIProvider';
import { ChatMessage, ChatResponse, ImageAnalysisResponse, ReportAnalysisResponse } from '../../types';
import { SafetyEngine } from '../safety/SafetyEngine';
import { FallbackProvider } from './FallbackProvider';

export class GeminiProvider implements AIProvider {
  readonly name = 'Google Gemini (Medical Optimized)';
  private genAI: GoogleGenerativeAI | null = null;
  private modelName: string;
  private fallback: FallbackProvider;

  constructor(apiKey: string, modelName: string = 'gemini-1.5-flash') {
    this.modelName = modelName;
    this.fallback = new FallbackProvider();
    if (apiKey && apiKey.trim().length > 0) {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
      } catch (err) {
        console.error('Failed to initialize Google Generative AI client:', err);
      }
    }
  }

  isConfigured(): boolean {
    return this.genAI !== null;
  }

  private cleanJsonBlock(raw: string): string {
    let clean = raw.trim();
    clean = clean.replace(/^```(?:json)?\s*/i, '');
    clean = clean.replace(/\s*```$/i, '');
    return clean.trim();
  }

  async generateChatResponse(
    messages: ChatMessage[],
    userQuery: string
  ): Promise<ChatResponse> {
    if (!this.isConfigured() || !this.genAI) {
      return this.fallback.generateChatResponse(messages, userQuery);
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
        },
      });

      const conversationHistory = messages
        .slice(-6)
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n');

      const prompt = `${SafetyEngine.buildSystemPrompt()}

Previous Context:
${conversationHistory || 'None'}

User Question:
${userQuery}

Respond strictly with valid JSON conforming to the requested schema.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleaned = this.cleanJsonBlock(text);
      
      try {
        const parsed = JSON.parse(cleaned);
        return SafetyEngine.sanitizeAndValidateResponse(
          { ...parsed, provider: this.name },
          parsed.riskLevel || 'LOW'
        );
      } catch (jsonErr) {
        // Return structured wrapper if raw text was returned
        return SafetyEngine.sanitizeAndValidateResponse(
          {
            summary: text.slice(0, 300),
            possibleExplanations: [text.slice(0, 500)],
            importantInformation: ['Please review with a physician.'],
            whenToSeeDoctor: ['If symptoms continue or escalate.'],
            provider: this.name,
          },
          'LOW'
        );
      }
    } catch (err) {
      console.error('Gemini generateChatResponse error, falling back:', err);
      return this.fallback.generateChatResponse(messages, userQuery);
    }
  }

  async analyzeMedicalReport(
    reportText: string,
    fileName?: string
  ): Promise<ReportAnalysisResponse> {
    if (!this.isConfigured() || !this.genAI) {
      return this.fallback.analyzeMedicalReport(reportText, fileName);
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: { temperature: 0.1 },
      });

      const prompt = `You are MediGuide AI, an expert medical report analysis assistant.
Analyze this medical report text and provide a patient-friendly, educational explanation.
DO NOT diagnose or prescribe medication.

Respond ONLY with valid JSON matching this schema:
{
  "summary": "2-3 sentence plain-language overview of the report.",
  "keyFindings": ["Finding 1", "Finding 2"],
  "structuredFindings": [
    {
      "metric": "Name of test/metric (e.g. Fasting Blood Glucose, Platelet Count)",
      "value": "Reported value with units if found",
      "status": "normal" | "abnormal" | "concerning" | "neutral",
      "explanation": "What this test means in plain English"
    }
  ],
  "riskFlags": ["Any out-of-range or notable flags (empty array if normal)"],
  "recommendations": ["Actionable educational steps (e.g. consult physician, lifestyle habits)"],
  "questionsForDoctor": ["3-5 specific questions the patient can ask their doctor about these results"],
  "disclaimer": "AI-generated educational summary — not a medical diagnosis."
}

Report Text:
"""
${reportText.slice(0, 7000)}
"""`;

      const result = await model.generateContent(prompt);
      const cleaned = this.cleanJsonBlock(result.response.text());
      const parsed = JSON.parse(cleaned);

      return {
        summary: parsed.summary || 'Medical report analysis completed.',
        keyFindings: parsed.keyFindings || [],
        structuredFindings: parsed.structuredFindings || [],
        riskFlags: parsed.riskFlags || [],
        recommendations: parsed.recommendations || [],
        questionsForDoctor: parsed.questionsForDoctor || [],
        disclaimer: 'AI-generated educational summary — not a medical diagnosis.',
        riskLevel: (parsed.riskFlags && parsed.riskFlags.length > 0) ? 'MODERATE' : 'LOW',
        fileName,
        extractedSnippet: reportText.slice(0, 300) + (reportText.length > 300 ? '...' : ''),
        provider: this.name,
      };
    } catch (err) {
      console.error('Gemini analyzeMedicalReport error, falling back:', err);
      return this.fallback.analyzeMedicalReport(reportText, fileName);
    }
  }

  async analyzeMedicalImage(
    imageBase64: string,
    mimeType: string,
    userPrompt?: string
  ): Promise<ImageAnalysisResponse> {
    if (!this.isConfigured() || !this.genAI) {
      return this.fallback.analyzeMedicalImage(imageBase64, mimeType, userPrompt);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });

      const prompt = `You are MediGuide AI medical vision assistant.
Analyze this medical image strictly for educational and preliminary informational review.
NEVER provide a definitive medical diagnosis.
Remind the user that clinical evaluation by a healthcare provider or dermatologist is essential.

Respond ONLY with valid JSON matching:
{
  "summary": "Objective, educational visual observation of the image.",
  "visualObservations": ["Observable pattern, color, texture, symmetry, or feature"],
  "potentialConsiderations": ["General clinical considerations or common dermatological/anatomical context"],
  "questionsForDoctor": ["2-3 specific questions for an in-person doctor or specialist"],
  "disclaimer": "I can provide general educational observations, but this image must be evaluated by a qualified healthcare professional."
}

User context: ${userPrompt || 'General medical image inspection'}`;

      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType || 'image/jpeg',
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const cleaned = this.cleanJsonBlock(result.response.text());
      const parsed = JSON.parse(cleaned);

      return {
        summary: parsed.summary || 'Educational visual observation complete.',
        visualObservations: parsed.visualObservations || [],
        potentialConsiderations: parsed.potentialConsiderations || [],
        questionsForDoctor: parsed.questionsForDoctor || [],
        disclaimer: 'I can provide general observations, but this image should be evaluated by a qualified healthcare professional.',
        riskLevel: 'LOW',
        provider: this.name,
      };
    } catch (err) {
      console.error('Gemini analyzeMedicalImage error, falling back:', err);
      return this.fallback.analyzeMedicalImage(imageBase64, mimeType, userPrompt);
    }
  }
}
