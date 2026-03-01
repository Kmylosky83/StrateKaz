/**
 * API Client — Inteligencia Artificial
 * Endpoints: /api/ia/
 */
import apiClient from './axios-config';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ContextHelpRequest {
  module_code: string;
  tab_code?: string;
  section_name?: string;
}

export interface ContextHelpResponse {
  title: string;
  description: string;
  tab_help: string;
  section_help: string;
  tips: string[];
  ai_response?: string;
  ai_enhanced: boolean;
  tokens_used?: number;
}

export type TextAssistAction = 'improve' | 'formal' | 'summarize' | 'expand' | 'proofread';

export interface TextAssistRequest {
  text: string;
  action: TextAssistAction;
}

export interface TextAssistResponse {
  success: boolean;
  text: string;
  error?: string;
  tokens_used: number;
  model: string;
  provider: string;
  processing_time_ms: number;
}

export interface IAStatusResponse {
  available: boolean;
  provider: string;
  message: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// API CALLS
// ═══════════════════════════════════════════════════════════════════════════

const BASE_URL = '/ia';

/**
 * Obtiene ayuda contextual para el módulo/tab actual.
 */
export const getContextHelp = async (params: ContextHelpRequest): Promise<ContextHelpResponse> => {
  const { data } = await apiClient.post<ContextHelpResponse>(`${BASE_URL}/context-help/`, params);
  return data;
};

/**
 * Ejecuta una acción de asistencia de texto con IA.
 */
export const getTextAssist = async (params: TextAssistRequest): Promise<TextAssistResponse> => {
  const { data } = await apiClient.post<TextAssistResponse>(`${BASE_URL}/text-assist/`, params);
  return data;
};

/**
 * Verifica si la IA está disponible para el tenant actual.
 */
export const getIAStatus = async (): Promise<IAStatusResponse> => {
  const { data } = await apiClient.get<IAStatusResponse>(`${BASE_URL}/status/`);
  return data;
};
