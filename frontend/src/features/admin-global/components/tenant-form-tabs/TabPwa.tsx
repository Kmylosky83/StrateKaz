/**
 * Tab PWA - Configuracion de app movil, iconos.
 */
import { Smartphone } from 'lucide-react';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { ImageUpload } from './ImageUpload';
import type { TabPwaProps } from './types';

export const TabPwa = ({
  formData,
  handleChange,
  isEditing,
  pwaIcon192File,
  setPwaIcon192File,
  pwaIcon512File,
  setPwaIcon512File,
  pwaIconMaskableFile,
  setPwaIconMaskableFile,
  effectiveTenant,
  setClearImages,
}: TabPwaProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input
        label="Nombre de la App (PWA)"
        value={formData.pwa_name || ''}
        onChange={(e) => handleChange('pwa_name', e.target.value)}
        placeholder="Mi Empresa - ERP"
        helperText="Nombre completo de la aplicacion"
      />
      <Input
        label="Nombre Corto (max 12 caracteres)"
        value={formData.pwa_short_name || ''}
        onChange={(e) => handleChange('pwa_short_name', e.target.value)}
        placeholder="MiEmpresa"
        maxLength={12}
        helperText="Nombre para el icono del dispositivo"
      />
      <div className="md:col-span-2">
        <Textarea
          label="Descripcion de la App"
          value={formData.pwa_description || ''}
          onChange={(e) => handleChange('pwa_description', e.target.value)}
          placeholder="Sistema de gestion empresarial..."
          rows={2}
          helperText="Descripcion para tiendas de apps"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Color del Tema (PWA)
        </label>
        <div className="flex gap-2">
          <input
            type="color"
            value={formData.pwa_theme_color || '#6366F1'}
            onChange={(e) => handleChange('pwa_theme_color', e.target.value)}
            className="h-10 w-14 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
          <Input
            value={formData.pwa_theme_color || '#6366F1'}
            onChange={(e) => handleChange('pwa_theme_color', e.target.value)}
            placeholder="#6366F1"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">Color de la barra de estado del navegador</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Color de Fondo (PWA)
        </label>
        <div className="flex gap-2">
          <input
            type="color"
            value={formData.pwa_background_color || '#FFFFFF'}
            onChange={(e) => handleChange('pwa_background_color', e.target.value)}
            className="h-10 w-14 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
          <Input
            value={formData.pwa_background_color || '#FFFFFF'}
            onChange={(e) => handleChange('pwa_background_color', e.target.value)}
            placeholder="#FFFFFF"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">Color de fondo durante la carga de la app</p>
      </div>
      {/* Seccion de Iconos PWA - Solo en edicion */}
      {isEditing && (
        <>
          <div className="md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Iconos de la App
            </h4>
          </div>
          <ImageUpload
            label="Icono 192x192"
            value={pwaIcon192File}
            previewUrl={effectiveTenant?.pwa_icon_192}
            onChange={setPwaIcon192File}
            onClear={() => setClearImages((prev) => ({ ...prev, pwa_icon_192: true }))}
            accept="image/png"
            hint="PNG 192x192 px"
          />
          <ImageUpload
            label="Icono 512x512"
            value={pwaIcon512File}
            previewUrl={effectiveTenant?.pwa_icon_512}
            onChange={setPwaIcon512File}
            onClear={() => setClearImages((prev) => ({ ...prev, pwa_icon_512: true }))}
            accept="image/png"
            hint="PNG 512x512 px"
          />
          <ImageUpload
            label="Icono Maskable"
            value={pwaIconMaskableFile}
            previewUrl={effectiveTenant?.pwa_icon_maskable}
            onChange={setPwaIconMaskableFile}
            onClear={() => setClearImages((prev) => ({ ...prev, pwa_icon_maskable: true }))}
            accept="image/png"
            hint="PNG 512x512 con padding para safe zone"
          />
        </>
      )}
      {!isEditing && (
        <div className="md:col-span-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Los iconos PWA se pueden subir despues de crear la empresa.
          </p>
        </div>
      )}
    </div>
  );
};
