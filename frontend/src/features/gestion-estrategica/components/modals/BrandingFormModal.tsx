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
 * - login_background: Imagen de fondo para la página de login
 * - primary_color, secondary_color, accent_color: Paleta de colores
 * - PWA: pwa_name, pwa_short_name, pwa_description, colores e iconos
 *
 * NOTA: app_version se gestiona desde settings centralizados (no editable aquí)
 *
 * Usa Design System:
 * - BaseModal para el contenedor
 * - Input para formulario
 * - Switch para estado activo
 * - Button para acciones
 */
import { useState, useEffect, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Smartphone, Droplet } from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Switch } from '@/components/forms/Switch';
import { useCreateBranding, useUpdateBranding } from '../../hooks/useStrategic';
import type {
  BrandingConfig,
  CreateBrandingConfigDTO,
  UpdateBrandingConfigDTO,
} from '../../types/strategic.types';

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
  onClear?: () => void;
  isCleared?: boolean;
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

  useEffect(() => {
    setLocalCleared(isCleared);
  }, [isCleared]);

  useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else if (previewUrl && !localCleared) {
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
    if (file) {
      setLocalCleared(false);
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    setPreview(null);
    setLocalCleared(true);
    if (previewUrl && onClear) {
      onClear();
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
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
            <img src={preview} alt={label} className="h-16 max-w-[200px] object-contain" />
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
          <span className="text-sm text-gray-500 dark:text-gray-400">Click para subir</span>
        </button>
      )}

      {hint && <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
};

export const BrandingFormModal = ({ branding, isOpen, onClose }: BrandingFormModalProps) => {
  const isEditing = branding !== null && branding.id !== undefined;

  // Estado del formulario
  const [formData, setFormData] = useState({
    company_name: '',
    company_short_name: '',
    company_slogan: '',
    primary_color: '#16A34A',
    secondary_color: '#059669',
    accent_color: '#10B981',
    // Campos PWA
    pwa_name: '',
    pwa_short_name: '',
    pwa_description: '',
    pwa_theme_color: '#16A34A',
    pwa_background_color: '#FFFFFF',
    is_active: true,
  });

  // Estados para archivos de logos
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoWhiteFile, setLogoWhiteFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [loginBackgroundFile, setLoginBackgroundFile] = useState<File | null>(null);

  // Estados para archivos PWA
  const [pwaIcon192File, setPwaIcon192File] = useState<File | null>(null);
  const [pwaIcon512File, setPwaIcon512File] = useState<File | null>(null);
  const [pwaIconMaskableFile, setPwaIconMaskableFile] = useState<File | null>(null);

  // Estados para rastrear eliminaciones
  const [clearLogo, setClearLogo] = useState(false);
  const [clearLogoWhite, setClearLogoWhite] = useState(false);
  const [clearFavicon, setClearFavicon] = useState(false);
  const [clearLoginBackground, setClearLoginBackground] = useState(false);
  const [clearPwaIcon192, setClearPwaIcon192] = useState(false);
  const [clearPwaIcon512, setClearPwaIcon512] = useState(false);
  const [clearPwaIconMaskable, setClearPwaIconMaskable] = useState(false);

  const createMutation = useCreateBranding();
  const updateMutation = useUpdateBranding();

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (branding) {
      setFormData({
        company_name: branding.company_name,
        company_short_name: branding.company_short_name || '',
        company_slogan: branding.company_slogan || '',
        primary_color: branding.primary_color,
        secondary_color: branding.secondary_color || '#059669',
        accent_color: branding.accent_color || '#10B981',
        pwa_name: branding.pwa_name || '',
        pwa_short_name: branding.pwa_short_name || '',
        pwa_description: branding.pwa_description || '',
        pwa_theme_color: branding.pwa_theme_color || branding.primary_color || '#16A34A',
        pwa_background_color: branding.pwa_background_color || '#FFFFFF',
        is_active: branding.is_active,
      });
      // Reset file states
      setLogoFile(null);
      setLogoWhiteFile(null);
      setFaviconFile(null);
      setLoginBackgroundFile(null);
      setPwaIcon192File(null);
      setPwaIcon512File(null);
      setPwaIconMaskableFile(null);
      // Reset clear states
      setClearLogo(false);
      setClearLogoWhite(false);
      setClearFavicon(false);
      setClearLoginBackground(false);
      setClearPwaIcon192(false);
      setClearPwaIcon512(false);
      setClearPwaIconMaskable(false);
    } else {
      // Reset para nuevo branding
      setFormData({
        company_name: '',
        company_short_name: '',
        company_slogan: '',
        primary_color: '#16A34A',
        secondary_color: '#059669',
        accent_color: '#10B981',
        pwa_name: '',
        pwa_short_name: '',
        pwa_description: '',
        pwa_theme_color: '#16A34A',
        pwa_background_color: '#FFFFFF',
        is_active: true,
      });
      setLogoFile(null);
      setLogoWhiteFile(null);
      setFaviconFile(null);
      setLoginBackgroundFile(null);
      setPwaIcon192File(null);
      setPwaIcon512File(null);
      setPwaIconMaskableFile(null);
      setClearLogo(false);
      setClearLogoWhite(false);
      setClearFavicon(false);
      setClearLoginBackground(false);
      setClearPwaIcon192(false);
      setClearPwaIcon512(false);
      setClearPwaIconMaskable(false);
    }
  }, [branding]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar si hay cambios de archivos
    const hasFileChanges =
      logoFile ||
      logoWhiteFile ||
      faviconFile ||
      loginBackgroundFile ||
      pwaIcon192File ||
      pwaIcon512File ||
      pwaIconMaskableFile ||
      clearLogo ||
      clearLogoWhite ||
      clearFavicon ||
      clearLoginBackground ||
      clearPwaIcon192 ||
      clearPwaIcon512 ||
      clearPwaIconMaskable;

    // Construir FormData
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

    // Campos PWA (texto)
    if (formData.pwa_name) {
      formDataToSend.append('pwa_name', formData.pwa_name);
    }
    if (formData.pwa_short_name) {
      formDataToSend.append('pwa_short_name', formData.pwa_short_name);
    }
    if (formData.pwa_description) {
      formDataToSend.append('pwa_description', formData.pwa_description);
    }
    if (formData.pwa_theme_color) {
      formDataToSend.append('pwa_theme_color', formData.pwa_theme_color);
    }
    if (formData.pwa_background_color) {
      formDataToSend.append('pwa_background_color', formData.pwa_background_color);
    }

    // Archivos nuevos (logos)
    if (logoFile) formDataToSend.append('logo', logoFile);
    if (logoWhiteFile) formDataToSend.append('logo_white', logoWhiteFile);
    if (faviconFile) formDataToSend.append('favicon', faviconFile);
    if (loginBackgroundFile) formDataToSend.append('login_background', loginBackgroundFile);

    // Archivos nuevos (PWA)
    if (pwaIcon192File) formDataToSend.append('pwa_icon_192', pwaIcon192File);
    if (pwaIcon512File) formDataToSend.append('pwa_icon_512', pwaIcon512File);
    if (pwaIconMaskableFile) formDataToSend.append('pwa_icon_maskable', pwaIconMaskableFile);

    // Campos a limpiar (logos)
    if (clearLogo && !logoFile) formDataToSend.append('logo_clear', 'true');
    if (clearLogoWhite && !logoWhiteFile) formDataToSend.append('logo_white_clear', 'true');
    if (clearFavicon && !faviconFile) formDataToSend.append('favicon_clear', 'true');
    if (clearLoginBackground && !loginBackgroundFile)
      formDataToSend.append('login_background_clear', 'true');

    // Campos a limpiar (PWA)
    if (clearPwaIcon192 && !pwaIcon192File) formDataToSend.append('pwa_icon_192_clear', 'true');
    if (clearPwaIcon512 && !pwaIcon512File) formDataToSend.append('pwa_icon_512_clear', 'true');
    if (clearPwaIconMaskable && !pwaIconMaskableFile)
      formDataToSend.append('pwa_icon_maskable_clear', 'true');

    if (isEditing && branding && branding.id) {
      if (!hasFileChanges) {
        const updateData: UpdateBrandingConfigDTO = {
          company_name: formData.company_name,
          company_short_name: formData.company_short_name,
          company_slogan: formData.company_slogan || undefined,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          accent_color: formData.accent_color,
          pwa_name: formData.pwa_name || undefined,
          pwa_short_name: formData.pwa_short_name || undefined,
          pwa_description: formData.pwa_description || undefined,
          pwa_theme_color: formData.pwa_theme_color || undefined,
          pwa_background_color: formData.pwa_background_color || undefined,
          is_active: formData.is_active,
        };
        await updateMutation.mutateAsync({ id: branding.id, data: updateData });
      } else {
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
          pwa_name: formData.pwa_name || undefined,
          pwa_short_name: formData.pwa_short_name || undefined,
          pwa_description: formData.pwa_description || undefined,
          pwa_theme_color: formData.pwa_theme_color || undefined,
          pwa_background_color: formData.pwa_background_color || undefined,
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
      size="2xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ==================== INFORMACIÓN DE LA EMPRESA ==================== */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 uppercase tracking-wide">
            <ImageIcon className="h-4 w-4" />
            Información de la Empresa
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre Completo *"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder="StrateKaz Consultoria 4.0"
              required
            />

            <Input
              label="Nombre Corto *"
              value={formData.company_short_name}
              onChange={(e) => setFormData({ ...formData, company_short_name: e.target.value })}
              placeholder="StrateKaz"
              helperText="Se usa en documentos del SGI y sidebar"
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

        {/* ==================== LOGOS E IMÁGENES ==================== */}
        <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 uppercase tracking-wide">
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
              hint="Icono del navegador (32x32)"
              onClear={() => setClearFavicon(true)}
              isCleared={clearFavicon}
            />
          </div>

          <ImageUpload
            label="Fondo de Login"
            value={loginBackgroundFile}
            onChange={setLoginBackgroundFile}
            previewUrl={branding?.login_background}
            accept="image/png,image/jpeg,image/webp"
            hint="Imagen de fondo para login (1920x1080 recomendado)"
            onClear={() => setClearLoginBackground(true)}
            isCleared={clearLoginBackground}
          />
        </div>

        {/* ==================== PALETA DE COLORES ==================== */}
        <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 uppercase tracking-wide">
            <Droplet className="h-4 w-4" />
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
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vista Previa
            </p>
            <div className="flex gap-2">
              <div className="flex-1 text-center">
                <div
                  className="h-12 rounded-lg shadow-sm"
                  style={{ backgroundColor: formData.primary_color }}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                  Primario
                </span>
              </div>
              <div className="flex-1 text-center">
                <div
                  className="h-12 rounded-lg shadow-sm"
                  style={{ backgroundColor: formData.secondary_color }}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                  Secundario
                </span>
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

        {/* ==================== CONFIGURACIÓN PWA ==================== */}
        <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 uppercase tracking-wide">
            <Smartphone className="h-4 w-4" />
            Configuración PWA (App Móvil)
          </h4>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configura cómo se muestra la aplicación cuando se instala en dispositivos móviles.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre de la App"
              value={formData.pwa_name}
              onChange={(e) => setFormData({ ...formData, pwa_name: e.target.value })}
              placeholder="StrateKaz SGI"
              helperText="Nombre completo en el manifest.json"
            />

            <Input
              label="Nombre Corto (max 12 caracteres)"
              value={formData.pwa_short_name}
              onChange={(e) => setFormData({ ...formData, pwa_short_name: e.target.value })}
              placeholder="StrateKaz"
              helperText="Se muestra bajo el icono de la app"
              maxLength={12}
            />
          </div>

          <Textarea
            label="Descripción"
            value={formData.pwa_description}
            onChange={(e) => setFormData({ ...formData, pwa_description: e.target.value })}
            placeholder="Sistema de Gestión Integral para empresas..."
            helperText="Descripción de la aplicación para tiendas de apps"
            rows={2}
          />

          {/* Colores PWA */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color de Tema (barra de título)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.pwa_theme_color}
                  onChange={(e) => setFormData({ ...formData, pwa_theme_color: e.target.value })}
                  className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <Input
                  value={formData.pwa_theme_color}
                  onChange={(e) => setFormData({ ...formData, pwa_theme_color: e.target.value })}
                  placeholder="#16A34A"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color de Fondo (splash screen)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.pwa_background_color}
                  onChange={(e) =>
                    setFormData({ ...formData, pwa_background_color: e.target.value })
                  }
                  className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <Input
                  value={formData.pwa_background_color}
                  onChange={(e) =>
                    setFormData({ ...formData, pwa_background_color: e.target.value })
                  }
                  placeholder="#FFFFFF"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Iconos PWA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ImageUpload
              label="Icono 192x192"
              value={pwaIcon192File}
              onChange={setPwaIcon192File}
              previewUrl={branding?.pwa_icon_192}
              accept="image/png"
              hint="PNG 192x192 px"
              onClear={() => setClearPwaIcon192(true)}
              isCleared={clearPwaIcon192}
            />

            <ImageUpload
              label="Icono 512x512"
              value={pwaIcon512File}
              onChange={setPwaIcon512File}
              previewUrl={branding?.pwa_icon_512}
              accept="image/png"
              hint="PNG 512x512 px"
              onClear={() => setClearPwaIcon512(true)}
              isCleared={clearPwaIcon512}
            />

            <ImageUpload
              label="Icono Maskable"
              value={pwaIconMaskableFile}
              onChange={setPwaIconMaskableFile}
              previewUrl={branding?.pwa_icon_maskable}
              accept="image/png"
              hint="PNG 512x512 con padding"
              onClear={() => setClearPwaIconMaskable(true)}
              isCleared={clearPwaIconMaskable}
            />
          </div>
        </div>

        {/* ==================== ESTADO ACTIVO ==================== */}
        {isEditing && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center gap-3">
              <Switch
                label="Configuración Activa"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-14">
              Solo puede haber una configuración de marca activa
            </p>
          </div>
        )}
      </form>
    </BaseModal>
  );
};
