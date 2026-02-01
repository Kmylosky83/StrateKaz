/**
 * Tipos TypeScript para Partes Interesadas
 * Backend: backend/apps/motor_cumplimiento/partes_interesadas/
 */

// ============================================================================
// ENUMS (todos en minúsculas como el backend)
// ============================================================================

export type CategoriaPI = 'interna' | 'externa';

export type NivelInfluencia = 'alta' | 'media' | 'baja';

export type NivelInteres = 'alto' | 'medio' | 'bajo';

export type TipoRequisitoPI =
  | 'necesidad'
  | 'expectativa'
  | 'requisito_legal'
  | 'requisito_contractual';

export type PrioridadRequisito = 'alta' | 'media' | 'baja';

export type FrecuenciaComunicacion =
  | 'diaria'
  | 'semanal'
  | 'quincenal'
  | 'mensual'
  | 'bimestral'
  | 'trimestral'
  | 'semestral'
  | 'anual'
  | 'segun_necesidad';

export type MedioComunicacion =
  | 'email'
  | 'reunion'
  | 'informe'
  | 'cartelera'
  | 'intranet'
  | 'telefono'
  | 'redes'
  | 'otro';

/** Canal principal de comunicación para automatización */
export type CanalComunicacion =
  | 'email'
  | 'telefono'
  | 'reunion'
  | 'videoconferencia'
  | 'whatsapp'
  | 'portal_web'
  | 'redes_sociales'
  | 'correspondencia'
  | 'otro';

/** Cuadrante en la matriz poder-interés */
export type CuadranteMatriz =
  | 'gestionar_cerca'
  | 'mantener_satisfecho'
  | 'mantener_informado'
  | 'monitorear';

// ============================================================================
// TIPOS BASE
// ============================================================================

export interface BaseTimestamped {
  created_at: string;
  updated_at: string;
}

export interface BaseSoftDelete {
  is_active: boolean;
  deleted_at?: string | null;
}

export interface BaseOrdered {
  orden: number;
}

// ============================================================================
// TIPO PARTE INTERESADA
// ============================================================================

export interface TipoParteInteresada
  extends BaseTimestamped,
    BaseSoftDelete,
    BaseOrdered {
  id: number;
  codigo: string;
  nombre: string;
  categoria: CategoriaPI;
  categoria_display: string; // read-only
  descripcion?: string;
}

export interface TipoParteInteresadaCreate {
  codigo: string;
  nombre: string;
  categoria: CategoriaPI;
  descripcion?: string;
  orden?: number;
}

// ============================================================================
// PARTE INTERESADA
// ============================================================================

export interface ParteInteresada extends BaseTimestamped, BaseSoftDelete {
  id: number;
  empresa_id: number;
  tipo: number;
  tipo_nombre: string; // read-only
  tipo_categoria?: CategoriaPI; // read-only
  nombre: string;
  descripcion?: string;
  // Información de contacto
  representante?: string;
  cargo_representante?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  sitio_web?: string;
  // Matriz poder-interés
  nivel_influencia: NivelInfluencia;
  nivel_influencia_display: string; // read-only
  nivel_interes: NivelInteres;
  nivel_interes_display: string; // read-only
  cuadrante_matriz?: CuadranteMatriz; // read-only (computed)
  // Comunicación (para automatización de matriz de comunicaciones)
  canal_principal?: CanalComunicacion;
  canal_principal_display?: string; // read-only
  frecuencia_comunicacion?: FrecuenciaComunicacion;
  frecuencia_comunicacion_display?: string; // read-only
  // ISO 9001:2015 Cláusula 4.2 - Necesidades, Expectativas y Requisitos
  necesidades?: string;
  expectativas?: string;
  requisitos_pertinentes?: string;
  es_requisito_legal?: boolean;
  // Sistemas de gestión relacionados
  relacionado_sst: boolean;
  relacionado_ambiental: boolean;
  relacionado_calidad: boolean;
  relacionado_pesv: boolean;
  // Auditoría
  created_by?: number | null;
  updated_by?: number | null;
}

export interface ParteInteresadaCreate {
  empresa_id: number;
  tipo: number;
  nombre: string;
  descripcion?: string;
  // Información de contacto
  representante?: string;
  cargo_representante?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  sitio_web?: string;
  // Matriz poder-interés
  nivel_influencia?: NivelInfluencia;
  nivel_interes?: NivelInteres;
  // Comunicación
  canal_principal?: CanalComunicacion;
  frecuencia_comunicacion?: FrecuenciaComunicacion;
  // ISO 9001:2015 Cláusula 4.2
  necesidades?: string;
  expectativas?: string;
  requisitos_pertinentes?: string;
  es_requisito_legal?: boolean;
  // Sistemas de gestión relacionados
  relacionado_sst?: boolean;
  relacionado_ambiental?: boolean;
  relacionado_calidad?: boolean;
  relacionado_pesv?: boolean;
}

// ============================================================================
// REQUISITO PARTE INTERESADA
// ============================================================================

export interface RequisitoParteInteresada
  extends BaseTimestamped,
    BaseSoftDelete {
  id: number;
  empresa_id: number;
  parte_interesada: number;
  tipo: TipoRequisitoPI;
  tipo_display: string; // read-only
  descripcion: string;
  prioridad: PrioridadRequisito;
  prioridad_display: string; // read-only
  como_se_aborda?: string;
  proceso_relacionado?: string;
  indicador_seguimiento?: string;
  cumple: boolean;
  evidencia_cumplimiento?: string;
  fecha_ultima_revision?: string | null; // ISO date
  created_by?: number | null;
  updated_by?: number | null;
}

export interface RequisitoParteInteresadaCreate {
  empresa_id: number;
  parte_interesada: number;
  tipo: TipoRequisitoPI;
  descripcion: string;
  prioridad?: PrioridadRequisito;
  como_se_aborda?: string;
  proceso_relacionado?: string;
  indicador_seguimiento?: string;
  cumple?: boolean;
  evidencia_cumplimiento?: string;
  fecha_ultima_revision?: string | null;
}

// ============================================================================
// MATRIZ COMUNICACIÓN
// ============================================================================

export interface MatrizComunicacion extends BaseTimestamped {
  id: number;
  empresa_id: number;
  parte_interesada: number;
  parte_interesada_nombre: string; // read-only
  que_comunicar: string;
  cuando_comunicar: FrecuenciaComunicacion;
  cuando_display: string; // read-only
  como_comunicar: MedioComunicacion;
  como_display: string; // read-only
  responsable?: number | null;
  responsable_nombre: string; // read-only
  registro_evidencia?: string;
  aplica_sst: boolean;
  aplica_ambiental: boolean;
  aplica_calidad: boolean;
  aplica_pesv: boolean;
  is_active: boolean;
}

export interface MatrizComunicacionCreate {
  empresa_id: number;
  parte_interesada: number;
  que_comunicar: string;
  cuando_comunicar: FrecuenciaComunicacion;
  como_comunicar: MedioComunicacion;
  responsable?: number | null;
  registro_evidencia?: string;
  aplica_sst?: boolean;
  aplica_ambiental?: boolean;
  aplica_calidad?: boolean;
  aplica_pesv?: boolean;
}

// ============================================================================
// UTILIDADES
// ============================================================================

export const CATEGORIAS_PI: Array<{ value: CategoriaPI; label: string }> = [
  { value: 'interna', label: 'Interna' },
  { value: 'externa', label: 'Externa' },
];

export const NIVELES_INFLUENCIA: Array<{ value: NivelInfluencia; label: string }> = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' },
];

export const NIVELES_INTERES: Array<{ value: NivelInteres; label: string }> = [
  { value: 'alto', label: 'Alto' },
  { value: 'medio', label: 'Medio' },
  { value: 'bajo', label: 'Bajo' },
];

export const TIPOS_REQUISITO_PI: Array<{ value: TipoRequisitoPI; label: string }> = [
  { value: 'necesidad', label: 'Necesidad' },
  { value: 'expectativa', label: 'Expectativa' },
  { value: 'requisito_legal', label: 'Requisito Legal' },
  { value: 'requisito_contractual', label: 'Requisito Contractual' },
];

export const PRIORIDADES: Array<{ value: PrioridadRequisito; label: string }> = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' },
];

export const FRECUENCIAS_COMUNICACION: Array<{
  value: FrecuenciaComunicacion;
  label: string;
}> = [
  { value: 'diaria', label: 'Diaria' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'mensual', label: 'Mensual' },
  { value: 'bimestral', label: 'Bimestral' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
  { value: 'segun_necesidad', label: 'Según Necesidad' },
];

export const MEDIOS_COMUNICACION: Array<{ value: MedioComunicacion; label: string }> = [
  { value: 'email', label: 'Correo Electrónico' },
  { value: 'reunion', label: 'Reunión' },
  { value: 'informe', label: 'Informe Escrito' },
  { value: 'cartelera', label: 'Cartelera' },
  { value: 'intranet', label: 'Intranet' },
  { value: 'telefono', label: 'Teléfono' },
  { value: 'redes', label: 'Redes Sociales' },
  { value: 'otro', label: 'Otro' },
];

// ============================================================================
// FILTERS
// ============================================================================

export interface ParteInteresadaFilters {
  page?: number;
  page_size?: number;
  search?: string;
  tipo?: number;
  categoria?: CategoriaPI;
  nivel_influencia?: NivelInfluencia;
  nivel_interes?: NivelInteres;
  relacionado_sst?: boolean;
  relacionado_ambiental?: boolean;
  relacionado_calidad?: boolean;
  relacionado_pesv?: boolean;
}

// ============================================================================
// API DTOs
// ============================================================================

export interface CreateTipoParteInteresadaDTO {
  codigo: string;
  nombre: string;
  categoria: CategoriaPI;
  descripcion?: string;
  orden?: number;
}

export interface UpdateTipoParteInteresadaDTO {
  codigo?: string;
  nombre?: string;
  categoria?: CategoriaPI;
  descripcion?: string;
  orden?: number;
}

export interface CreateParteInteresadaDTO {
  empresa_id: number;
  tipo: number;
  nombre: string;
  descripcion?: string;
  // Información de contacto
  representante?: string;
  cargo_representante?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  sitio_web?: string;
  // Matriz poder-interés
  nivel_influencia?: NivelInfluencia;
  nivel_interes?: NivelInteres;
  // Comunicación
  canal_principal?: CanalComunicacion;
  frecuencia_comunicacion?: FrecuenciaComunicacion;
  // ISO 9001:2015 Cláusula 4.2
  necesidades?: string;
  expectativas?: string;
  requisitos_pertinentes?: string;
  es_requisito_legal?: boolean;
  // Sistemas de gestión relacionados
  relacionado_sst?: boolean;
  relacionado_ambiental?: boolean;
  relacionado_calidad?: boolean;
  relacionado_pesv?: boolean;
}

export interface UpdateParteInteresadaDTO {
  tipo?: number;
  nombre?: string;
  descripcion?: string;
  // Información de contacto
  representante?: string;
  cargo_representante?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  sitio_web?: string;
  // Matriz poder-interés
  nivel_influencia?: NivelInfluencia;
  nivel_interes?: NivelInteres;
  // Comunicación
  canal_principal?: CanalComunicacion;
  frecuencia_comunicacion?: FrecuenciaComunicacion;
  // ISO 9001:2015 Cláusula 4.2
  necesidades?: string;
  expectativas?: string;
  requisitos_pertinentes?: string;
  es_requisito_legal?: boolean;
  // Sistemas de gestión relacionados
  relacionado_sst?: boolean;
  relacionado_ambiental?: boolean;
  relacionado_calidad?: boolean;
  relacionado_pesv?: boolean;
}

// PaginatedResponse: importar desde '@/types'

// ============================================================================
// CONFIGURACIÓN UI - CANALES DE COMUNICACIÓN
// ============================================================================

export const CANALES_COMUNICACION: Array<{ value: CanalComunicacion; label: string }> = [
  { value: 'email', label: 'Correo Electrónico' },
  { value: 'telefono', label: 'Teléfono' },
  { value: 'reunion', label: 'Reunión Presencial' },
  { value: 'videoconferencia', label: 'Videoconferencia' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'portal_web', label: 'Portal Web' },
  { value: 'redes_sociales', label: 'Redes Sociales' },
  { value: 'correspondencia', label: 'Correspondencia Física' },
  { value: 'otro', label: 'Otro' },
];

// ============================================================================
// CONFIGURACIÓN UI - CUADRANTES MATRIZ PODER-INTERÉS
// ============================================================================

export const CUADRANTE_MATRIZ_CONFIG = {
  gestionar_cerca: {
    label: 'Gestionar de Cerca',
    shortLabel: 'Gestionar',
    description: 'Alta influencia y alto interés. Requieren máxima atención.',
    color: 'danger' as const,
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-700 dark:text-red-400',
    borderClass: 'border-red-500',
  },
  mantener_satisfecho: {
    label: 'Mantener Satisfecho',
    shortLabel: 'Satisfecho',
    description: 'Alta influencia pero bajo interés. Mantener informados.',
    color: 'warning' as const,
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    textClass: 'text-amber-700 dark:text-amber-400',
    borderClass: 'border-amber-500',
  },
  mantener_informado: {
    label: 'Mantener Informado',
    shortLabel: 'Informado',
    description: 'Baja influencia pero alto interés. Comunicación regular.',
    color: 'info' as const,
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    textClass: 'text-blue-700 dark:text-blue-400',
    borderClass: 'border-blue-500',
  },
  monitorear: {
    label: 'Monitorear',
    shortLabel: 'Monitorear',
    description: 'Baja influencia y bajo interés. Monitoreo básico.',
    color: 'gray' as const,
    bgClass: 'bg-gray-100 dark:bg-gray-800/30',
    textClass: 'text-gray-700 dark:text-gray-400',
    borderClass: 'border-gray-400',
  },
} as const;
