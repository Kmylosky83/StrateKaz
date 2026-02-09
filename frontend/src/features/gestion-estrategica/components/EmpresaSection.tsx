/**
 * Seccion de Datos de la Empresa
 *
 * Permite al Admin Tenant editar datos fiscales, contacto,
 * branding y configuracion regional de su empresa.
 *
 * Endpoint: GET/PATCH /api/tenant/tenants/me/
 */
import { useState } from 'react';
import {
  Building2,
  Phone,
  Palette,
  Globe,
  Save,
  X,
  Upload,
} from 'lucide-react';
import {
  Card,
  Button,
  BrandedSkeleton,
  SectionHeader,
} from '@/components/common';
import { Input } from '@/components/forms/Input';
import { useCurrentTenant, useUpdateCurrentTenant } from '../hooks/useStrategic';
import type { CurrentTenantData } from '../api/strategicApi';

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
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="#3B82F6"
        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50"
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
    const fileFields = ['logo', 'logo_white', 'logo_dark', 'favicon', 'login_background'];

    for (const [key, value] of Object.entries(formData)) {
      if (value === undefined || value === null) continue;
      if (['id', 'code', 'schema_name'].includes(key)) continue;

      if (fileFields.includes(key)) {
        if (value instanceof File) {
          fd.append(key, value);
        }
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
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
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
              <Input value={val('name')} onChange={(e) => handleChange('name', e.target.value)} disabled={!isEditing} />
            </FieldGroup>
            <FieldGroup label="NIT">
              <Input value={val('nit')} onChange={(e) => handleChange('nit', e.target.value)} disabled={!isEditing} />
            </FieldGroup>
            <FieldGroup label="Razón Social">
              <Input value={val('razon_social')} onChange={(e) => handleChange('razon_social', e.target.value)} disabled={!isEditing} />
            </FieldGroup>
            <FieldGroup label="Nombre Comercial">
              <Input value={val('nombre_comercial')} onChange={(e) => handleChange('nombre_comercial', e.target.value)} disabled={!isEditing} />
            </FieldGroup>
            <FieldGroup label="Representante Legal">
              <Input value={val('representante_legal')} onChange={(e) => handleChange('representante_legal', e.target.value)} disabled={!isEditing} />
            </FieldGroup>
            <FieldGroup label="Cédula Representante">
              <Input value={val('cedula_representante')} onChange={(e) => handleChange('cedula_representante', e.target.value)} disabled={!isEditing} />
            </FieldGroup>
            <FieldGroup label="Tipo de Sociedad">
              <Input value={val('tipo_sociedad')} onChange={(e) => handleChange('tipo_sociedad', e.target.value)} disabled={!isEditing} />
            </FieldGroup>
            <FieldGroup label="Actividad Económica">
              <Input value={val('actividad_economica')} onChange={(e) => handleChange('actividad_economica', e.target.value)} disabled={!isEditing} />
            </FieldGroup>
            <FieldGroup label="Régimen Tributario">
              <Input value={val('regimen_tributario')} onChange={(e) => handleChange('regimen_tributario', e.target.value)} disabled={!isEditing} />
            </FieldGroup>
          </div>
        </div>
      </Card>

      {/* Contacto */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Contacto
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FieldGroup label="Dirección Fiscal">
              <Input value={val('direccion_fiscal')} onChange={(e) => handleChange('direccion_fiscal', e.target.value)} disabled={!isEditing} />
            </FieldGroup>
            <FieldGroup label="Ciudad">
              <Input value={val('ciudad')} onChange={(e) => handleChange('ciudad', e.target.value)} disabled={!isEditing} />
            </FieldGroup>
            <FieldGroup label="Departamento">
              <Input value={val('departamento')} onChange={(e) => handleChange('departamento', e.target.value)} disabled={!isEditing} />
            </FieldGroup>
            <FieldGroup label="País">
              <Input value={val('pais')} onChange={(e) => handleChange('pais', e.target.value)} disabled={!isEditing} />
            </FieldGroup>
            <FieldGroup label="Teléfono Principal">
              <Input value={val('telefono_principal')} onChange={(e) => handleChange('telefono_principal', e.target.value)} disabled={!isEditing} />
            </FieldGroup>
            <FieldGroup label="Teléfono Secundario">
              <Input value={val('telefono_secundario')} onChange={(e) => handleChange('telefono_secundario', e.target.value)} disabled={!isEditing} />
            </FieldGroup>
            <FieldGroup label="Email Corporativo">
              <Input value={val('email_corporativo')} onChange={(e) => handleChange('email_corporativo', e.target.value)} disabled={!isEditing} />
            </FieldGroup>
            <FieldGroup label="Sitio Web">
              <Input value={val('sitio_web')} onChange={(e) => handleChange('sitio_web', e.target.value)} disabled={!isEditing} />
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
                      {field === 'logo' ? 'Logo Principal' : field === 'logo_white' ? 'Logo Claro' : 'Logo Oscuro'}
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
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Colores del Tema</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ColorPickerField label="Color Primario" value={val('primary_color')} onChange={(v) => handleChange('primary_color', v)} disabled={!isEditing} />
                <ColorPickerField label="Color Secundario" value={val('secondary_color')} onChange={(v) => handleChange('secondary_color', v)} disabled={!isEditing} />
                <ColorPickerField label="Color de Acento" value={val('accent_color')} onChange={(v) => handleChange('accent_color', v)} disabled={!isEditing} />
                <ColorPickerField label="Color Sidebar" value={val('sidebar_color')} onChange={(v) => handleChange('sidebar_color', v)} disabled={!isEditing} />
                <ColorPickerField label="Color de Fondo" value={val('background_color')} onChange={(v) => handleChange('background_color', v)} disabled={!isEditing} />
              </div>
            </div>

            {/* Slogan */}
            <FieldGroup label="Slogan de la Empresa">
              <Input value={val('company_slogan')} onChange={(e) => handleChange('company_slogan', e.target.value)} disabled={!isEditing} />
            </FieldGroup>
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
              <Input value={val('zona_horaria')} onChange={(e) => handleChange('zona_horaria', e.target.value)} disabled={!isEditing} />
            </FieldGroup>
            <FieldGroup label="Formato de Fecha">
              <Input value={val('formato_fecha')} onChange={(e) => handleChange('formato_fecha', e.target.value)} disabled={!isEditing} />
            </FieldGroup>
            <FieldGroup label="Moneda">
              <Input value={val('moneda')} onChange={(e) => handleChange('moneda', e.target.value)} disabled={!isEditing} />
            </FieldGroup>
            <FieldGroup label="Símbolo de Moneda">
              <Input value={val('simbolo_moneda')} onChange={(e) => handleChange('simbolo_moneda', e.target.value)} disabled={!isEditing} />
            </FieldGroup>
            <FieldGroup label="Separador de Miles">
              <Input value={val('separador_miles')} onChange={(e) => handleChange('separador_miles', e.target.value)} disabled={!isEditing} />
            </FieldGroup>
            <FieldGroup label="Separador de Decimales">
              <Input value={val('separador_decimales')} onChange={(e) => handleChange('separador_decimales', e.target.value)} disabled={!isEditing} />
            </FieldGroup>
          </div>
        </div>
      </Card>
    </div>
  );
};
