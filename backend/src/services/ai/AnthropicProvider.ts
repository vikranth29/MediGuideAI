import axios from 'axios';
import { AIProvider } from './AIProvider';
import { ChatMessage, ChatResponse, ImageAnalysisResponse, ReportAnalysisResponse } from '../../types';
import { SafetyEngine } from '../safety/SafetyEngine';
import { FallbackProvider } from './FallbackProvider';

export class AnthropicProvider implements AIProvider {
  readonly name = 'Anthropic Claude';
  private apiKey: string;
  private modelName: string;
  private fallback: FallbackProvider;

  constructor(apiKey: string, modelName: string = 'claude-3-5-sonnet-20241022') {
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
        'https://api.anthropic.com/v1/messages',
        {
          model: this.modelName,
          max_tokens: 1500,
          system: SafetyEngine.buildSystemPrompt(),
          messages: [
            ...messages.slice(-6).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
            { role: 'user', content: userQuery },
          ],
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          timeout: 25000,
        }
      );

      const content = response.data?.content?.[0]?.text;
      const clean = content.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      const parsed = JSON.parse(clean);
      return SafetyEngine.sanitizeAndValidateResponse(
        { ...parsed, provider: this.name },
        parsed.riskLevel || 'LOW'
      );
    } catch (err) {
      console.error('Anthropic generateChatResponse error, falling back:', err);
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
      const prompt = `Analyze this medical report text and provide an educational explanation in JSON format with summary, keyFindings, structuredFindings, riskFlags, recommendations, questionsForDoctor, disclaimer.\n\nReport:\n${reportText.slice(0, 7000)}`;
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: this.modelName,
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          timeout: 25000,
        }
      );

      const content = response.data?.content?.[0]?.text;
      const clean = content.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      const parsed = JSON.parse(clean);
      return {
        summary: parsed.summary || 'Report analysis completed.',
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
      console.error('Anthropic analyzeMedicalReport error, falling back:', err);
      return this.fallback.analyzeMedicalReport(reportText, fileName);
    }
  }

  async analyzeMedicalImage(
    imageBase64: string,
    mimeType: string,
    prompt?: string
  ): Promise<ImageAnalysisResponse> {
    return this.fallback.analyzeMedicalImage(imageBase64, mimeType, prompt);
  }
}
