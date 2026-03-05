/**
 * Tab Branding - Logos, colores, imagenes de la empresa.
 */
import { Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/forms/Input';
import { ImageUpload } from './ImageUpload';
import type { TabBrandingProps } from './types';

export const TabBranding = ({
  formData,
  handleChange,
  isEditing,
  logoFile,
  setLogoFile,
  logoWhiteFile,
  setLogoWhiteFile,
  logoDarkFile,
  setLogoDarkFile,
  faviconFile,
  setFaviconFile,
  loginBackgroundFile,
  setLoginBackgroundFile,
  effectiveTenant,
  setClearImages,
}: TabBrandingProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <Input
          label="Slogan de la Empresa"
          value={formData.company_slogan || ''}
          onChange={(e) => handleChange('company_slogan', e.target.value)}
          placeholder="Innovacion con proposito"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Color Primario
        </label>
        <div className="flex gap-2">
          <input
            type="color"
            value={formData.primary_color || '#6366F1'}
            onChange={(e) => handleChange('primary_color', e.target.value)}
            className="h-10 w-14 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
          <Input
            value={formData.primary_color || '#6366F1'}
            onChange={(e) => handleChange('primary_color', e.target.value)}
            placeholder="#6366F1"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Color Secundario
        </label>
        <div className="flex gap-2">
          <input
            type="color"
            value={formData.secondary_color || '#10B981'}
            onChange={(e) => handleChange('secondary_color', e.target.value)}
            className="h-10 w-14 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
          <Input
            value={formData.secondary_color || '#10B981'}
            onChange={(e) => handleChange('secondary_color', e.target.value)}
            placeholder="#10B981"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Color de Acento
        </label>
        <div className="flex gap-2">
          <input
            type="color"
            value={formData.accent_color || '#F59E0B'}
            onChange={(e) => handleChange('accent_color', e.target.value)}
            className="h-10 w-14 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
          <Input
            value={formData.accent_color || '#F59E0B'}
            onChange={(e) => handleChange('accent_color', e.target.value)}
            placeholder="#F59E0B"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Color de Fondo
        </label>
        <div className="flex gap-2">
          <input
            type="color"
            value={formData.background_color || '#F5F5F5'}
            onChange={(e) => handleChange('background_color', e.target.value)}
            className="h-10 w-14 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
          <Input
            value={formData.background_color || '#F5F5F5'}
            onChange={(e) => handleChange('background_color', e.target.value)}
            placeholder="#F5F5F5"
          />
        </div>
      </div>
      {/* Seccion de Logos - Solo en edicion */}
      {isEditing && (
        <>
          <div className="md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Logos e Imagenes
            </h4>
          </div>
          <ImageUpload
            label="Logo Principal"
            value={logoFile}
            previewUrl={effectiveTenant?.logo}
            onChange={setLogoFile}
            onClear={() => setClearImages((prev) => ({ ...prev, logo: true }))}
            accept="image/png,image/jpeg,image/webp"
            hint="Para fondos claros (PNG, JPG, WebP)"
          />
          <ImageUpload
            label="Logo Blanco"
            value={logoWhiteFile}
            previewUrl={effectiveTenant?.logo_white}
            onChange={setLogoWhiteFile}
            onClear={() => setClearImages((prev) => ({ ...prev, logo_white: true }))}
            accept="image/png,image/jpeg,image/webp"
            hint="Para fondos oscuros (PNG, JPG, WebP)"
            darkPreview
          />
          <ImageUpload
            label="Logo Modo Oscuro"
            value={logoDarkFile}
            previewUrl={effectiveTenant?.logo_dark}
            onChange={setLogoDarkFile}
            onClear={() => setClearImages((prev) => ({ ...prev, logo_dark: true }))}
            accept="image/png,image/jpeg,image/webp"
            hint="Para el tema oscuro (PNG, JPG, WebP)"
            darkPreview
          />
          <ImageUpload
            label="Favicon"
            value={faviconFile}
            previewUrl={effectiveTenant?.favicon}
            onChange={setFaviconFile}
            onClear={() => setClearImages((prev) => ({ ...prev, favicon: true }))}
            accept="image/png,image/x-icon"
            hint="Icono del navegador (32x32 PNG)"
          />
          <div className="md:col-span-2">
            <ImageUpload
              label="Fondo de Login"
              value={loginBackgroundFile}
              previewUrl={effectiveTenant?.login_background}
              onChange={setLoginBackgroundFile}
              onClear={() => setClearImages((prev) => ({ ...prev, login_background: true }))}
              accept="image/png,image/jpeg,image/webp"
              hint="Imagen de fondo para la pagina de login (1920x1080 recomendado)"
            />
          </div>
        </>
      )}
      {!isEditing && (
        <div className="md:col-span-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Los logos se pueden subir despues de crear la empresa.
          </p>
        </div>
      )}
    </div>
  );
};
