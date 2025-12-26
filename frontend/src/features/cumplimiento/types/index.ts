/**
 * Barrel Export - Tipos de Cumplimiento
 *
 * Centraliza todos los tipos del módulo Motor de Cumplimiento.
 * Los enums están en MINÚSCULAS para coincidir exactamente con el backend Django.
 *
 * Estructura:
 * - matrizLegal: TipoNorma, NormaLegal, EmpresaNorma
 * - requisitosLegales: TipoRequisito, RequisitoLegal, EmpresaRequisito, AlertaVencimiento
 * - partesInteresadas: TipoParteInteresada, ParteInteresada, RequisitoParteInteresada, MatrizComunicacion
 * - reglamentos: TipoReglamento, Reglamento, VersionReglamento, PublicacionReglamento, SocializacionReglamento
 */

// ============================================================================
// MATRIZ LEGAL
// ============================================================================
export type {
  // Enums
  CumplimientoLevel,
  EstadoCumplimiento,
  SistemaGestion,
  // Tipos Base
  BaseTimestamped as MatrizLegalBaseTimestamped,
  BaseSoftDelete as MatrizLegalBaseSoftDelete,
  // Modelos
  TipoNorma,
  TipoNormaCreate,
  NormaLegal,
  NormaLegalList,
  NormaLegalCreateUpdate,
  EmpresaNorma,
  EmpresaNormaCreateUpdate,
  EvaluarCumplimiento,
} from './matrizLegal';

export { CUMPLIMIENTO_CHOICES, SISTEMAS_GESTION } from './matrizLegal';

// ============================================================================
// REQUISITOS LEGALES
// ============================================================================
export type {
  // Enums
  EstadoRequisito,
  TipoAlerta,
  // Tipos Base
  BaseTimestamped as RequisitosBaseTimestamped,
  BaseSoftDelete as RequisitosBaseSoftDelete,
  // Modelos
  TipoRequisito,
  TipoRequisitoCreate,
  RequisitoLegal,
  RequisitoLegalCreate,
  EmpresaRequisito,
  EmpresaRequisitoCreate,
  AlertaVencimiento,
  AlertaVencimientoCreate,
} from './requisitosLegales';

export { ESTADOS_REQUISITO, TIPOS_ALERTA } from './requisitosLegales';

// ============================================================================
// PARTES INTERESADAS
// ============================================================================
export type {
  // Enums
  CategoriaPI,
  NivelInfluencia,
  NivelInteres,
  TipoRequisitoPI,
  PrioridadRequisito,
  FrecuenciaComunicacion,
  MedioComunicacion,
  // Tipos Base
  BaseTimestamped as PartesInteresadasBaseTimestamped,
  BaseSoftDelete as PartesInteresadasBaseSoftDelete,
  BaseOrdered as PartesInteresadasBaseOrdered,
  // Modelos
  TipoParteInteresada,
  TipoParteInteresadaCreate,
  ParteInteresada,
  ParteInteresadaCreate,
  RequisitoParteInteresada,
  RequisitoParteInteresadaCreate,
  MatrizComunicacion,
  MatrizComunicacionCreate,
  // Filters
  ParteInteresadaFilters,
  // DTOs
  CreateTipoParteInteresadaDTO,
  UpdateTipoParteInteresadaDTO,
  CreateParteInteresadaDTO,
  UpdateParteInteresadaDTO,
  PaginatedResponse,
} from './partesInteresadas';

export {
  CATEGORIAS_PI,
  NIVELES_INFLUENCIA,
  NIVELES_INTERES,
  TIPOS_REQUISITO_PI,
  PRIORIDADES,
  FRECUENCIAS_COMUNICACION,
  MEDIOS_COMUNICACION,
} from './partesInteresadas';

// ============================================================================
// REGLAMENTOS INTERNOS
// ============================================================================
export type {
  // Enums
  EstadoReglamento,
  MedioPublicacion,
  TipoSocializacion,
  // Tipos Base
  BaseTimestamped as ReglamentosBaseTimestamped,
  BaseSoftDelete as ReglamentosBaseSoftDelete,
  BaseOrdered as ReglamentosBaseOrdered,
  // Modelos
  TipoReglamento,
  TipoReglamentoCreate,
  Reglamento,
  ReglamentoCreate,
  VersionReglamento,
  VersionReglamentoCreate,
  PublicacionReglamento,
  PublicacionReglamentoCreate,
  SocializacionReglamento,
  SocializacionReglamentoCreate,
} from './reglamentos';

export {
  ESTADOS_REGLAMENTO,
  MEDIOS_PUBLICACION,
  TIPOS_SOCIALIZACION,
} from './reglamentos';
