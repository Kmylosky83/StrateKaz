/**
 * Tipos para el sistema RBAC
 *
 * Gestion de Cargos (con Manual de Funciones), Roles y Permisos
 * Sistema de Gestion StrateKaz
 */

// ==================== PERMISSION ====================

export interface Permission {
  id: number;
  code: string;
  name: string;
  description?: string;
  // Campos dinámicos (FKs)
  modulo?: number;
  modulo_code?: string;
  modulo_name?: string;
  accion?: number;
  accion_code?: string;
  accion_name?: string;
  alcance?: number;
  alcance_code?: string;
  alcance_name?: string;
  recurso?: string;
  // Campos legacy (para compatibilidad)
  module?: string;
  module_display?: string;
  action?: string;
  action_display?: string;
  scope?: 'ALL' | 'OWN' | 'TEAM';
  scope_display?: string;
  is_active: boolean;
  created_at?: string;
}

export interface PermissionGroup {
  module: string;
  module_name: string;
  module_icon?: string | null;
  permissions: Permission[];
}

// ==================== ROLE ====================

export interface Role {
  id: number;
  code: string;
  name: string;
  description: string;
  permisos?: Permission[];
  permissions_count: number;
  users_count: number;
  groups_count: number;
  is_system: boolean;
  is_active: boolean;
  users?: RoleUser[];
  created_at?: string;
  updated_at?: string;
}

export interface RoleUser {
  user_id: number;
  username: string;
  full_name: string;
  assigned_at: string;
  expires_at: string | null;
  is_expired: boolean;
}

export interface CreateRoleDTO {
  code: string;
  name: string;
  description?: string;
  permission_ids?: number[];
  is_active?: boolean;
}

export interface UpdateRoleDTO {
  name?: string;
  description?: string;
  permission_ids?: number[];
  is_active?: boolean;
}

// ==================== RIESGO OCUPACIONAL (SST) ====================

export type ClasificacionRiesgo =
  | 'BIOLOGICO'
  | 'FISICO'
  | 'QUIMICO'
  | 'PSICOSOCIAL'
  | 'BIOMECANICO'
  | 'CONDICIONES_SEGURIDAD'
  | 'FENOMENOS_NATURALES';

export type NivelRiesgo = 'I' | 'II' | 'III' | 'IV';

export interface RiesgoOcupacional {
  id: number;
  code: string;
  name: string;
  clasificacion: ClasificacionRiesgo;
  clasificacion_display?: string;
  descripcion?: string;
  fuente?: string;
  efectos_posibles?: string;
  nivel_riesgo: NivelRiesgo;
  nivel_riesgo_display?: string;
  controles_existentes?: string;
  is_active: boolean;
}

// ==================== AREA (para FK) ====================

export interface AreaReference {
  id: number;
  code: string;
  name: string;
  full_path?: string;
}

// ==================== CARGO (EXTENDIDO CON MANUAL DE FUNCIONES) ====================

export type NivelJerarquico = 'ESTRATEGICO' | 'TACTICO' | 'OPERATIVO' | 'APOYO' | 'EXTERNO';

export type NivelEducativo =
  | 'PRIMARIA'
  | 'BACHILLER'
  | 'TECNICO'
  | 'TECNOLOGO'
  | 'PROFESIONAL'
  | 'ESPECIALIZACION'
  | 'MAESTRIA'
  | 'DOCTORADO';

export type ExperienciaRequerida =
  | 'SIN_EXPERIENCIA'
  | '6_MESES'
  | '1_ANO'
  | '2_ANOS'
  | '3_ANOS'
  | '5_ANOS'
  | '10_ANOS';

export interface ParentCargoReference {
  id: number;
  code: string;
  name: string;
  nivel_jerarquico: NivelJerarquico;
}

export interface RolSistemaReference {
  id: number;
  code: string;
  name: string;
  permissions_count: number;
}

export interface CargoUser {
  id: number;
  username: string;
  full_name: string;
  email: string;
  fecha_ingreso?: string;
  estado_empleado?: string;
}

/**
 * Cargo - Modelo completo con Manual de Funciones, Requisitos y SST
 */
export interface Cargo {
  id: number;

  // TAB 1: Identificacion y Ubicacion
  code: string;
  name: string;
  description?: string;
  area?: number;
  area_detail?: AreaReference;
  area_nombre?: string;
  area_code?: string;
  parent_cargo?: number;
  parent_cargo_detail?: ParentCargoReference;
  nivel_jerarquico: NivelJerarquico;
  nivel_jerarquico_display?: string;
  cantidad_posiciones: number;
  is_jefatura: boolean;
  is_externo: boolean;
  requiere_licencia_conduccion: boolean;
  categoria_licencia?: string;
  requiere_licencia_sst: boolean;
  requiere_tarjeta_contador: boolean;
  requiere_tarjeta_abogado: boolean;

  // TAB 2: Manual de Funciones
  objetivo_cargo?: string;
  funciones_responsabilidades: string[];
  autoridad_autonomia?: string;
  relaciones_internas?: string;
  relaciones_externas?: string;

  // TAB 3: Requisitos
  nivel_educativo?: NivelEducativo;
  nivel_educativo_display?: string;
  titulo_requerido?: string;
  experiencia_requerida?: ExperienciaRequerida;
  experiencia_requerida_display?: string;
  experiencia_especifica?: string;
  competencias_tecnicas: string[];
  competencias_blandas: string[];
  licencias_certificaciones: string[];
  formacion_complementaria?: string;

  // TAB 4: SST
  expuesto_riesgos?: number[];
  expuesto_riesgos_detail?: RiesgoOcupacional[];
  epp_requeridos: string[];
  examenes_medicos: string[];
  restricciones_medicas?: string;
  capacitaciones_sst: string[];

  // TAB 5: Permisos del Sistema
  rol_sistema?: number;
  rol_sistema_detail?: RolSistemaReference;
  permisos?: Permission[];
  default_roles?: Role[];
  permissions_count?: number;
  default_roles_count?: number;

  // Control
  is_system: boolean;
  is_active: boolean;
  version: number;
  fecha_aprobacion?: string;
  aprobado_por?: number;
  users_count?: number;
  usuarios_asignados_count?: number;
  posiciones_disponibles?: number;
  users?: CargoUser[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Cargo List - Version simplificada para listados
 */
export interface CargoList {
  id: number;
  code: string;
  name: string;
  description?: string;
  nivel_jerarquico: NivelJerarquico;
  nivel_jerarquico_display?: string;
  area?: number;
  area_nombre?: string;
  area_code?: string;
  cantidad_posiciones: number;
  is_jefatura: boolean;
  is_externo: boolean;
  is_system: boolean;
  is_active: boolean;
  version: number;
  permissions_count: number;
  users_count: number;
  posiciones_disponibles: number;
  default_roles_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCargoDTO {
  // Identificacion
  code: string;
  name: string;
  description?: string;

  // Ubicacion
  area?: number;
  parent_cargo?: number;
  nivel_jerarquico?: NivelJerarquico;

  // Configuracion
  cantidad_posiciones?: number;
  is_jefatura?: boolean;
  is_externo?: boolean;
  requiere_licencia_conduccion?: boolean;
  categoria_licencia?: string;
  requiere_licencia_sst?: boolean;
  requiere_tarjeta_contador?: boolean;
  requiere_tarjeta_abogado?: boolean;

  // Manual de funciones
  objetivo_cargo?: string;
  funciones_responsabilidades?: string[];
  autoridad_autonomia?: string;
  relaciones_internas?: string;
  relaciones_externas?: string;

  // Requisitos
  nivel_educativo?: NivelEducativo;
  titulo_requerido?: string;
  experiencia_requerida?: ExperienciaRequerida;
  experiencia_especifica?: string;
  competencias_tecnicas?: string[];
  competencias_blandas?: string[];
  licencias_certificaciones?: string[];
  formacion_complementaria?: string;

  // SST
  riesgo_ids?: number[];
  epp_requeridos?: string[];
  examenes_medicos?: string[];
  restricciones_medicas?: string;
  capacitaciones_sst?: string[];

  // Permisos
  rol_sistema?: number;
  permission_ids?: number[];
  default_role_ids?: number[];

  // Control
  is_active?: boolean;
}

export interface UpdateCargoDTO {
  // Identificacion (code no editable)
  name?: string;
  description?: string;

  // Ubicacion
  area?: number;
  parent_cargo?: number | null;
  nivel_jerarquico?: NivelJerarquico;

  // Configuracion
  cantidad_posiciones?: number;
  is_jefatura?: boolean;
  is_externo?: boolean;
  requiere_licencia_conduccion?: boolean;
  categoria_licencia?: string;
  requiere_licencia_sst?: boolean;
  requiere_tarjeta_contador?: boolean;
  requiere_tarjeta_abogado?: boolean;

  // Manual de funciones
  objetivo_cargo?: string;
  funciones_responsabilidades?: string[];
  autoridad_autonomia?: string;
  relaciones_internas?: string;
  relaciones_externas?: string;

  // Requisitos
  nivel_educativo?: NivelEducativo;
  titulo_requerido?: string;
  experiencia_requerida?: ExperienciaRequerida;
  experiencia_especifica?: string;
  competencias_tecnicas?: string[];
  competencias_blandas?: string[];
  licencias_certificaciones?: string[];
  formacion_complementaria?: string;

  // SST
  riesgo_ids?: number[];
  epp_requeridos?: string[];
  examenes_medicos?: string[];
  restricciones_medicas?: string;
  capacitaciones_sst?: string[];

  // Permisos
  rol_sistema?: number | null;
  permission_ids?: number[];
  default_role_ids?: number[];

  // Control
  is_active?: boolean;
  fecha_aprobacion?: string;
}

// ==================== GROUP ====================

export interface Group {
  id: number;
  code: string;
  name: string;
  description: string;
  roles?: Role[];
  roles_count: number;
  members?: GroupMember[];
  members_count: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GroupMember {
  user_id: number;
  username: string;
  full_name: string;
  cargo: string | null;
  is_leader: boolean;
  assigned_at: string;
}

export interface CreateGroupDTO {
  code: string;
  name: string;
  description?: string;
  role_ids?: number[];
  is_active?: boolean;
}

export interface UpdateGroupDTO {
  name?: string;
  description?: string;
  role_ids?: number[];
  is_active?: boolean;
}

// ==================== FILTERS ====================

export interface CargoFilters {
  [key: string]: unknown;
  search?: string;
  nivel_jerarquico?: NivelJerarquico;
  area?: number;
  is_active?: boolean;
  is_system?: boolean;
  is_jefatura?: boolean;
  include_inactive?: boolean;
  page?: number;
  page_size?: number;
}

export interface RoleFilters {
  [key: string]: unknown;
  search?: string;
  is_system?: boolean;
  is_active?: boolean;
  include_inactive?: boolean;
  page?: number;
  page_size?: number;
}

export interface GroupFilters {
  [key: string]: unknown;
  search?: string;
  is_active?: boolean;
  include_inactive?: boolean;
  page?: number;
  page_size?: number;
}

export interface PermissionFilters {
  [key: string]: unknown;
  search?: string;
  module?: string;
  action?: string;
  scope?: 'ALL' | 'OWN' | 'TEAM';
  is_active?: boolean;
  include_inactive?: boolean;
  page?: number;
  page_size?: number;
}

export interface RiesgoFilters {
  search?: string;
  clasificacion?: ClasificacionRiesgo;
  nivel_riesgo?: NivelRiesgo;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

// ==================== PAGINATED RESPONSES ====================

// PaginatedResponse: importar desde '@/types'
import type { PaginatedResponse } from '@/types';

export type PaginatedCargosResponse = PaginatedResponse<CargoList>;
export type PaginatedRolesResponse = PaginatedResponse<Role>;
export type PaginatedGroupsResponse = PaginatedResponse<Group>;
export type PaginatedPermissionsResponse = PaginatedResponse<Permission>;
export type PaginatedRiesgosResponse = PaginatedResponse<RiesgoOcupacional>;

// ==================== STATS ====================

export interface RBACStats {
  total_cargos: number;
  active_cargos: number;
  system_cargos: number;
  total_roles: number;
  active_roles: number;
  system_roles: number;
  total_groups: number;
  active_groups: number;
  total_permissions: number;
  active_permissions: number;
  total_users: number;
  users_with_cargo: number;
}

// ==================== CHOICES/OPTIONS ====================

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface CargoChoices {
  nivel_jerarquico_choices: SelectOption[];
  nivel_educativo_choices: SelectOption[];
  experiencia_choices: SelectOption[];
}

// ==================== HELPERS / LABELS ====================

export const NivelJerarquicoLabels: Record<NivelJerarquico, string> = {
  ESTRATEGICO: 'Estrategico',
  TACTICO: 'Tactico',
  OPERATIVO: 'Operativo',
  APOYO: 'Apoyo',
  EXTERNO: 'Externo',
};

export const NivelJerarquicoColors: Record<NivelJerarquico, string> = {
  ESTRATEGICO: 'purple',
  TACTICO: 'blue',
  OPERATIVO: 'green',
  APOYO: 'gray',
  EXTERNO: 'orange',
};

export const NivelEducativoLabels: Record<NivelEducativo, string> = {
  PRIMARIA: 'Primaria',
  BACHILLER: 'Bachiller',
  TECNICO: 'Tecnico',
  TECNOLOGO: 'Tecnologo',
  PROFESIONAL: 'Profesional',
  ESPECIALIZACION: 'Especializacion',
  MAESTRIA: 'Maestria',
  DOCTORADO: 'Doctorado',
};

export const ExperienciaLabels: Record<ExperienciaRequerida, string> = {
  SIN_EXPERIENCIA: 'Sin experiencia',
  '6_MESES': '6 meses',
  '1_ANO': '1 ano',
  '2_ANOS': '2 anos',
  '3_ANOS': '3 anos',
  '5_ANOS': '5 anos',
  '10_ANOS': '10+ anos',
};

export const ClasificacionRiesgoLabels: Record<ClasificacionRiesgo, string> = {
  BIOLOGICO: 'Biologico',
  FISICO: 'Fisico',
  QUIMICO: 'Quimico',
  PSICOSOCIAL: 'Psicosocial',
  BIOMECANICO: 'Biomecanico',
  CONDICIONES_SEGURIDAD: 'Condiciones de Seguridad',
  FENOMENOS_NATURALES: 'Fenomenos Naturales',
};

export const NivelRiesgoLabels: Record<NivelRiesgo, string> = {
  I: 'I - No Aceptable',
  II: 'II - No Aceptable o Aceptable con Control',
  III: 'III - Mejorable',
  IV: 'IV - Aceptable',
};

export const NivelRiesgoColors: Record<NivelRiesgo, string> = {
  I: 'red',
  II: 'orange',
  III: 'yellow',
  IV: 'green',
};

export const ScopeLabels: Record<string, string> = {
  ALL: 'Todo el sistema',
  OWN: 'Solo propios',
  TEAM: 'Equipo',
};

// ==================== SELECT OPTIONS ====================

export const NIVEL_JERARQUICO_OPTIONS: SelectOption[] = [
  { value: 'ESTRATEGICO', label: 'Estrategico' },
  { value: 'TACTICO', label: 'Tactico' },
  { value: 'OPERATIVO', label: 'Operativo' },
  { value: 'APOYO', label: 'Apoyo' },
  { value: 'EXTERNO', label: 'Externo' },  // Contratistas, consultores, auditores, socios
];

export const NIVEL_EDUCATIVO_OPTIONS: SelectOption[] = [
  { value: 'PRIMARIA', label: 'Primaria' },
  { value: 'BACHILLER', label: 'Bachiller' },
  { value: 'TECNICO', label: 'Tecnico' },
  { value: 'TECNOLOGO', label: 'Tecnologo' },
  { value: 'PROFESIONAL', label: 'Profesional' },
  { value: 'ESPECIALIZACION', label: 'Especializacion' },
  { value: 'MAESTRIA', label: 'Maestria' },
  { value: 'DOCTORADO', label: 'Doctorado' },
];

export const EXPERIENCIA_OPTIONS: SelectOption[] = [
  { value: 'SIN_EXPERIENCIA', label: 'Sin experiencia' },
  { value: '6_MESES', label: '6 meses' },
  { value: '1_ANO', label: '1 ano' },
  { value: '2_ANOS', label: '2 anos' },
  { value: '3_ANOS', label: '3 anos' },
  { value: '5_ANOS', label: '5 anos' },
  { value: '10_ANOS', label: '10+ anos' },
];

export const CLASIFICACION_RIESGO_OPTIONS: SelectOption[] = [
  { value: 'BIOLOGICO', label: 'Biologico' },
  { value: 'FISICO', label: 'Fisico' },
  { value: 'QUIMICO', label: 'Quimico' },
  { value: 'PSICOSOCIAL', label: 'Psicosocial' },
  { value: 'BIOMECANICO', label: 'Biomecanico' },
  { value: 'CONDICIONES_SEGURIDAD', label: 'Condiciones de Seguridad' },
  { value: 'FENOMENOS_NATURALES', label: 'Fenomenos Naturales' },
];

export const SCOPE_OPTIONS: SelectOption[] = [
  { value: 'ALL', label: 'Todo el sistema' },
  { value: 'OWN', label: 'Solo propios' },
  { value: 'TEAM', label: 'Equipo' },
];

// ==================== EPP SUGERIDOS ====================

export const EPP_SUGERIDOS = [
  'Casco de seguridad',
  'Gafas de proteccion',
  'Protector auditivo',
  'Mascarilla/Respirador',
  'Guantes de nitrilo',
  'Guantes de carnaza',
  'Botas de seguridad',
  'Botas de caucho',
  'Chaleco reflectivo',
  'Overol/Uniforme',
  'Delantal impermeable',
  'Careta facial',
  'Arnes de seguridad',
  'Linea de vida',
];

// ==================== EXAMENES MEDICOS SUGERIDOS ====================

export const EXAMENES_MEDICOS_SUGERIDOS = [
  'Examen medico de ingreso',
  'Examen medico periodico',
  'Audiometria',
  'Optometria',
  'Espirometria',
  'Visiometria',
  'Glicemia',
  'Perfil lipidico',
  'Cuadro hematico',
  'Prueba de esfuerzo',
  'Electrocardiograma',
  'Examen osteomuscular',
  'Evaluacion psicologica',
  'Pruebas de coordinacion',
];

// ==================== CAPACITACIONES SST SUGERIDAS ====================

export const CAPACITACIONES_SST_SUGERIDAS = [
  'Induccion SST',
  'Reinduccion SST',
  'Trabajo en alturas',
  'Manejo defensivo',
  'Primeros auxilios',
  'Uso de extintores',
  'Evacuacion y emergencias',
  'Manipulacion de cargas',
  'Riesgo quimico',
  'Riesgo biologico',
  'Prevencion de riesgo psicosocial',
  'Higiene postural',
  'Seguridad vial',
  'Manejo de residuos',
];
