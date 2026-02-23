/**
 * MiPerfilEditForm - Modal para editar datos personales y foto de perfil.
 * Avatar centralizado: click en la foto abre el selector de imagen.
 */

import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Camera, Loader2 } from 'lucide-react';
import { Modal, Button, Avatar } from '@/components/common';
import { Input } from '@/components/forms';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { useAuthStore } from '@/store/authStore';
import { useUpdateMiPerfil, useUploadMiPhoto } from '../api/miPortalApi';
import type { InfoPersonalUpdateData, ColaboradorESS } from '../types';

interface MiPerfilEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  perfil: ColaboradorESS | undefined;
}

export function MiPerfilEditForm({ isOpen, onClose, perfil }: MiPerfilEditFormProps) {
  const updateMutation = useUpdateMiPerfil();
  const uploadPhotoMutation = useUploadMiPhoto();
  const { primaryColor } = useBrandingConfig();
  const user = useAuthStore((s) => s.user);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InfoPersonalUpdateData>({
    defaultValues: {
      telefono: perfil?.telefono || '',
      celular: perfil?.celular || '',
      direccion: perfil?.direccion || '',
      email_personal: perfil?.email_personal || '',
      contacto_emergencia_nombre: perfil?.contacto_emergencia_nombre || '',
      contacto_emergencia_telefono: perfil?.contacto_emergencia_telefono || '',
      contacto_emergencia_parentesco: perfil?.contacto_emergencia_parentesco || '',
    },
  });

  const onSubmit = (data: InfoPersonalUpdateData) => {
    updateMutation.mutate(data, { onSuccess: () => onClose() });
  };

  const handleAvatarClick = () => {
    if (!uploadPhotoMutation.isPending) fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadPhotoMutation.mutate(file);
    e.target.value = '';
  };

  const avatarSrc = perfil?.foto_url || user?.photo_url || undefined;
  const fullName = perfil?.nombre_completo || user?.full_name || user?.first_name || '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar perfil">
      {/* ----------------------------------------------------------------
          Sección avatar — punto único de cambio de foto
          ---------------------------------------------------------------- */}
      <div className="flex flex-col items-center mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        {/* Avatar clickeable con overlay */}
        <button
          type="button"
          onClick={handleAvatarClick}
          disabled={uploadPhotoMutation.isPending}
          className="relative group focus:outline-none"
          title="Cambiar foto de perfil"
        >
          <Avatar
            src={avatarSrc}
            name={fullName}
            size="2xl"
            className="ring-4 ring-white dark:ring-gray-800 shadow-md"
          />
          <div
            className={`absolute inset-0 rounded-full flex items-center justify-center transition-all duration-200 ${
              uploadPhotoMutation.isPending ? 'bg-black/50' : 'bg-black/0 group-hover:bg-black/40'
            }`}
          >
            {uploadPhotoMutation.isPending ? (
              <Loader2 className="w-7 h-7 text-white animate-spin" />
            ) : (
              <Camera className="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </button>

        <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">{fullName}</p>
        <button
          type="button"
          className="text-xs mt-1 hover:opacity-80 transition-opacity"
          style={{ color: primaryColor }}
          onClick={handleAvatarClick}
          disabled={uploadPhotoMutation.isPending}
        >
          {uploadPhotoMutation.isPending ? 'Subiendo foto...' : 'Cambiar foto'}
        </button>
      </div>

      {/* ----------------------------------------------------------------
          Formulario de datos personales
          ---------------------------------------------------------------- */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Teléfono fijo" {...register('telefono')} error={errors.telefono?.message} />
          <Input label="Celular" {...register('celular')} error={errors.celular?.message} />
        </div>

        <Input label="Dirección" {...register('direccion')} error={errors.direccion?.message} />

        <Input
          label="Email personal"
          type="email"
          {...register('email_personal')}
          error={errors.email_personal?.message}
        />

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Contacto de emergencia
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Nombre"
              {...register('contacto_emergencia_nombre')}
              error={errors.contacto_emergencia_nombre?.message}
            />
            <Input
              label="Teléfono"
              {...register('contacto_emergencia_telefono')}
              error={errors.contacto_emergencia_telefono?.message}
            />
            <Input
              label="Parentesco"
              {...register('contacto_emergencia_parentesco')}
              error={errors.contacto_emergencia_parentesco?.message}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
