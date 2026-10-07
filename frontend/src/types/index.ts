export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'EMERGENCY';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  structuredResponse?: ChatResponse;
}

export interface ChatResponse {
  summary: string;
  possibleExplanations: string[];
  importantInformation: string[];
  whenToSeeDoctor: string[];
  emergencyWarning?: string;
  disclaimer: string;
  riskLevel: RiskLevel;
  isEmergency: boolean;
  provider?: string;
}

export interface ReportFinding {
  metric: string;
  value: string;
  status: 'normal' | 'abnormal' | 'concerning' | 'neutral';
  explanation: string;
}

export interface HealthMetric {
  name: string;
  value: number;
  unit: string;
  flagged: boolean;
}

export interface ReportAnalysisResponse {
  summary: string;
  keyFindings: string[];
  structuredFindings: ReportFinding[];
  riskFlags: string[];
  recommendations: string[];
  questionsForDoctor: string[];
  disclaimer: string;
  riskLevel: RiskLevel;
  fileName?: string;
  extractedSnippet?: string;
  provider?: string;
  healthMetrics: HealthMetric[];
}

export interface ImageAnalysisResponse {
  summary: string;
  visualObservations: string[];
  potentialConsiderations: string[];
  questionsForDoctor: string[];
  emergencyWarning?: string;
  disclaimer: string;
  riskLevel: RiskLevel;
  provider?: string;
}

export interface Hospital {
  id: string | number;
  name: string;
  type: string;
  address: string;
  phone: string;
  emergency: boolean;
  specialities: string[];
  latitude: number;
  longitude: number;
  rating?: number;
  openNow?: boolean;
  distance?: number;
  source?: string;
}

export interface HospitalSearchResponse {
  hospitals: Hospital[];
  locationName?: string;
  center?: { lat: number; lng: number };
}
