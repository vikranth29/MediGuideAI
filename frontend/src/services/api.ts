import {
  ChatResponse,
  ImageAnalysisResponse,
  ReportAnalysisResponse,
  HospitalSearchResponse,
} from '../types';

const API_BASE = '/api';
const FLASK_API_BASE = '/flask-api';

export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

export interface AuthSession {
  authenticated: boolean;
  user: AuthUser | null;
  csrf_token: string;
}

export interface ProfileResponse {
  success: boolean;
  user: AuthUser & {
    created_at: string | null;
  };
}

export interface DashboardPrediction {
  id: number;
  symptoms: string;
  disease: string;
  medicine: string | null;
  prediction_date: string | null;
}

export interface DashboardSummary {
  success: boolean;
  total_predictions: number;
  recent_predictions: DashboardPrediction[];
}

export interface HistoryPrediction {
  id: number;
  symptoms: string;
  disease: string;
  medicine: string | null;
  description: string | null;
  prediction_date: string | null;
}

export interface HistoryResponse {
  success: boolean;
  predictions: HistoryPrediction[];
}

export interface SymptomPredictionRequest {
  symptoms: string[];
  duration: string;
  severity: string;
  age: number;
  gender: string;
}

export interface SymptomPredictionResponse {
  success: boolean;
  prediction: string;
  description: string;
  precautions: string[];
  medicine: string | null;
  ai_advice: string | null;
  disclaimer: string;
  prediction_id: number;
  prediction_date: string | null;
}

export interface MedicineSearchResponse {
  success: boolean;
  disease: string;
  medicine: string;
}

export interface AdminSummary {
  total_users: number;
  admin_count: number;
  total_predictions: number;
}

export interface AdminUser {
  id: number;
  full_name: string;
  email: string;
  role: string;
  created_at: string | null;
  status: 'active';
}

export interface AdminDataResponse {
  success: boolean;
  summary: AdminSummary;
  users: AdminUser[];
}

let csrfToken: string | null = null;

async function parseError(res: Response, fallback: string): Promise<Error & { details?: Record<string, string>; status?: number }> {
  const errData = await res.json().catch(() => ({}));
  const error = new Error(errData.error || fallback) as Error & { details?: Record<string, string>; status?: number };
  error.details = errData.errors;
  error.status = res.status;
  return error;
}

async function flaskAuthRequest(path: string, options: RequestInit = {}): Promise<any> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (csrfToken) headers.set('X-CSRFToken', csrfToken);

  const res = await fetch(`${FLASK_API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!res.ok) throw await parseError(res, 'Authentication request failed.');
  return res.json();
}

export const api = {
  async getDashboardSummary(): Promise<DashboardSummary> {
    const res = await fetch(`${FLASK_API_BASE}/dashboard/summary`, {
      credentials: 'include',
    });
    if (!res.ok) throw await parseError(res, 'Unable to load dashboard summary.');
    return res.json();
  },

  async getHistory(): Promise<HistoryResponse> {
    const res = await fetch(`${FLASK_API_BASE}/history/data`, {
      credentials: 'include',
    });
    if (!res.ok) throw await parseError(res, 'Unable to load medical history.');
    return res.json();
  },

  async getProfile(): Promise<ProfileResponse> {
    const res = await fetch(`${FLASK_API_BASE}/profile/data`, {
      credentials: 'include',
    });
    if (!res.ok) throw await parseError(res, 'Unable to load profile information.');
    return res.json();
  },

  async getAdminData(): Promise<AdminDataResponse> {
    const res = await fetch(`${FLASK_API_BASE}/admin/data`, {
      credentials: 'include',
    });
    if (!res.ok) throw await parseError(res, 'Unable to load administrator information.');
    return res.json();
  },

  async getSession(): Promise<AuthSession> {
    const res = await fetch(`${FLASK_API_BASE}/auth/session`, {
      credentials: 'include',
    });
    if (!res.ok) throw await parseError(res, 'Unable to restore authentication session.');
    const data: AuthSession = await res.json();
    csrfToken = data.csrf_token;
    return data;
  },

  async getSymptoms(): Promise<string[]> {
    const res = await fetch(`${FLASK_API_BASE}/symptom-checker/symptoms`, {
      credentials: 'include',
    });
    if (!res.ok) throw await parseError(res, 'Unable to load known symptoms.');
    const data: { success: boolean; symptoms: string[] } = await res.json();
    return data.symptoms;
  },

  async predictSymptoms(payload: SymptomPredictionRequest): Promise<SymptomPredictionResponse> {
    if (!csrfToken) await this.getSession();
    return flaskAuthRequest('/symptom-checker/predict', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async searchMedicine(disease: string): Promise<MedicineSearchResponse> {
    const query = new URLSearchParams({ disease });
    const res = await fetch(`${FLASK_API_BASE}/medicine/search?${query.toString()}`, {
      credentials: 'include',
    });
    if (!res.ok) throw await parseError(res, 'Unable to search medicine information.');
    return res.json();
  },

  async login(email: string, password: string, remember: boolean): Promise<AuthSession> {
    const data = await flaskAuthRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, remember }),
    });
    csrfToken = data.csrf_token;
    return data;
  },

  async register(
    full_name: string,
    email: string,
    password: string,
    confirm_password: string
  ): Promise<{ success: boolean; message: string }> {
    return flaskAuthRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ full_name, email, password, confirm_password }),
    });
  },

  async logout(): Promise<AuthSession> {
    const data = await flaskAuthRequest('/auth/logout', { method: 'POST' });
    csrfToken = data.csrf_token;
    return data;
  },

  async sendChatMessage(
    message: string,
    history: { role: string; content: string }[],
    provider?: string
  ): Promise<ChatResponse> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, messages: history, provider }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to get response from medical assistant.');
    }

    return res.json();
  },

  async analyzeReport(file?: File, text?: string, provider?: string): Promise<ReportAnalysisResponse> {
    let res: Response;

    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      if (provider) formData.append('provider', provider);

      res = await fetch(`${API_BASE}/report/analyze`, {
        method: 'POST',
        body: formData,
      });
    } else if (text) {
      res = await fetch(`${API_BASE}/report/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, provider }),
      });
    } else {
      throw new Error('Please provide either a file or text content to analyze.');
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to analyze medical report.');
    }

    return res.json();
  },

  async analyzeImage(
    file?: File,
    imageBase64?: string,
    prompt?: string,
    provider?: string
  ): Promise<ImageAnalysisResponse> {
    let res: Response;

    if (file) {
      const formData = new FormData();
      formData.append('image', file);
      if (prompt) formData.append('prompt', prompt);
      if (provider) formData.append('provider', provider);

      res = await fetch(`${API_BASE}/image/analyze`, {
        method: 'POST',
        body: formData,
      });
    } else if (imageBase64) {
      res = await fetch(`${API_BASE}/image/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, prompt, provider }),
      });
    } else {
      throw new Error('Please provide an image file or base64 data to analyze.');
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Medical image analysis failed.');
    }

    return res.json();
  },

  async getHospitals(params: {
    latitude?: number;
    longitude?: number;
    radius?: number;
    query?: string;
    type?: string;
  }): Promise<HospitalSearchResponse> {
    const queryParams = new URLSearchParams();
    if (params.latitude !== undefined) queryParams.append('latitude', params.latitude.toString());
    if (params.longitude !== undefined) queryParams.append('longitude', params.longitude.toString());
    if (params.radius !== undefined) queryParams.append('radius', params.radius.toString());
    if (params.query) queryParams.append('query', params.query);
    if (params.type) queryParams.append('type', params.type);

    const res = await fetch(`${API_BASE}/hospitals?${queryParams.toString()}`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to search hospitals.');
    }

    return res.json();
  },
};
