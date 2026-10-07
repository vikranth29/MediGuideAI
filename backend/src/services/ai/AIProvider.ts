import { ChatMessage, ChatResponse, ImageAnalysisResponse, ReportAnalysisResponse } from '../../types';

export interface AIProvider {
  readonly name: string;
  isConfigured(): boolean;
  
  generateChatResponse(
    messages: ChatMessage[],
    userQuery: string
  ): Promise<ChatResponse>;

  analyzeMedicalReport(
    reportText: string,
    fileName?: string
  ): Promise<ReportAnalysisResponse>;

  analyzeMedicalImage(
    imageBase64: string,
    mimeType: string,
    prompt?: string
  ): Promise<ImageAnalysisResponse>;
}
