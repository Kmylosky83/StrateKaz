/**
 * Seccion de Datos de la Empresa
 *
 * Permite al Admin Tenant editar datos fiscales, contacto,
 * branding y configuracion regional de su empresa.
 *
 * Endpoint: GET/PATCH /api/tenant/tenants/me/
 */
import { useState } from 'react';
import { Building2, Phone, Palette, Globe, Save, X, Upload, Smartphone, Info } from 'lucide-react';
import { Card, Button, BrandedSkeleton, SectionHeader } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCurrentTenant, useUpdateCurrentTenant } from '../hooks/useStrategic';
import type { CurrentTenantData } from '../api/strategicApi';
import {
  TIPO_SOCIEDAD_OPTIONS,
  TIPO_SOCIEDAD_MAP,
  REGIMEN_OPTIONS,
  REGIMEN_MAP,
  DEPARTAMENTOS_OPTIONS,
  DEPARTAMENTOS_MAP,
} from '@/constants/tenant-options';

// =============================================================================
// TYPES
// =============================================================================

type EditableFields = Partial<Omit<CurrentTenantData, 'id' | 'code'>>;

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface FieldGroupProps {
  label: string;
  children: React.ReactNode;
}

const FieldGroup = ({ label, children }: FieldGroupProps) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label}
    </label>
    {children}
  </div>
);

interface ColorPickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const ColorPickerField = ({ label, value, onChange, disabled }: ColorPickerFieldProps) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label}
    </label>
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value || '#3B82F6'}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-9 w-12 rounded border border-gray-300 dark:border-gray-600 cursor-pointer disabled:cursor-not-allowed"
      />
      <Input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="#3B82F6"
        className="flex-1"
      />
    </div>
  </div>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const EmpresaSection = () => {
  const { data: tenant, isLoading } = useCurrentTenant();
  const updateMutation = useUpdateCurrentTenant();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<EditableFields>({});

  const startEditing = () => {
    if (tenant) {
      setFormData({ ...tenant });
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setFormData({});
    setIsEditing(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFormData((prev) => ({ ...prev, [field]: file }));
  };

  const handleSave = async () => {
    const fd = new FormData();
    const fileFields = [
      'logo',
      'logo_white',
      'logo_dark',
      'favicon',
      'login_background',
      'pwa_icon_192',
      'pwa_icon_512',
      'pwa_icon_maskable',
    ];
    // Campos de solo lectura que no deben enviarse al backend
    const readOnlyFields = [
      'id',
      'code',
      'schema_name',
      'plan',
      'plan_name',
      'tier',
      'max_users',
      'max_storage_gb',
      'is_active',
      'is_trial',
      'trial_ends_at',
      'subscription_ends_at',
      'created_at',
      'updated_at',
      'schema_status',
      'schema_task_id',
      'schema_error',
      'enabled_modules',
      'is_subscription_valid',
      // URLs generadas por el serializer (no campos editables)
      'logo_url',
      'logo_effective',
      'primary_domain',
      'subdomain',
    ];

    for (const [key, value] of Object.entries(formData)) {
      if (value === undefined || value === null) continue;
      if (readOnlyFields.includes(key)) continue;

      if (fileFields.includes(key)) {
        // Solo enviar archivos nuevos (File), no URLs existentes (string)
        if (value instanceof File) {
          fd.append(key, value);
        }
      } else if (typeof value === 'boolean') {
        fd.append(key, value ? 'true' : 'false');
      } else if (typeof value === 'string' || typeof value === 'number') {
        fd.append(key, String(value));
      }
    }

    await updateMutation.mutateAsync(fd);
    setIsEditing(false);
  };

  if (isLoading) {
    return <BrandedSkeleton height="h-96" logoSize="xl" showText />;
  }

  if (!tenant) {
    return (
      <Card>
        <div className="p-6 text-center text-gray-500">
          No se pudieron cargar los datos de la empresa.
        </div>
      </Card>
    );
  }

  const val = (field: string): string => {
    if (isEditing && field in formData) {
      const v = formData[field as keyof EditableFields];
      return typeof v === 'string' ? v : '';
    }
    return String(tenant[field] || '');
  };

  /** Valor para mostrar en modo lectura con label amigable */
  const displayVal = (field: string, map?: Record<string, string>): string => {
    const raw = String(tenant[field] || '');
    if (map && raw in map) return map[raw];
    return raw;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SectionHeader
          icon={<Building2 className="h-5 w-5" />}
          title="Datos de la Empresa"
          description="Información fiscal, contacto, branding y configuración regional"
        />
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={cancelEditing}
                disabled={updateMutation.isPending}
              >
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                <Save className="h-4 w-4 mr-1" />
                {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={startEditing}>
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* Datos Fiscales */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Datos Fiscales
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FieldGroup label="Nombre de la Empresa">
              <Input
                value={val('name')}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={!isEditing}
              />
            </FieldGroup>
            <FieldGroup label="NIT">
              <Input
                value={val('nit')}
                onChange={(e) => handleChange('nit', e.target.value)}
                disabled={!isEditing}
              />
            </FieldGroup>
            <FieldGroup label="Razón Social">
              <Input
                value={val('razon_social')}
                onChange={(e) => handleChange('razon_social', e.target.value)}
                disabled={!isEditing}
              />
            </FieldGroup>
            <FieldGroup label="Nombre Comercial">
              <Input
                value={val('nombre_comercial')}
                onChange={(e) => handleChange('nombre_comercial', e.target.value)}
                disabled={!isEditing}
              />
            </FieldGroup>
            <FieldGroup label="Representante Legal">
              <Input
                value={val('representante_legal')}
                onChange={(e) => handleChange('representante_legal', e.target.value)}
                disabled={!isEditing}
              />
            </FieldGroup>
            <FieldGroup label="Cédula Representante">
              <Input
                value={val('cedula_representante')}
                onChange={(e) => handleChange('cedula_representante', e.target.value)}
                disabled={!isEditing}
              />
            </FieldGroup>
            <FieldGroup label="Tipo de Sociedad">
              {isEditing ? (
                <Select
                  value={val('tipo_sociedad')}
                  onChange={(e) => handleChange('tipo_sociedad', e.target.value)}
                  placeholder="Seleccionar..."
                  options={TIPO_SOCIEDAD_OPTIONS}
                />
              ) : (
                <Input value={displayVal('tipo_sociedad', TIPO_SOCIEDAD_MAP)} disabled />
              )}
            </FieldGroup>
            <FieldGroup label="Actividad Económica">
              <Input
                value={val('actividad_economica')}
                onChange={(e) => handleChange('actividad_economica', e.target.value)}
                disabled={!isEditing}
              />
            </FieldGroup>
            <FieldGroup label="Régimen Tributario">
              {isEditing ? (
                <Select
                  value={val('regimen_tributario')}
                  onChange={(e) => handleChange('regimen_tributario', e.target.value)}
                  placeholder="Seleccionar..."
                  options={REGIMEN_OPTIONS}
                />
              ) : (
                <Input value={displayVal('regimen_tributario', REGIMEN_MAP)} disabled />
              )}
            </FieldGroup>
          </div>
        </div>
      </Card>

      {/* Contacto */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Contacto</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FieldGroup label="Dirección Fiscal">
              <Input
                value={val('direccion_fiscal')}
                onChange={(e) => handleChange('direccion_fiscal', e.target.value)}
                disabled={!isEditing}
              />
            </FieldGroup>
            <FieldGroup label="Ciudad">
              <Input
                value={val('ciudad')}
                onChange={(e) => handleChange('ciudad', e.target.value)}
                disabled={!isEditing}
              />
            </FieldGroup>
            <FieldGroup label="Departamento">
              {isEditing ? (
                <Select
                  value={val('departamento')}
                  onChange={(e) => handleChange('departamento', e.target.value)}
                  placeholder="Seleccionar..."
                  options={DEPARTAMENTOS_OPTIONS}
                />
              ) : (
                <Input value={displayVal('departamento', DEPARTAMENTOS_MAP)} disabled />
              )}
            </FieldGroup>
            <FieldGroup label="País">
              <Input
                value={val('pais')}
                onChange={(e) => handleChange('pais', e.target.value)}
                disabled={!isEditing}
              />
            </FieldGroup>
            <FieldGroup label="Teléfono Principal">
              <Input
                value={val('telefono_principal')}
                onChange={(e) => handleChange('telefono_principal', e.target.value)}
                disabled={!isEditing}
              />
            </FieldGroup>
            <FieldGroup label="Teléfono Secundario">
              <Input
                value={val('telefono_secundario')}
                onChange={(e) => handleChange('telefono_secundario', e.target.value)}
                disabled={!isEditing}
              />
            </FieldGroup>
            <FieldGroup label="Email Corporativo">
              <Input
                value={val('email_corporativo')}
                onChange={(e) => handleChange('email_corporativo', e.target.value)}
                disabled={!isEditing}
              />
            </FieldGroup>
            <FieldGroup label="Sitio Web">
              <Input
                value={val('sitio_web')}
                onChange={(e) => handleChange('sitio_web', e.target.value)}
                disabled={!isEditing}
              />
            </FieldGroup>
          </div>
        </div>
      </Card>

      {/* Branding */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Branding y Tema
            </h3>
          </div>

          <div className="space-y-6">
            {/* Logos */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Logos</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['logo', 'logo_white', 'logo_dark'] as const).map((field) => (
                  <div key={field} className="space-y-2">
                    <label className="block text-sm text-gray-600 dark:text-gray-400">
                      {field === 'logo'
                        ? 'Logo Principal'
                        : field === 'logo_white'
                          ? 'Logo Claro'
                          : 'Logo Oscuro'}
                    </label>
                    {tenant[field] && (
                      <img
                        src={String(tenant[field])}
                        alt={field}
                        className="h-12 object-contain bg-gray-100 dark:bg-gray-800 rounded p-1"
                      />
                    )}
                    {isEditing && (
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-blue-600 hover:text-blue-700">
                        <Upload className="h-4 w-4" />
                        Cambiar
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(field, e.target.files?.[0] || null)}
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Colores */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Colores del Tema
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ColorPickerField
                  label="Color Primario"
                  value={val('primary_color')}
                  onChange={(v) => handleChange('primary_color', v)}
                  disabled={!isEditing}
                />
                <ColorPickerField
                  label="Color Secundario"
                  value={val('secondary_color')}
                  onChange={(v) => handleChange('secondary_color', v)}
                  disabled={!isEditing}
                />
                <ColorPickerField
                  label="Color de Acento"
                  value={val('accent_color')}
                  onChange={(v) => handleChange('accent_color', v)}
                  disabled={!isEditing}
                />
                <ColorPickerField
                  label="Color Sidebar"
                  value={val('sidebar_color')}
                  onChange={(v) => handleChange('sidebar_color', v)}
                  disabled={!isEditing}
                />
                <ColorPickerField
                  label="Color de Fondo"
                  value={val('background_color')}
                  onChange={(v) => handleChange('background_color', v)}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {/* Slogan */}
            <FieldGroup label="Slogan de la Empresa">
              <Input
                value={val('company_slogan')}
                onChange={(e) => handleChange('company_slogan', e.target.value)}
                disabled={!isEditing}
              />
            </FieldGroup>
          </div>
        </div>
      </Card>

      {/* Aplicacion Movil (PWA) */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Aplicación Móvil (PWA)
            </h3>
          </div>

          {/* Info contextual */}
          <div className="p-3 mb-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                Configura cómo se verá tu aplicación cuando los usuarios la instalen en sus
                dispositivos móviles. Si no se configuran, se usarán los valores de branding de la
                empresa.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Datos basicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldGroup label="Nombre de la App">
                <Input
                  value={val('pwa_name')}
                  onChange={(e) => handleChange('pwa_name', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Nombre completo de la aplicación"
                />
              </FieldGroup>
              <FieldGroup label="Nombre Corto">
                <Input
                  value={val('pwa_short_name')}
                  onChange={(e) => handleChange('pwa_short_name', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Max 12 caracteres (icono del escritorio)"
                />
              </FieldGroup>
            </div>

            <FieldGroup label="Descripción">
              <Textarea
                value={val('pwa_description')}
                onChange={(e) => handleChange('pwa_description', e.target.value)}
                disabled={!isEditing}
                placeholder="Breve descripción de la aplicación"
                rows={2}
                resize="none"
              />
            </FieldGroup>

            {/* Colores PWA */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Colores de la App
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorPickerField
                  label="Color de Tema (barra del navegador)"
                  value={val('pwa_theme_color')}
                  onChange={(v) => handleChange('pwa_theme_color', v)}
                  disabled={!isEditing}
                />
                <ColorPickerField
                  label="Color de Fondo (splash screen)"
                  value={val('pwa_background_color')}
                  onChange={(v) => handleChange('pwa_background_color', v)}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {/* Iconos PWA */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Iconos de la App
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(
                  [
                    {
                      field: 'pwa_icon_192',
                      label: 'Icono 192x192',
                      hint: 'Para dispositivos estandar',
                    },
                    {
                      field: 'pwa_icon_512',
                      label: 'Icono 512x512',
                      hint: 'Para pantallas de alta resolucion',
                    },
                    {
                      field: 'pwa_icon_maskable',
                      label: 'Icono Maskable',
                      hint: 'Con area segura para recorte adaptativo',
                    },
                  ] as const
                ).map(({ field, label, hint }) => (
                  <div key={field} className="space-y-2">
                    <label className="block text-sm text-gray-600 dark:text-gray-400">
                      {label}
                    </label>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{hint}</p>
                    {tenant[field] && (
                      <img
                        src={String(tenant[field])}
                        alt={label}
                        className="h-16 w-16 object-contain bg-gray-100 dark:bg-gray-800 rounded-lg p-1"
                      />
                    )}
                    {isEditing && (
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-indigo-600 hover:text-indigo-700">
                        <Upload className="h-4 w-4" />
                        {tenant[field] ? 'Cambiar' : 'Subir'}
                        <input
                          type="file"
                          accept="image/png"
                          className="hidden"
                          onChange={(e) => handleFileChange(field, e.target.files?.[0] || null)}
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Configuración Regional */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Configuración Regional
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FieldGroup label="Zona Horaria">
              <Input
                value={val('zona_horaria')}
                onChange={(e) => handleChange('zona_horaria', e.target.value)}
                disabled={!isEditing}
              />
            </FieldGroup>
            <FieldGroup label="Formato de Fecha">
              <Input
                value={val('formato_fecha')}
                onChange={(e) => handleChange('formato_fecha', e.target.value)}
                disabled={!isEditing}
              />
            </FieldGroup>
            <FieldGroup label="Moneda">
              <Input
                value={val('moneda')}
                onChange={(e) => handleChange('moneda', e.target.value)}
                disabled={!isEditing}
              />
            </FieldGroup>
            <FieldGroup label="Símbolo de Moneda">
              <Input
                value={val('simbolo_moneda')}
                onChange={(e) => handleChange('simbolo_moneda', e.target.value)}
                disabled={!isEditing}
              />
            </FieldGroup>
            <FieldGroup label="Separador de Miles">
              <Input
                value={val('separador_miles')}
                onChange={(e) => handleChange('separador_miles', e.target.value)}
                disabled={!isEditing}
              />
            </FieldGroup>
            <FieldGroup label="Separador de Decimales">
              <Input
                value={val('separador_decimales')}
                onChange={(e) => handleChange('separador_decimales', e.target.value)}
                disabled={!isEditing}
              />
            </FieldGroup>
          </div>
        </div>
      </Card>
    </div>
  );
};
