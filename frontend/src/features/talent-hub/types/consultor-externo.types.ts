/**
 * Types para Consultores Externos - Talent Hub
 * Sistema de Gestión StrateKaz
 */

export type TipoConsultor = 'CONSULTOR' | 'CONTRATISTA';

export interface ConsultorExternoList {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  last_login: string | null;
  date_joined: string;
  cargo_id: number | null;
  cargo_nombre: string | null;
  cargo_code: string | null;
  proveedor_id: number;
  firma_nombre: string;
  tipo_consultor: TipoConsultor;
  tipo_consultor_nombre: string;
  es_independiente: boolean;
  es_portal_only: boolean;
}

export interface ConsultorExternoDetail extends ConsultorExternoList {
  phone: string | null;
  document_number: string | null;
  firma_razon_social: string;
  firma_email: string | null;
  firma_telefono: string | null;
}

export interface ConsultorExternoEstadisticas {
  total: number;
  activos: number;
  inactivos: number;
  independientes: number;
  de_firma: number;
  consultores: number;
  contratistas: number;
}

export interface ConsultorExternoFilters {
  search?: string;
  tipo?: TipoConsultor;
  es_independiente?: string;
  estado?: 'activo' | 'inactivo';
  cargo?: string;
  firma?: string;
  modalidad?: 'portal' | 'colocado';
}
