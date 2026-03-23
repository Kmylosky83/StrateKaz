/**
 * API Client para Plantillas de Estructura Organizacional
 * Endpoint: /api/core/org-templates/
 */
import axiosInstance from '@/api/axios-config';

// ==================== TYPES ====================

export interface OrgTemplateArea {
  code: string;
  name: string;
  description: string;
  tipo: string;
  icon: string;
  color: string;
}

export interface OrgTemplateCargo {
  code: string;
  name: string;
  area: string;
  nivel: string;
  is_jefatura: boolean;
  parent: string | null;
  cantidad: number;
  is_externo: boolean;
  level: number;
}

export interface OrgTemplate {
  code: string;
  name: string;
  description: string;
  icon: string;
  areas_count: number;
  cargos_count: number;
  areas: OrgTemplateArea[];
  cargos: OrgTemplateCargo[];
}

export interface ApplyTemplateResult {
  areas_created: number;
  cargos_created: number;
  skipped: number;
  template_name: string;
}

// ==================== API CALLS ====================

const BASE_URL = '/core/org-templates';

export const orgTemplatesApi = {
  /** Lista todas las plantillas disponibles */
  getAll: async (): Promise<OrgTemplate[]> => {
    const { data } = await axiosInstance.get<OrgTemplate[]>(`${BASE_URL}/`);
    return data;
  },

  /** Aplica una plantilla al tenant actual */
  apply: async (templateCode: string): Promise<ApplyTemplateResult> => {
    const { data } = await axiosInstance.post<ApplyTemplateResult>(`${BASE_URL}/apply/`, {
      template_code: templateCode,
    });
    return data;
  },
};
