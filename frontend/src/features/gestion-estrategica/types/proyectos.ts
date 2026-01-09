/**
 * Tipos TypeScript para el módulo de Gestión de Proyectos PMI
 * Sistema de Gestión StrateKaz
 * Semana 5: Gestión de Proyectos
 */

// ==================== ENUMS ====================
// NOTA: Los valores deben coincidir con el backend (minúsculas)

export type EstadoProyecto =
  | 'propuesto'
  | 'iniciacion'
  | 'planificacion'
  | 'ejecucion'
  | 'monitoreo'
  | 'cierre'
  | 'completado'
  | 'cancelado'
  | 'suspendido';

export type PrioridadProyecto = 'baja' | 'media' | 'alta';

export type TipoProyecto =
  | 'mejora'
  | 'implementacion'
  | 'desarrollo'
  | 'infraestructura'
  | 'normativo'
  | 'otro';

export type RolProyecto =
  | 'sponsor'
  | 'director'
  | 'gerente'
  | 'lider_tecnico'
  | 'miembro'
  | 'stakeholder'
  | 'observador';

export type SaludProyecto = 'verde' | 'amarillo' | 'rojo';

// Estados para Portafolio
export type EstadoPortafolio = 'activo' | 'en_revision' | 'archivado';

// Estados para Programa
export type EstadoPrograma = 'activo' | 'en_revision' | 'completado' | 'archivado';

// ==================== PORTAFOLIO ====================
// Campos alineados con PortafolioSerializer del backend

export interface Portafolio {
  id: number;
  empresa?: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  objetivo_estrategico?: string | null;
  presupuesto_asignado?: string | null;
  responsable?: number | null;
  responsable_nombre?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  total_programas?: number;
  total_proyectos?: number;
  is_active: boolean;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePortafolioDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  objetivo_estrategico?: string;
  presupuesto_asignado?: string;
  responsable?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  is_active?: boolean;
}

export interface UpdatePortafolioDTO {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  objetivo_estrategico?: string;
  presupuesto_asignado?: string;
  responsable?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  is_active?: boolean;
}

// ==================== PROGRAMA ====================
// Campos alineados con ProgramaSerializer del backend

export interface Programa {
  id: number;
  empresa?: number;
  portafolio: number;
  portafolio_nombre?: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  responsable?: number | null;
  responsable_nombre?: string | null;
  presupuesto?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  total_proyectos?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProgramaDTO {
  portafolio: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  responsable?: number;
  presupuesto?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  is_active?: boolean;
}

export interface UpdateProgramaDTO {
  portafolio?: number;
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  responsable?: number;
  presupuesto?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  is_active?: boolean;
}

// ==================== PROYECTO ====================
// NOTA: Campos alineados con ProyectoListSerializer y ProyectoSerializer del backend

export interface Proyecto {
  id: number;
  empresa?: number | null;
  programa?: number | null;
  programa_nombre?: string | null;
  // Identificación (backend usa 'codigo' y 'nombre')
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  tipo: TipoProyecto;
  tipo_display?: string;
  estado: EstadoProyecto;
  estado_display?: string;
  prioridad: PrioridadProyecto;
  prioridad_display?: string;
  // Fechas (backend usa fecha_*_plan y fecha_*_real)
  fecha_propuesta?: string | null;
  fecha_inicio_plan?: string | null;
  fecha_fin_plan?: string | null;
  fecha_inicio_real?: string | null;
  fecha_fin_real?: string | null;
  // Presupuesto
  presupuesto_estimado?: number | null;
  presupuesto_aprobado?: number | null;
  costo_real?: number | null;
  // Progreso (backend usa 'porcentaje_avance')
  porcentaje_avance: number;
  // Roles clave
  sponsor?: number | null;
  sponsor_nombre?: string | null;
  gerente_proyecto?: number | null;
  gerente_nombre?: string | null;
  // Justificación
  justificacion?: string | null;
  beneficios_esperados?: string | null;
  // Campos calculados desde serializer
  variacion_costo?: number | null;
  indice_desempeno_costo?: number | null;
  total_actividades?: number;
  total_riesgos?: number;
  total_recursos?: number;
  // Estado
  is_active: boolean;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProyectoDTO {
  programa?: number | null;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoProyecto;
  estado?: EstadoProyecto;
  prioridad: PrioridadProyecto;
  fecha_inicio_plan?: string;
  fecha_fin_plan?: string;
  presupuesto_estimado?: string;
  justificacion?: string;
  beneficios_esperados?: string;
  sponsor?: number;
  gerente_proyecto?: number;
  is_active?: boolean;
}

export interface UpdateProyectoDTO {
  programa?: number | null;
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  tipo?: TipoProyecto;
  estado?: EstadoProyecto;
  prioridad?: PrioridadProyecto;
  fecha_inicio_plan?: string;
  fecha_fin_plan?: string;
  fecha_inicio_real?: string;
  fecha_fin_real?: string;
  presupuesto_estimado?: string;
  presupuesto_aprobado?: string;
  costo_real?: string;
  justificacion?: string;
  beneficios_esperados?: string;
  sponsor?: number;
  gerente_proyecto?: number;
  porcentaje_avance?: number;
  is_active?: boolean;
}

// ==================== EQUIPO DE PROYECTO ====================

export interface EquipoProyecto {
  id: number;
  proyecto: number;
  proyecto_name?: string;
  usuario?: number | null;
  usuario_name?: string | null;
  cargo?: number | null;
  cargo_name?: string | null;
  rol: RolProyecto;
  rol_display?: string;
  responsabilidades?: string | null;
  dedicacion_porcentaje?: number;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateEquipoProyectoDTO {
  proyecto: number;
  usuario?: number;
  cargo?: number;
  rol: RolProyecto;
  responsabilidades?: string;
  dedicacion_porcentaje?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  is_active?: boolean;
}

export interface UpdateEquipoProyectoDTO {
  usuario?: number;
  cargo?: number;
  rol?: RolProyecto;
  responsabilidades?: string;
  dedicacion_porcentaje?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  is_active?: boolean;
}

// ==================== HITO DE PROYECTO ====================

export interface HitoProyecto {
  id: number;
  proyecto: number;
  proyecto_name?: string;
  code: string;
  name: string;
  description?: string | null;
  fecha_prevista: string;
  fecha_real?: string | null;
  is_completed: boolean;
  completed_by?: number | null;
  completed_by_name?: string | null;
  completed_at?: string | null;
  entregables?: string | null;
  criterios_aceptacion?: string | null;
  evidencia?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateHitoProyectoDTO {
  proyecto: number;
  code: string;
  name: string;
  description?: string;
  fecha_prevista: string;
  entregables?: string;
  criterios_aceptacion?: string;
  is_active?: boolean;
}

export interface UpdateHitoProyectoDTO {
  code?: string;
  name?: string;
  description?: string;
  fecha_prevista?: string;
  fecha_real?: string;
  entregables?: string;
  criterios_aceptacion?: string;
  evidencia?: string;
  is_active?: boolean;
}

// ==================== DASHBOARD ====================

export interface ProyectosDashboard {
  // Totales por estado
  total_proyectos: number;
  propuestos: number;
  en_iniciacion: number;
  en_planificacion: number;
  en_ejecucion: number;
  en_monitoreo: number;
  en_cierre: number;
  completados: number;
  cancelados: number;

  // Salud del portafolio
  proyectos_verde: number;
  proyectos_amarillo: number;
  proyectos_rojo: number;

  // Por prioridad
  criticos: number;
  alta_prioridad: number;
  media_prioridad: number;
  baja_prioridad: number;

  // Presupuesto
  presupuesto_total: string;
  presupuesto_ejecutado: string;
  presupuesto_disponible: string;
  porcentaje_ejecucion: number;

  // Portafolios y programas
  total_portafolios: number;
  portafolios_activos: number;
  total_programas: number;
  programas_activos: number;

  // Progreso general
  progreso_promedio: number;

  // Proyectos atrasados
  proyectos_atrasados: number;
}

// ==================== FILTERS ====================

export interface PortafolioFilters {
  status?: EstadoPortafolio;
  owner?: number;
  is_active?: boolean;
  search?: string;
}

export interface ProgramaFilters {
  portafolio?: number;
  status?: EstadoPrograma;
  manager?: number;
  is_active?: boolean;
  search?: string;
}

export interface ProyectoFilters {
  programa?: number;
  portafolio?: number;
  tipo?: TipoProyecto;
  estado?: EstadoProyecto;
  prioridad?: PrioridadProyecto;
  health_status?: SaludProyecto;
  sponsor?: number;
  project_manager?: number;
  objetivo_estrategico?: number;
  is_active?: boolean;
  search?: string;
}

export interface EquipoProyectoFilters {
  proyecto?: number;
  usuario?: number;
  rol?: RolProyecto;
  is_active?: boolean;
}

export interface HitoProyectoFilters {
  proyecto?: number;
  is_completed?: boolean;
  is_active?: boolean;
  fecha_desde?: string;
  fecha_hasta?: string;
}

// ==================== PAGINATION ====================

// PaginatedResponse: importar desde '@/types'

// ==================== SELECT OPTIONS ====================

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface ProyectosChoices {
  estados_proyecto: SelectOption[];
  prioridades: SelectOption[];
  tipos_proyecto: SelectOption[];
  roles_proyecto: SelectOption[];
  estados_portafolio: SelectOption[];
  estados_programa: SelectOption[];
  salud_estados: SelectOption[];
}
