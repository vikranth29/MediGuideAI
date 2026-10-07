import axios from 'axios';
import { AIProvider } from './AIProvider';
import { ChatMessage, ChatResponse, ImageAnalysisResponse, ReportAnalysisResponse } from '../../types';
import { SafetyEngine } from '../safety/SafetyEngine';
import { FallbackProvider } from './FallbackProvider';

export class OpenAIProvider implements AIProvider {
  readonly name = 'OpenAI (GPT-4o)';
  private apiKey: string;
  private modelName: string;
  private fallback: FallbackProvider;

  constructor(apiKey: string, modelName: string = 'gpt-4o-mini') {
    this.apiKey = apiKey;
    this.modelName = modelName;
    this.fallback = new FallbackProvider();
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async generateChatResponse(
    messages: ChatMessage[],
    userQuery: string
  ): Promise<ChatResponse> {
    if (!this.isConfigured()) {
      return this.fallback.generateChatResponse(messages, userQuery);
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.modelName,
          messages: [
            { role: 'system', content: SafetyEngine.buildSystemPrompt() },
            ...messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: userQuery },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 25000,
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      const parsed = JSON.parse(content);
      return SafetyEngine.sanitizeAndValidateResponse(
        { ...parsed, provider: this.name },
        parsed.riskLevel || 'LOW'
      );
    } catch (err) {
      console.error('OpenAI generateChatResponse error, falling back:', err);
      return this.fallback.generateChatResponse(messages, userQuery);
    }
  }

  async analyzeMedicalReport(
    reportText: string,
    fileName?: string
  ): Promise<ReportAnalysisResponse> {
    if (!this.isConfigured()) {
      return this.fallback.analyzeMedicalReport(reportText, fileName);
    }

    try {
      const prompt = `Analyze this medical report text and provide an educational explanation in JSON format with summary, keyFindings, structuredFindings, riskFlags, recommendations, questionsForDoctor, disclaimer.`;
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.modelName,
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: reportText.slice(0, 7000) },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 25000,
        }
      );

      const parsed = JSON.parse(response.data?.choices?.[0]?.message?.content);
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
      console.error('OpenAI analyzeMedicalReport error, falling back:', err);
      return this.fallback.analyzeMedicalReport(reportText, fileName);
    }
  }

  async analyzeMedicalImage(
    imageBase64: string,
    mimeType: string,
    prompt?: string
  ): Promise<ImageAnalysisResponse> {
    if (!this.isConfigured()) {
      return this.fallback.analyzeMedicalImage(imageBase64, mimeType, prompt);
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analyze this medical image strictly for educational observation. Return JSON with summary, visualObservations, potentialConsiderations, questionsForDoctor, disclaimer.',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${imageBase64}`,
                  },
                },
              ],
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const parsed = JSON.parse(response.data?.choices?.[0]?.message?.content);
      return {
        summary: parsed.summary || 'Image visual observation complete.',
        visualObservations: parsed.visualObservations || [],
        potentialConsiderations: parsed.potentialConsiderations || [],
        questionsForDoctor: parsed.questionsForDoctor || [],
        disclaimer: 'I can provide general educational observations, but this image must be evaluated by a qualified healthcare professional.',
        riskLevel: 'LOW',
        provider: this.name,
      };
    } catch (err) {
      console.error('OpenAI image analysis error, falling back:', err);
      return this.fallback.analyzeMedicalImage(imageBase64, mimeType, prompt);
    }
  }
}
