/**
 * Modal para crear/editar Configuración de Marca (Branding)
 *
 * Campos:
 * - company_name: Nombre completo de la empresa
 * - company_short_name: Nombre corto (para sidebar, headers)
 * - company_slogan: Eslogan opcional
 * - logo: Logo principal (fondo claro)
 * - logo_white: Logo blanco (fondo oscuro)
 * - favicon: Icono del navegador
 * - primary_color, secondary_color, accent_color: Paleta de colores
 *
 * Usa Design System:
 * - BaseModal para el contenedor
 * - Input para formulario
 * - Switch para estado activo
 * - Button para acciones
 */
import { useState, useEffect, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Switch } from '@/components/forms/Switch';
import { useCreateBranding, useUpdateBranding } from '../../hooks/useStrategic';
import type { BrandingConfig, CreateBrandingConfigDTO, UpdateBrandingConfigDTO } from '../../types/strategic.types';

interface BrandingFormModalProps {
  branding: BrandingConfig | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ImageUploadProps {
  label: string;
  value: string | File | null;
  onChange: (file: File | null) => void;
  previewUrl?: string | null;
  accept?: string;
  darkPreview?: boolean;
  hint?: string;
  onClear?: () => void; // Callback para marcar como "a eliminar" del servidor
  isCleared?: boolean;  // Indica si el archivo del servidor está marcado para eliminar
}

const ImageUpload = ({
  label,
  value,
  onChange,
  previewUrl,
  accept = 'image/*',
  darkPreview = false,
  hint,
  onClear,
  isCleared = false,
}: ImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [localCleared, setLocalCleared] = useState(false);

  // Resetear localCleared cuando isCleared cambie externamente (ej. al abrir modal de nuevo)
  useEffect(() => {
    setLocalCleared(isCleared);
  }, [isCleared]);

  useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else if (previewUrl && !localCleared) {
      // Solo mostrar previewUrl si no está marcado para eliminar
      setPreview(previewUrl);
    } else {
      setPreview(null);
    }
  }, [value, previewUrl, localCleared]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);
    // Si se selecciona un nuevo archivo, resetear el estado de cleared
    if (file) {
      setLocalCleared(false);
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    // Limpiar preview inmediatamente
    setPreview(null);
    setLocalCleared(true);
    // Si hay un archivo en el servidor, marcarlo para eliminar
    if (previewUrl && onClear) {
      onClear();
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative inline-block">
          <div
            className={`p-4 rounded-lg border-2 border-dashed ${
              darkPreview
                ? 'bg-gray-800 border-gray-600'
                : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600'
            }`}
          >
            <img
              src={preview}
              alt={label}
              className="h-16 max-w-[200px] object-contain"
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Upload className="h-6 w-6 text-gray-400 mb-1" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Click para subir
          </span>
        </button>
      )}

      {hint && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </div>
  );
};

export const BrandingFormModal = ({ branding, isOpen, onClose }: BrandingFormModalProps) => {
  // Solo es edición si branding existe Y tiene un id válido
  const isEditing = branding !== null && branding.id !== undefined;

  const [formData, setFormData] = useState({
    company_name: '',
    company_short_name: '',
    company_slogan: '',
    primary_color: '#16A34A',
    secondary_color: '#059669',
    accent_color: '#10B981',
    is_active: true,
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoWhiteFile, setLogoWhiteFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);

  // Estados para rastrear qué archivos del servidor deben eliminarse
  const [clearLogo, setClearLogo] = useState(false);
  const [clearLogoWhite, setClearLogoWhite] = useState(false);
  const [clearFavicon, setClearFavicon] = useState(false);

  const createMutation = useCreateBranding();
  const updateMutation = useUpdateBranding();

  useEffect(() => {
    if (branding) {
      setFormData({
        company_name: branding.company_name,
        company_short_name: branding.company_short_name || '',
        company_slogan: branding.company_slogan || '',
        primary_color: branding.primary_color,
        secondary_color: branding.secondary_color || '#059669',
        accent_color: branding.accent_color || '#10B981',
        is_active: branding.is_active,
      });
      // Reset file states when editing
      setLogoFile(null);
      setLogoWhiteFile(null);
      setFaviconFile(null);
      // Reset clear states
      setClearLogo(false);
      setClearLogoWhite(false);
      setClearFavicon(false);
    } else {
      setFormData({
        company_name: '',
        company_short_name: '',
        company_slogan: '',
        primary_color: '#16A34A',
        secondary_color: '#059669',
        accent_color: '#10B981',
        is_active: true,
      });
      setLogoFile(null);
      setLogoWhiteFile(null);
      setFaviconFile(null);
      setClearLogo(false);
      setClearLogoWhite(false);
      setClearFavicon(false);
    }
  }, [branding]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Determinar si hay archivos nuevos o campos a limpiar
    const hasFileChanges = logoFile || logoWhiteFile || faviconFile || clearLogo || clearLogoWhite || clearFavicon;

    // Para subir archivos o limpiarlos, necesitamos usar FormData
    const formDataToSend = new FormData();
    formDataToSend.append('company_name', formData.company_name);
    formDataToSend.append('company_short_name', formData.company_short_name);

    if (formData.company_slogan) {
      formDataToSend.append('company_slogan', formData.company_slogan);
    }

    formDataToSend.append('primary_color', formData.primary_color);
    formDataToSend.append('secondary_color', formData.secondary_color);
    formDataToSend.append('accent_color', formData.accent_color);
    formDataToSend.append('is_active', String(formData.is_active));

    // Archivos nuevos
    if (logoFile) {
      formDataToSend.append('logo', logoFile);
    }
    if (logoWhiteFile) {
      formDataToSend.append('logo_white', logoWhiteFile);
    }
    if (faviconFile) {
      formDataToSend.append('favicon', faviconFile);
    }

    // Campos a limpiar (eliminar archivo del servidor)
    if (clearLogo && !logoFile) {
      formDataToSend.append('logo_clear', 'true');
    }
    if (clearLogoWhite && !logoWhiteFile) {
      formDataToSend.append('logo_white_clear', 'true');
    }
    if (clearFavicon && !faviconFile) {
      formDataToSend.append('favicon_clear', 'true');
    }

    if (isEditing && branding && branding.id) {
      // Para update sin cambios de archivos, usar JSON
      if (!hasFileChanges) {
        const updateData: UpdateBrandingConfigDTO = {
          company_name: formData.company_name,
          company_short_name: formData.company_short_name,
          company_slogan: formData.company_slogan || undefined,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          accent_color: formData.accent_color,
          is_active: formData.is_active,
        };
        await updateMutation.mutateAsync({ id: branding.id, data: updateData });
      } else {
        // Con archivos o clear, usar FormData
        await updateMutation.mutateAsync({ id: branding.id, data: formDataToSend });
      }
    } else {
      if (!hasFileChanges) {
        const createData: CreateBrandingConfigDTO = {
          company_name: formData.company_name,
          company_short_name: formData.company_short_name,
          company_slogan: formData.company_slogan || undefined,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          accent_color: formData.accent_color,
        };
        await createMutation.mutateAsync(createData);
      } else {
        await createMutation.mutateAsync(formDataToSend);
      }
    }

    onClose();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button
        type="submit"
        variant="primary"
        onClick={handleSubmit}
        disabled={isLoading || !formData.company_name || !formData.company_short_name}
        isLoading={isLoading}
      >
        {isEditing ? 'Guardar Cambios' : 'Crear Configuración'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Marca' : 'Nueva Configuración de Marca'}
      subtitle="Personaliza la identidad visual del sistema"
      size="xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información de la empresa */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Información de la Empresa
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre Completo *"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder="Grasas y Huesos del Norte S.A.S."
              required
            />

            <Input
              label="Nombre Corto *"
              value={formData.company_short_name}
              onChange={(e) => setFormData({ ...formData, company_short_name: e.target.value })}
              placeholder="GRASHNORTE"
              helperText="Se usa en el sidebar y encabezados"
              required
            />
          </div>

          <Input
            label="Eslogan"
            value={formData.company_slogan}
            onChange={(e) => setFormData({ ...formData, company_slogan: e.target.value })}
            placeholder="Tu eslogan empresarial..."
          />
        </div>

        {/* Logos e Imágenes */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Logos e Imágenes
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ImageUpload
              label="Logo Principal"
              value={logoFile}
              onChange={setLogoFile}
              previewUrl={branding?.logo}
              accept="image/png,image/jpeg,image/svg+xml"
              hint="Para fondos claros (PNG, JPG, SVG)"
              onClear={() => setClearLogo(true)}
              isCleared={clearLogo}
            />

            <ImageUpload
              label="Logo Blanco"
              value={logoWhiteFile}
              onChange={setLogoWhiteFile}
              previewUrl={branding?.logo_white}
              accept="image/png,image/svg+xml"
              darkPreview
              hint="Para fondos oscuros (PNG, SVG)"
              onClear={() => setClearLogoWhite(true)}
              isCleared={clearLogoWhite}
            />

            <ImageUpload
              label="Favicon"
              value={faviconFile}
              onChange={setFaviconFile}
              previewUrl={branding?.favicon}
              accept="image/png,image/x-icon,image/ico"
              hint="Icono del navegador (32x32 o 64x64)"
              onClear={() => setClearFavicon(true)}
              isCleared={clearFavicon}
            />
          </div>
        </div>

        {/* Paleta de Colores */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Paleta de Colores
          </h4>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color Primario
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <Input
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  placeholder="#16A34A"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color Secundario
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <Input
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  placeholder="#059669"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color de Acento
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.accent_color}
                  onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                  className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <Input
                  value={formData.accent_color}
                  onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                  placeholder="#10B981"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Preview de colores */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vista Previa</p>
            <div className="flex gap-2">
              <div className="flex-1 text-center">
                <div
                  className="h-12 rounded-lg shadow-sm"
                  style={{ backgroundColor: formData.primary_color }}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Primario</span>
              </div>
              <div className="flex-1 text-center">
                <div
                  className="h-12 rounded-lg shadow-sm"
                  style={{ backgroundColor: formData.secondary_color }}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Secundario</span>
              </div>
              <div className="flex-1 text-center">
                <div
                  className="h-12 rounded-lg shadow-sm"
                  style={{ backgroundColor: formData.accent_color }}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Acento</span>
              </div>
            </div>
          </div>
        </div>

        {/* Estado activo (solo en edición) */}
        {isEditing && (
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Switch
                label="Configuración Activa"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 ml-14">
              Solo puede haber una configuración de marca activa
            </p>
          </div>
        )}
      </form>
    </BaseModal>
  );
};
