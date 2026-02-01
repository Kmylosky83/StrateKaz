/**
 * Tipos TypeScript para Análisis de Contexto
 * Sistema de Gestión StrateKaz
 *
 * Incluye:
 * - DOFA (Debilidades, Oportunidades, Fortalezas, Amenazas)
 * - TOWS (Estrategias cruzadas)
 * - PESTEL (Análisis de entorno)
 * - Porter (5 Fuerzas)
 */

// ==================== ENUMS Y TIPOS ====================

export type TipoFactorDOFA = 'fortaleza' | 'oportunidad' | 'debilidad' | 'amenaza';
export type TipoEstrategiaTOWS = 'fo' | 'fa' | 'do' | 'da';
export type TipoFactorPESTEL = 'politico' | 'economico' | 'social' | 'tecnologico' | 'ecologico' | 'legal';
export type TipoFuerzaPorter = 'rivalidad' | 'nuevos_entrantes' | 'sustitutos' | 'poder_proveedores' | 'poder_clientes';

export type EstadoAnalisis = 'borrador' | 'en_revision' | 'aprobado' | 'vigente' | 'obsoleto';
export type NivelImpacto = 'alto' | 'medio' | 'bajo';
export type IntensidadFuerza = 'muy_alta' | 'alta' | 'media' | 'baja' | 'muy_baja';

// ==================== ANÁLISIS DOFA ====================

export interface AnalisisDOFA {
  id: number;
  nombre: string;
  fecha_analisis: string;
  periodo: string;
  responsable: number | null;
  responsable_detail?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  estado: EstadoAnalisis;
  observaciones: string;
  factores?: FactorDOFA[];
  estrategias?: EstrategiaTOWS[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FactorDOFA {
  id: number;
  analisis: number;
  tipo: TipoFactorDOFA;
  descripcion: string;
  impacto: NivelImpacto;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EstrategiaTOWS {
  id: number;
  analisis: number;
  tipo: TipoEstrategiaTOWS;
  descripcion: string;
  factores_relacionados: number[];
  responsable: number | null;
  responsable_detail?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  fecha_implementacion: string | null;
  estado: 'pendiente' | 'en_proceso' | 'completada' | 'cancelada';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== ANÁLISIS PESTEL ====================

export interface AnalisisPESTEL {
  id: number;
  nombre: string;
  fecha_analisis: string;
  periodo: string;
  alcance_geografico: string;
  responsable: number | null;
  responsable_detail?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  estado: EstadoAnalisis;
  observaciones: string;
  factores?: FactorPESTEL[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FactorPESTEL {
  id: number;
  analisis: number;
  tipo: TipoFactorPESTEL;
  factor: string;
  descripcion: string;
  impacto: NivelImpacto;
  tendencia: 'creciente' | 'estable' | 'decreciente';
  tiempo_impacto: 'inmediato' | 'corto_plazo' | 'mediano_plazo' | 'largo_plazo';
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== ANÁLISIS PORTER (5 FUERZAS) ====================

export interface AnalisisPorter {
  id: number;
  nombre: string;
  fecha_analisis: string;
  sector_industria: string;
  mercado_objetivo: string;
  responsable: number | null;
  responsable_detail?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  estado: EstadoAnalisis;
  observaciones: string;
  fuerzas?: FuerzaPorter[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FuerzaPorter {
  id: number;
  analisis: number;
  tipo: TipoFuerzaPorter;
  descripcion: string;
  intensidad: IntensidadFuerza;
  factores_clave: string[];
  impacto_competitividad: NivelImpacto;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== DTOs ====================

export interface CreateAnalisisDOFADTO {
  nombre: string;
  fecha_analisis: string;
  periodo: string;
  responsable?: number;
  estado?: EstadoAnalisis;
  observaciones?: string;
}

export interface UpdateAnalisisDOFADTO {
  nombre?: string;
  fecha_analisis?: string;
  periodo?: string;
  responsable?: number;
  estado?: EstadoAnalisis;
  observaciones?: string;
  is_active?: boolean;
}

export interface CreateFactorDOFADTO {
  analisis: number;
  tipo: TipoFactorDOFA;
  descripcion: string;
  impacto: NivelImpacto;
  orden?: number;
}

export interface UpdateFactorDOFADTO {
  tipo?: TipoFactorDOFA;
  descripcion?: string;
  impacto?: NivelImpacto;
  orden?: number;
  is_active?: boolean;
}

export interface CreateEstrategiaTOWSDTO {
  analisis: number;
  tipo: TipoEstrategiaTOWS;
  descripcion: string;
  factores_relacionados?: number[];
  responsable?: number;
  fecha_implementacion?: string;
  estado?: 'pendiente' | 'en_proceso' | 'completada' | 'cancelada';
}

export interface UpdateEstrategiaTOWSDTO {
  tipo?: TipoEstrategiaTOWS;
  descripcion?: string;
  factores_relacionados?: number[];
  responsable?: number;
  fecha_implementacion?: string;
  estado?: 'pendiente' | 'en_proceso' | 'completada' | 'cancelada';
  is_active?: boolean;
}

export interface CreateAnalisisPESTELDTO {
  nombre: string;
  fecha_analisis: string;
  periodo: string;
  alcance_geografico: string;
  responsable?: number;
  estado?: EstadoAnalisis;
  observaciones?: string;
}

export interface UpdateAnalisisPESTELDTO {
  nombre?: string;
  fecha_analisis?: string;
  periodo?: string;
  alcance_geografico?: string;
  responsable?: number;
  estado?: EstadoAnalisis;
  observaciones?: string;
  is_active?: boolean;
}

export interface CreateFactorPESTELDTO {
  analisis: number;
  tipo: TipoFactorPESTEL;
  factor: string;
  descripcion: string;
  impacto: NivelImpacto;
  tendencia: 'creciente' | 'estable' | 'decreciente';
  tiempo_impacto: 'inmediato' | 'corto_plazo' | 'mediano_plazo' | 'largo_plazo';
  orden?: number;
}

export interface UpdateFactorPESTELDTO {
  tipo?: TipoFactorPESTEL;
  factor?: string;
  descripcion?: string;
  impacto?: NivelImpacto;
  tendencia?: 'creciente' | 'estable' | 'decreciente';
  tiempo_impacto?: 'inmediato' | 'corto_plazo' | 'mediano_plazo' | 'largo_plazo';
  orden?: number;
  is_active?: boolean;
}

export interface CreateAnalisisPorterDTO {
  nombre: string;
  fecha_analisis: string;
  sector_industria: string;
  mercado_objetivo: string;
  responsable?: number;
  estado?: EstadoAnalisis;
  observaciones?: string;
}

export interface UpdateAnalisisPorterDTO {
  nombre?: string;
  fecha_analisis?: string;
  sector_industria?: string;
  mercado_objetivo?: string;
  responsable?: number;
  estado?: EstadoAnalisis;
  observaciones?: string;
  is_active?: boolean;
}

export interface CreateFuerzaPorterDTO {
  analisis: number;
  tipo: TipoFuerzaPorter;
  descripcion: string;
  intensidad: IntensidadFuerza;
  factores_clave: string[];
  impacto_competitividad: NivelImpacto;
}

export interface UpdateFuerzaPorterDTO {
  tipo?: TipoFuerzaPorter;
  descripcion?: string;
  intensidad?: IntensidadFuerza;
  factores_clave?: string[];
  impacto_competitividad?: NivelImpacto;
  is_active?: boolean;
}

// ==================== RESPONSE TYPES ====================
// PaginatedResponse: importar desde '@/types'
