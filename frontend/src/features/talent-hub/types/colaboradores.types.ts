/**
 * Tipos TypeScript para Colaboradores - Talent Hub
 * Sistema de Gestión StrateKaz
 *
 * Basado en: backend/apps/talent_hub/colaboradores/models.py
 */

// =============================================================================
// ENUMS Y CHOICES
// =============================================================================

export type TipoDocumento = 'CC' | 'CE' | 'TI' | 'PA' | 'PEP' | 'PPT';

export type EstadoColaborador = 'activo' | 'inactivo' | 'suspendido' | 'retirado';

export type TipoContratoColaborador =
  | 'indefinido'
  | 'fijo'
  | 'obra_labor'
  | 'aprendizaje'
  | 'prestacion_servicios';

export type NivelEstudio =
  | 'primaria'
  | 'bachillerato'
  | 'tecnico'
  | 'tecnologo'
  | 'profesional'
  | 'especializacion'
  | 'maestria'
  | 'doctorado';

export type NivelIdioma = 'basico' | 'intermedio' | 'avanzado' | 'nativo';

export type TipoMovimiento =
  | 'contratacion'
  | 'ascenso'
  | 'traslado'
  | 'cambio_salario'
  | 'cambio_cargo'
  | 'cambio_contrato'
  | 'suspension'
  | 'reactivacion'
  | 'retiro';

export type TipoSangre = 'O+' | 'O-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';

export type TipoBanco =
  | 'bancolombia'
  | 'banco_bogota'
  | 'davivienda'
  | 'bbva'
  | 'banco_popular'
  | 'banco_occidente'
  | 'banco_caja_social'
  | 'colpatria'
  | 'av_villas'
  | 'nequi'
  | 'daviplata'
  | 'otro';

export type TipoCuenta = 'ahorros' | 'corriente';

export type Genero = 'M' | 'F' | 'O' | 'N';

export type EstadoCivil = 'soltero' | 'casado' | 'union_libre' | 'divorciado' | 'viudo';

// =============================================================================
// INTERFACES - Colaborador
// =============================================================================

export interface Colaborador {
  id: string;
  empresa: string;

  // Identificación
  numero_identificacion: string;
  tipo_documento: TipoDocumento;

  // Datos básicos
  primer_nombre: string;
  segundo_nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  nombre_completo?: string;

  // Usuario del sistema
  usuario?: {
    id: string;
    username: string;
    email: string;
  };

  // Estructura organizacional
  // List serializer: cargo/area son IDs (number), con _nombre como campo plano
  // Detail serializer: cargo_data/area_data son objetos anidados
  cargo: number | { id: number; name: string; code?: string };
  cargo_nombre?: string;
  area: number | { id: number; name: string };
  area_nombre?: string;

  // Información laboral
  fecha_ingreso: string;
  fecha_retiro: string | null;
  estado: EstadoColaborador;
  motivo_retiro: string;

  // Contratación
  tipo_contrato: TipoContratoColaborador;
  fecha_fin_contrato: string | null;

  // Salario
  salario: string; // Decimal as string
  auxilio_transporte: boolean;
  horas_semanales: number;

  // Contacto
  email_personal: string;
  telefono_movil: string;

  // Foto
  foto: string | null;

  // Observaciones
  observaciones: string;

  // Vínculo Parte Interesada (C1)
  parte_interesada_id?: number | null;
  parte_interesada_nombre?: string;

  // Propiedades calculadas
  antiguedad_dias?: number;
  antiguedad_anios?: number;
  esta_activo?: boolean;
  tiene_contrato_vigente?: boolean;

  // Metadata
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ColaboradorFormData {
  tipo_documento: TipoDocumento;
  numero_identificacion: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  cargo: string;
  area: string;
  fecha_ingreso: string;
  fecha_retiro?: string | null;
  estado?: EstadoColaborador;
  motivo_retiro?: string;
  tipo_contrato: TipoContratoColaborador;
  fecha_fin_contrato?: string | null;
  salario: string;
  auxilio_transporte?: boolean;
  horas_semanales?: number;
  email_personal?: string;
  telefono_movil?: string;
  observaciones?: string;
  parte_interesada_id?: number | null;
  parte_interesada_nombre?: string;
  usuario?: string;

  // Step 4: Acceso al sistema (write-only, no se almacena en Colaborador)
  crear_acceso?: boolean;
  email_corporativo?: string;
  username?: string;
}

// =============================================================================
// INTERFACES - Hoja de Vida
// =============================================================================

export interface Idioma {
  idioma: string;
  nivel: NivelIdioma;
}

export interface EstudioAdicional {
  titulo: string;
  institucion: string;
  anio: number;
  duracion_horas?: number;
}

export interface Certificacion {
  nombre: string;
  entidad: string;
  fecha_obtencion: string;
  fecha_vencimiento?: string;
  codigo_certificado?: string;
}

export interface ExperienciaLaboral {
  empresa: string;
  cargo: string;
  fecha_inicio: string;
  fecha_fin?: string;
  meses_duracion: number;
  funciones?: string;
  motivo_retiro?: string;
}

export interface ReferenciaLaboral {
  nombre: string;
  empresa: string;
  cargo: string;
  telefono: string;
  email?: string;
  relacion: string;
}

export interface HojaVida {
  id: string;
  empresa: string;
  colaborador: {
    id: string;
    nombre_completo: string;
    numero_identificacion: string;
  };

  // Educación
  nivel_estudio_maximo: NivelEstudio;
  titulo_academico: string;
  institucion: string;
  anio_graduacion: number | null;

  // Estudios adicionales
  estudios_adicionales: EstudioAdicional[];

  // Certificaciones
  certificaciones: Certificacion[];

  // Experiencia laboral previa
  experiencia_previa: ExperienciaLaboral[];

  // Idiomas
  idiomas: Idioma[];

  // Habilidades
  habilidades: string[];
  competencias_blandas: string[];

  // Referencias
  referencias_laborales: ReferenciaLaboral[];

  // Archivos
  cv_documento: string | null;
  certificados_estudios: string | null;

  // Observaciones
  observaciones: string;

  // Propiedades calculadas
  total_anios_experiencia?: number;
  tiene_formacion_completa?: boolean;

  // Metadata
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface HojaVidaFormData {
  colaborador: string;
  nivel_estudio_maximo?: NivelEstudio;
  titulo_academico?: string;
  institucion?: string;
  anio_graduacion?: number | null;
  estudios_adicionales?: EstudioAdicional[];
  certificaciones?: Certificacion[];
  experiencia_previa?: ExperienciaLaboral[];
  idiomas?: Idioma[];
  habilidades?: string[];
  competencias_blandas?: string[];
  referencias_laborales?: ReferenciaLaboral[];
  observaciones?: string;
}

// =============================================================================
// INTERFACES - Información Personal
// =============================================================================

export interface InfoPersonal {
  id: string;
  empresa: string;
  colaborador: {
    id: string;
    nombre_completo: string;
    numero_identificacion: string;
  };

  // Datos personales
  fecha_nacimiento: string | null;
  genero: Genero;
  estado_civil: EstadoCivil;

  // Dirección
  direccion: string;
  ciudad: string;
  departamento: string;
  telefono_fijo: string;

  // Contacto de emergencia
  nombre_contacto_emergencia: string;
  parentesco_contacto_emergencia: string;
  telefono_contacto_emergencia: string;

  // Datos bancarios
  banco: TipoBanco;
  tipo_cuenta: TipoCuenta;
  numero_cuenta: string;

  // Información de salud
  tipo_sangre: TipoSangre;
  alergias: string;
  medicamentos_permanentes: string;
  condiciones_medicas: string;
  eps: string;
  arl: string;
  fondo_pensiones: string;
  caja_compensacion: string;

  // Tallas
  talla_camisa: string;
  talla_pantalon: string;
  talla_zapatos: string;
  talla_overol: string;

  // Familia
  numero_hijos: number;
  personas_a_cargo: number;

  // Propiedades calculadas
  edad?: number;
  tiene_datos_bancarios?: boolean;
  tiene_contacto_emergencia?: boolean;

  // Metadata
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface InfoPersonalFormData {
  colaborador: string;
  fecha_nacimiento?: string | null;
  genero?: Genero;
  estado_civil?: EstadoCivil;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  telefono_fijo?: string;
  nombre_contacto_emergencia?: string;
  parentesco_contacto_emergencia?: string;
  telefono_contacto_emergencia?: string;
  banco?: TipoBanco;
  tipo_cuenta?: TipoCuenta;
  numero_cuenta?: string;
  tipo_sangre?: TipoSangre;
  alergias?: string;
  medicamentos_permanentes?: string;
  condiciones_medicas?: string;
  eps?: string;
  arl?: string;
  fondo_pensiones?: string;
  caja_compensacion?: string;
  talla_camisa?: string;
  talla_pantalon?: string;
  talla_zapatos?: string;
  talla_overol?: string;
  numero_hijos?: number;
  personas_a_cargo?: number;
}

// =============================================================================
// INTERFACES - Historial Laboral
// =============================================================================

export interface HistorialLaboral {
  id: string;
  empresa: string;
  colaborador: {
    id: string;
    nombre_completo: string;
    numero_identificacion: string;
  };

  // Tipo de movimiento
  tipo_movimiento: TipoMovimiento;
  fecha_movimiento: string;
  fecha_efectiva: string | null;

  // Cambios de cargo
  cargo_anterior?: {
    id: string;
    nombre: string;
  };
  cargo_nuevo?: {
    id: string;
    nombre: string;
  };

  // Cambios de área
  area_anterior?: {
    id: string;
    nombre: string;
  };
  area_nueva?: {
    id: string;
    nombre: string;
  };

  // Cambios salariales
  salario_anterior: string | null;
  salario_nuevo: string | null;

  // Detalles
  motivo: string;
  observaciones: string;
  documento_soporte: string | null;

  // Aprobación
  aprobado_por?: {
    id: string;
    nombre: string;
  };
  fecha_aprobacion: string | null;

  // Propiedades calculadas
  incremento_salarial?: {
    valor: number;
    porcentaje: number;
  };
  es_ascenso?: boolean;
  es_retiro?: boolean;

  // Metadata
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface HistorialLaboralFormData {
  colaborador: string;
  tipo_movimiento: TipoMovimiento;
  fecha_movimiento: string;
  fecha_efectiva?: string | null;
  cargo_anterior?: string;
  cargo_nuevo?: string;
  area_anterior?: string;
  area_nueva?: string;
  salario_anterior?: string | null;
  salario_nuevo?: string | null;
  motivo: string;
  observaciones?: string;
  aprobado_por?: string;
  fecha_aprobacion?: string | null;
}

// =============================================================================
// INTERFACES - Respuestas API
// =============================================================================

export interface ColaboradorResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Colaborador[];
}

export interface HojaVidaResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: HojaVida[];
}

export interface InfoPersonalResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: InfoPersonal[];
}

export interface HistorialLaboralResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: HistorialLaboral[];
}

// =============================================================================
// INTERFACES - Filtros
// =============================================================================

export interface ColaboradorFilters {
  estado?: EstadoColaborador;
  cargo?: string;
  area?: string;
  tipo_contrato?: TipoContratoColaborador;
  search?: string;
  is_active?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface HistorialLaboralFilters {
  colaborador?: string;
  tipo_movimiento?: TipoMovimiento;
  fecha_desde?: string;
  fecha_hasta?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

// =============================================================================
// INTERFACES - Estadísticas
// =============================================================================

export interface ColaboradorEstadisticas {
  total: number;
  activos: number;
  por_estado: Record<string, number>;
  por_tipo_contrato: Record<string, number>;
  por_area: Record<string, number>;
}

// =============================================================================
// INTERFACES - Colaborador Completo
// =============================================================================

export interface ColaboradorCompleto extends Colaborador {
  hoja_vida?: HojaVida;
  info_personal?: InfoPersonal;
  historial_laboral?: HistorialLaboral[];
}
