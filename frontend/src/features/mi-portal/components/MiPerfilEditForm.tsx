/**
 * MiPerfilEditForm — Modal profesional para editar datos personales del colaborador.
 *
 * Usa BaseModal (design system) con:
 *  - Zod validation
 *  - 3 secciones: Contacto | Ubicación | Contacto de Emergencia
 *  - Select para parentesco
 *  - Branding colors en headers de sección
 *  - Reset automático al abrir con los datos actuales del perfil
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Phone, Mail, MapPin, Heart, Smartphone } from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { useUpdateMiPerfil } from '../api/miPortalApi';
import type { ColaboradorESS } from '../types';

// ── Zod schema ────────────────────────────────────────────────────────────────

const phoneRegex = /^[+\d\s\-()]*$/;

const schema = z.object({
  celular: z
    .string()
    .max(15, 'Máximo 15 caracteres')
    .regex(phoneRegex, 'Solo números, +, -, espacios y paréntesis')
    .optional()
    .or(z.literal('')),
  email_personal: z
    .string()
    .email('Ingresa un email válido')
    .max(254, 'Máximo 254 caracteres')
    .optional()
    .or(z.literal('')),
  telefono: z
    .string()
    .max(15, 'Máximo 15 caracteres')
    .regex(phoneRegex, 'Solo números, +, -, espacios y paréntesis')
    .optional()
    .or(z.literal('')),
  direccion: z.string().max(200, 'Máximo 200 caracteres').optional().or(z.literal('')),
  ciudad: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  contacto_emergencia_nombre: z
    .string()
    .max(200, 'Máximo 200 caracteres')
    .optional()
    .or(z.literal('')),
  contacto_emergencia_telefono: z
    .string()
    .max(15, 'Máximo 15 caracteres')
    .regex(phoneRegex, 'Solo números, +, -, espacios y paréntesis')
    .optional()
    .or(z.literal('')),
  contacto_emergencia_parentesco: z
    .string()
    .max(50, 'Máximo 50 caracteres')
    .optional()
    .or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

// ── Constants ─────────────────────────────────────────────────────────────────

const PARENTESCO_OPTIONS = [
  { value: 'padre', label: 'Padre / Madre' },
  { value: 'esposo', label: 'Esposo / Esposa' },
  { value: 'hijo', label: 'Hijo / Hija' },
  { value: 'hermano', label: 'Hermano / Hermana' },
  { value: 'abuelo', label: 'Abuelo / Abuela' },
  { value: 'tio', label: 'Tío / Tía' },
  { value: 'amigo', label: 'Amigo / Amiga' },
  { value: 'otro', label: 'Otro' },
];

// ── Section header ────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  primaryColor: string;
}

function SectionHeader({ icon, title, primaryColor }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${primaryColor}18` }}
      >
        <span style={{ color: primaryColor }}>{icon}</span>
      </div>
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
        {title}
      </h3>
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface MiPerfilEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  perfil: ColaboradorESS | undefined;
}

export function MiPerfilEditForm({ isOpen, onClose, perfil }: MiPerfilEditFormProps) {
  const updateMutation = useUpdateMiPerfil();
  const { primaryColor } = useBrandingConfig();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      celular: '',
      email_personal: '',
      telefono: '',
      direccion: '',
      ciudad: '',
      contacto_emergencia_nombre: '',
      contacto_emergencia_telefono: '',
      contacto_emergencia_parentesco: '',
    },
  });

  // Sincronizar form con perfil cada vez que el modal abre
  useEffect(() => {
    if (isOpen) {
      reset({
        celular: perfil?.celular ?? '',
        email_personal: perfil?.email_personal ?? '',
        telefono: perfil?.telefono ?? '',
        direccion: perfil?.direccion ?? '',
        ciudad: perfil?.ciudad ?? '',
        contacto_emergencia_nombre: perfil?.contacto_emergencia_nombre ?? '',
        contacto_emergencia_telefono: perfil?.contacto_emergencia_telefono ?? '',
        contacto_emergencia_parentesco: perfil?.contacto_emergencia_parentesco ?? '',
      });
    }
  }, [isOpen, perfil, reset]);

  const onSubmit = (data: FormData) => {
    updateMutation.mutate(data, { onSuccess: () => onClose() });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const isLoading = updateMutation.isPending;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Editar datos personales"
      subtitle="Actualiza tu información de contacto y emergencia"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            form="perfil-edit-form"
            type="submit"
            isLoading={isLoading}
            disabled={!isDirty || isLoading}
          >
            Guardar cambios
          </Button>
        </>
      }
    >
      <form id="perfil-edit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Sección 1: Contacto ─────────────────────────────────────────── */}
        <div>
          <SectionHeader
            icon={<Smartphone className="w-3.5 h-3.5" />}
            title="Contacto"
            primaryColor={primaryColor}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Celular"
              placeholder="300 123 4567"
              leftIcon={<Smartphone className="h-4 w-4 text-gray-400" />}
              {...register('celular')}
              error={errors.celular?.message}
              disabled={isLoading}
            />
            <Input
              label="Teléfono fijo"
              placeholder="601 234 5678"
              leftIcon={<Phone className="h-4 w-4 text-gray-400" />}
              {...register('telefono')}
              error={errors.telefono?.message}
              disabled={isLoading}
            />
          </div>
          <div className="mt-4">
            <Input
              label="Email personal"
              type="email"
              placeholder="tucorreo@personal.com"
              leftIcon={<Mail className="h-4 w-4 text-gray-400" />}
              {...register('email_personal')}
              error={errors.email_personal?.message}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* ── Sección 2: Ubicación ────────────────────────────────────────── */}
        <div>
          <SectionHeader
            icon={<MapPin className="w-3.5 h-3.5" />}
            title="Ubicación"
            primaryColor={primaryColor}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Ciudad"
              placeholder="Bogotá"
              {...register('ciudad')}
              error={errors.ciudad?.message}
              disabled={isLoading}
            />
            <Input
              label="Dirección de residencia"
              placeholder="Calle 123 # 45 - 67"
              leftIcon={<MapPin className="h-4 w-4 text-gray-400" />}
              {...register('direccion')}
              error={errors.direccion?.message}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* ── Sección 3: Contacto de emergencia ───────────────────────────── */}
        <div>
          <SectionHeader
            icon={<Heart className="w-3.5 h-3.5" />}
            title="Contacto de emergencia"
            primaryColor={primaryColor}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre completo"
              placeholder="Nombre del contacto"
              {...register('contacto_emergencia_nombre')}
              error={errors.contacto_emergencia_nombre?.message}
              disabled={isLoading}
            />
            <Select
              label="Parentesco"
              placeholder="Selecciona parentesco"
              options={PARENTESCO_OPTIONS}
              {...register('contacto_emergencia_parentesco')}
              error={errors.contacto_emergencia_parentesco?.message}
              disabled={isLoading}
            />
          </div>
          <div className="mt-4">
            <Input
              label="Teléfono de emergencia"
              placeholder="300 987 6543"
              leftIcon={<Phone className="h-4 w-4 text-gray-400" />}
              {...register('contacto_emergencia_telefono')}
              error={errors.contacto_emergencia_telefono?.message}
              disabled={isLoading}
            />
          </div>
        </div>
      </form>
    </BaseModal>
  );
}
