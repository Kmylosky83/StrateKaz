/**
 * Tipos para EmpresaConfig - Datos Fiscales y Legales de la Empresa
 * Sistema de Gestión Grasas y Huesos del Norte
 */

// Reutilizar SelectOption de strategic.types.ts
import type { SelectOption } from './strategic.types';

// ==============================================================================
// CHOICES/OPCIONES
// ==============================================================================

export type TipoSociedad =
  | 'SAS'
  | 'SA'
  | 'LTDA'
  | 'SCA'
  | 'SC'
  | 'COLECTIVA'
  | 'ESAL'
  | 'PERSONA_NATURAL'
  | 'SUCURSAL_EXTRANJERA'
  | 'OTRO';

export type RegimenTributario =
  | 'COMUN'
  | 'SIMPLE'
  | 'NO_RESPONSABLE'
  | 'ESPECIAL'
  | 'GRAN_CONTRIBUYENTE';

export type DepartamentoColombia =
  | 'AMAZONAS'
  | 'ANTIOQUIA'
  | 'ARAUCA'
  | 'ATLANTICO'
  | 'BOLIVAR'
  | 'BOYACA'
  | 'CALDAS'
  | 'CAQUETA'
  | 'CASANARE'
  | 'CAUCA'
  | 'CESAR'
  | 'CHOCO'
  | 'CORDOBA'
  | 'CUNDINAMARCA'
  | 'GUAINIA'
  | 'GUAVIARE'
  | 'HUILA'
  | 'LA_GUAJIRA'
  | 'MAGDALENA'
  | 'META'
  | 'NARINO'
  | 'NORTE_DE_SANTANDER'
  | 'PUTUMAYO'
  | 'QUINDIO'
  | 'RISARALDA'
  | 'SAN_ANDRES'
  | 'SANTANDER'
  | 'SUCRE'
  | 'TOLIMA'
  | 'VALLE_DEL_CAUCA'
  | 'VAUPES'
  | 'VICHADA';

export type FormatoFecha = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD-MM-YYYY';

export type Moneda = 'COP' | 'USD' | 'EUR';

export type ZonaHoraria =
  | 'America/Bogota'
  | 'America/New_York'
  | 'America/Los_Angeles'
  | 'America/Mexico_City'
  | 'Europe/Madrid'
  | 'UTC';

// ==============================================================================
// INTERFACES PRINCIPALES
// ==============================================================================

/**
 * Datos de la empresa - Respuesta completa del API
 */
export interface EmpresaConfig {
  id: number;

  // Datos de identificación fiscal
  nit: string;
  nit_sin_dv: string;
  digito_verificacion: string;
  razon_social: string;
  nombre_comercial: string | null;
  representante_legal: string;
  cedula_representante: string | null;
  tipo_sociedad: TipoSociedad;
  tipo_sociedad_display: string;
  actividad_economica: string | null;
  descripcion_actividad: string | null;
  regimen_tributario: RegimenTributario;
  regimen_tributario_display: string;

  // Datos de contacto
  direccion_fiscal: string;
  direccion_completa: string;
  ciudad: string;
  departamento: DepartamentoColombia;
  departamento_display: string;
  pais: string;
  codigo_postal: string | null;
  telefono_principal: string;
  telefono_secundario: string | null;
  email_corporativo: string;
  sitio_web: string | null;

  // Datos de registro
  matricula_mercantil: string | null;
  camara_comercio: string | null;
  fecha_constitucion: string | null;
  fecha_inscripcion_registro: string | null;

  // Configuración regional
  zona_horaria: ZonaHoraria;
  zona_horaria_display: string;
  formato_fecha: FormatoFecha;
  formato_fecha_display: string;
  moneda: Moneda;
  moneda_display: string;
  simbolo_moneda: string;
  separador_miles: string;
  separador_decimales: string;

  // Auditoría
  created_at: string;
  updated_at: string;
  updated_by: number | null;
  updated_by_name: string | null;
}

/**
 * Respuesta del API al obtener la configuración
 */
export interface EmpresaConfigResponse extends EmpresaConfig {
  configured: boolean;
}

/**
 * Datos para crear/actualizar la empresa
 */
export interface EmpresaConfigFormData {
  // Datos de identificación fiscal
  nit: string;
  razon_social: string;
  nombre_comercial?: string | null;
  representante_legal: string;
  cedula_representante?: string | null;
  tipo_sociedad: TipoSociedad;
  actividad_economica?: string | null;
  descripcion_actividad?: string | null;
  regimen_tributario: RegimenTributario;

  // Datos de contacto
  direccion_fiscal: string;
  ciudad: string;
  departamento: DepartamentoColombia;
  pais?: string;
  codigo_postal?: string | null;
  telefono_principal: string;
  telefono_secundario?: string | null;
  email_corporativo: string;
  sitio_web?: string | null;

  // Datos de registro
  matricula_mercantil?: string | null;
  camara_comercio?: string | null;
  fecha_constitucion?: string | null;
  fecha_inscripcion_registro?: string | null;

  // Configuración regional
  zona_horaria?: ZonaHoraria;
  formato_fecha?: FormatoFecha;
  moneda?: Moneda;
  simbolo_moneda?: string;
  separador_miles?: string;
  separador_decimales?: string;
}

/**
 * Respuesta del endpoint /choices
 */
export interface EmpresaConfigChoices {
  departamentos: SelectOption[];
  tipos_sociedad: SelectOption[];
  regimenes_tributarios: SelectOption[];
  formatos_fecha: SelectOption[];
  monedas: SelectOption[];
  zonas_horarias: SelectOption[];
}

// ==============================================================================
// CONSTANTES PARA USO LOCAL (fallback si el API no responde)
// ==============================================================================

export const TIPOS_SOCIEDAD: SelectOption[] = [
  { value: 'SAS', label: 'Sociedad por Acciones Simplificada (S.A.S.)' },
  { value: 'SA', label: 'Sociedad Anónima (S.A.)' },
  { value: 'LTDA', label: 'Sociedad Limitada (Ltda.)' },
  { value: 'SCA', label: 'Sociedad en Comandita por Acciones' },
  { value: 'SC', label: 'Sociedad en Comandita Simple' },
  { value: 'COLECTIVA', label: 'Sociedad Colectiva' },
  { value: 'ESAL', label: 'Entidad Sin Ánimo de Lucro' },
  { value: 'PERSONA_NATURAL', label: 'Persona Natural' },
  { value: 'SUCURSAL_EXTRANJERA', label: 'Sucursal de Sociedad Extranjera' },
  { value: 'OTRO', label: 'Otro' },
];

export const REGIMENES_TRIBUTARIOS: SelectOption[] = [
  { value: 'COMUN', label: 'Régimen Común (Responsable de IVA)' },
  { value: 'SIMPLE', label: 'Régimen Simple de Tributación (RST)' },
  { value: 'NO_RESPONSABLE', label: 'No Responsable de IVA' },
  { value: 'ESPECIAL', label: 'Régimen Tributario Especial' },
  { value: 'GRAN_CONTRIBUYENTE', label: 'Gran Contribuyente' },
];

export const FORMATOS_FECHA: SelectOption[] = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (31-12-2024)' },
];

export const MONEDAS: SelectOption[] = [
  { value: 'COP', label: 'Peso Colombiano (COP)' },
  { value: 'USD', label: 'Dólar Estadounidense (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
];

export const ZONAS_HORARIAS: SelectOption[] = [
  { value: 'America/Bogota', label: 'Colombia (America/Bogota)' },
  { value: 'America/New_York', label: 'Este EEUU (America/New_York)' },
  { value: 'America/Los_Angeles', label: 'Pacífico EEUU (America/Los_Angeles)' },
  { value: 'America/Mexico_City', label: 'México (America/Mexico_City)' },
  { value: 'Europe/Madrid', label: 'España (Europe/Madrid)' },
  { value: 'UTC', label: 'UTC' },
];
