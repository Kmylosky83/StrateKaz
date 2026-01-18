/**
 * Barrel export para tipos de Dirección Estratégica
 */
export * from './strategic.types';
export * from './modules.types';
export * from './empresa.types';

// Gestión de Proyectos PMI
export * from './proyectos';

// Revision por Direccion (ISO 9.3)
export * from './revisionDireccion';

// Gestion Documental (migrado de HSEQ a N1)
export type {
  NivelDocumento,
  TipoPlantilla,
  EstadoPlantilla,
  EstadoDocumento,
  ClasificacionDocumento,
  TipoCambioVersion,
  TipoCampoFormulario,
  TipoControl,
  MedioDistribucion,
  TipoDocumento,
  PlantillaDocumento,
  Documento,
  VersionDocumento,
  CampoFormulario,
  ControlDocumental,
  ColumnaTabla,
  CondicionVisibilidad,
  ConfirmacionRecepcion,
  CreateTipoDocumentoDTO,
  CreatePlantillaDocumentoDTO,
  CreateDocumentoDTO,
  CreateCampoFormularioDTO,
  CreateControlDocumentalDTO,
  UpdateTipoDocumentoDTO,
  UpdatePlantillaDocumentoDTO,
  UpdateDocumentoDTO,
  UpdateCampoFormularioDTO,
  UpdateControlDocumentalDTO,
  TipoDocumentoFilters,
  PlantillaDocumentoFilters,
  DocumentoFilters,
  ControlDocumentalFilters,
  AprobarDocumentoDTO,
  PublicarDocumentoDTO,
  ConfirmarRecepcionDTO,
  EstadisticasDocumentales,
} from './gestion-documental.types';
