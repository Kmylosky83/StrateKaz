/**
 * Opciones de selección para campos del Tenant
 *
 * Compartido entre TenantFormModal (Admin Global) y EmpresaSection (Tenant Admin).
 * Los values deben coincidir con los choices del modelo Tenant en Django.
 */

export const TIPO_SOCIEDAD_OPTIONS = [
  { value: 'SAS', label: 'S.A.S. - Sociedad por Acciones Simplificada' },
  { value: 'SA', label: 'S.A. - Sociedad Anónima' },
  { value: 'LTDA', label: 'Ltda. - Sociedad Limitada' },
  { value: 'SCA', label: 'Sociedad en Comandita por Acciones' },
  { value: 'SC', label: 'Sociedad en Comandita Simple' },
  { value: 'COLECTIVA', label: 'Sociedad Colectiva' },
  { value: 'ESAL', label: 'Entidad Sin Ánimo de Lucro' },
  { value: 'PERSONA_NATURAL', label: 'Persona Natural' },
  { value: 'SUCURSAL_EXTRANJERA', label: 'Sucursal de Sociedad Extranjera' },
  { value: 'OTRO', label: 'Otro' },
] as const;

export const REGIMEN_OPTIONS = [
  { value: 'COMUN', label: 'Régimen Común (Responsable de IVA)' },
  { value: 'SIMPLE', label: 'Régimen Simple de Tributación (RST)' },
  { value: 'NO_RESPONSABLE', label: 'No Responsable de IVA' },
  { value: 'ESPECIAL', label: 'Régimen Tributario Especial' },
  { value: 'GRAN_CONTRIBUYENTE', label: 'Gran Contribuyente' },
] as const;

export const DEPARTAMENTOS_OPTIONS = [
  { value: 'AMAZONAS', label: 'Amazonas' },
  { value: 'ANTIOQUIA', label: 'Antioquia' },
  { value: 'ARAUCA', label: 'Arauca' },
  { value: 'ATLANTICO', label: 'Atlántico' },
  { value: 'BOLIVAR', label: 'Bolívar' },
  { value: 'BOYACA', label: 'Boyacá' },
  { value: 'CALDAS', label: 'Caldas' },
  { value: 'CAQUETA', label: 'Caquetá' },
  { value: 'CASANARE', label: 'Casanare' },
  { value: 'CAUCA', label: 'Cauca' },
  { value: 'CESAR', label: 'Cesar' },
  { value: 'CHOCO', label: 'Chocó' },
  { value: 'CORDOBA', label: 'Córdoba' },
  { value: 'CUNDINAMARCA', label: 'Cundinamarca' },
  { value: 'GUAINIA', label: 'Guainía' },
  { value: 'GUAVIARE', label: 'Guaviare' },
  { value: 'HUILA', label: 'Huila' },
  { value: 'LA_GUAJIRA', label: 'La Guajira' },
  { value: 'MAGDALENA', label: 'Magdalena' },
  { value: 'META', label: 'Meta' },
  { value: 'NARINO', label: 'Nariño' },
  { value: 'NORTE_DE_SANTANDER', label: 'Norte de Santander' },
  { value: 'PUTUMAYO', label: 'Putumayo' },
  { value: 'QUINDIO', label: 'Quindío' },
  { value: 'RISARALDA', label: 'Risaralda' },
  { value: 'SAN_ANDRES', label: 'San Andrés y Providencia' },
  { value: 'SANTANDER', label: 'Santander' },
  { value: 'SUCRE', label: 'Sucre' },
  { value: 'TOLIMA', label: 'Tolima' },
  { value: 'VALLE_DEL_CAUCA', label: 'Valle del Cauca' },
  { value: 'VAUPES', label: 'Vaupés' },
  { value: 'VICHADA', label: 'Vichada' },
] as const;

/**
 * Mapeo rápido de código a label para mostrar en modo lectura.
 */
export const TIPO_SOCIEDAD_MAP = Object.fromEntries(
  TIPO_SOCIEDAD_OPTIONS.map((o) => [o.value, o.label])
) as Record<string, string>;

export const DEPARTAMENTOS_MAP = Object.fromEntries(
  DEPARTAMENTOS_OPTIONS.map((o) => [o.value, o.label])
) as Record<string, string>;

export const REGIMEN_MAP = Object.fromEntries(
  REGIMEN_OPTIONS.map((o) => [o.value, o.label])
) as Record<string, string>;
