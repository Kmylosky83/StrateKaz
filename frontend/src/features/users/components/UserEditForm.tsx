/**
 * UserEditForm - Formulario de edicion de usuario (solo lectura/edicion, sin creacion)
 *
 * Gestion de Usuarios es un centro de control:
 * - Colaboradores se crean desde Mi Equipo > Colaboradores
 * - Proveedores se crean desde Supply Chain > Proveedores
 * - Clientes se crean desde Sales CRM > Clientes
 * - Admins tenant se crean desde Admin Global (DB)
 *
 * Este formulario solo permite editar datos de usuarios existentes.
 */
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User as UserIcon,
  Info,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Building2,
  Shield,
  AlertTriangle,
  Fingerprint,
} from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { useAuthStore } from '@/store/authStore';
import type { User, UpdateUserDTO, Cargo, NivelFirma } from '@/types/users.types';
import { NIVEL_FIRMA_LABELS, NIVEL_FIRMA_DESCRIPTIONS } from '@/types/users.types';

// =============================================================================
// SCHEMA
// =============================================================================

const updateUserSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  cargo_id: z.number(),
  phone: z.string().optional(),
  document_type: z.enum(['CC', 'CE', 'NIT']),
  document_number: z.string().min(6).max(11).regex(/^\d+$/),
});

type UpdateUserFormData = z.infer<typeof updateUserSchema>;

// =============================================================================
// HELP TEXTS
// =============================================================================

const HELP_TEXTS = {
  cargo:
    'El cargo define la posicion en el organigrama y otorga permisos automaticamente (configurados en Cargos).',
};

// =============================================================================
// COLLAPSIBLE SECTION
// =============================================================================

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  helpText?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
}

const Section = ({ title, icon, helpText, children, defaultOpen = true, badge }: SectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <span className="text-primary-600 dark:text-primary-400">{icon}</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{title}</span>
          {badge}
        </div>
        <div className="flex items-center gap-2">
          {helpText && (
            <div
              className="relative"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
              {showTooltip && (
                <div
                  className="fixed transform -translate-x-full -translate-y-full ml-4 mt-[-8px] w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg pointer-events-none"
                  style={{ zIndex: 9999 }}
                >
                  {helpText}
                  <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900" />
                </div>
              )}
            </div>
          )}
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>
      {isOpen && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
};

// =============================================================================
// NIVEL FIRMA SECTION (read-only)
// =============================================================================

const NIVEL_BADGE_STYLES: Record<NivelFirma, string> = {
  1: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  2: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  3: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const NivelFirmaSection = ({ user }: { user: User }) => {
  const nivel = (user.nivel_firma || 1) as NivelFirma;
  const isManual = user.nivel_firma_manual || false;
  const cargoNivel = user.cargo?.level ?? 0;

  const expectedFromCargo: NivelFirma = cargoNivel >= 3 ? 3 : cargoNivel >= 2 ? 2 : 1;

  return (
    <Section
      title="Firma Digital"
      icon={<Fingerprint className="w-5 h-5" />}
      defaultOpen={false}
      helpText="Nivel de verificacion 2FA al firmar documentos. Se hereda automaticamente del cargo."
      badge={
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${NIVEL_BADGE_STYLES[nivel]}`}
        >
          Nivel {nivel}
        </span>
      }
    >
      <div className="space-y-3">
        <div
          className={`p-3 rounded-lg border ${
            nivel === 3
              ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800'
              : nivel === 2
                ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800'
                : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {NIVEL_FIRMA_LABELS[nivel]}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {NIVEL_FIRMA_DESCRIPTIONS[nivel]}
              </p>
            </div>
            <Fingerprint
              className={`w-8 h-8 ${
                nivel === 3 ? 'text-red-400' : nivel === 2 ? 'text-amber-400' : 'text-gray-400'
              }`}
            />
          </div>
        </div>

        <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            {isManual ? (
              <p>
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  Nivel asignado manualmente
                </span>
                {' — no se actualiza al cambiar de cargo.'}
              </p>
            ) : (
              <p>
                Heredado del cargo:{' '}
                <span className="font-medium">{user.cargo?.name || 'Sin cargo'}</span>
                {user.cargo && ` (nivel jerarquico → firma nivel ${expectedFromCargo})`}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {([1, 2, 3] as NivelFirma[]).map((n) => (
            <div
              key={n}
              className={`p-2 rounded border text-center text-xs ${
                n === nivel
                  ? NIVEL_BADGE_STYLES[n] + ' border-current font-medium'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'
              }`}
            >
              <div className="font-medium">Nivel {n}</div>
              <div className="mt-0.5">{n === 1 ? 'Sin 2FA' : n === 2 ? 'TOTP' : 'TOTP + OTP'}</div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface UserEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateUserDTO) => void;
  user: User;
  cargos: Cargo[];
  isLoading?: boolean;
}

export const UserEditForm = ({
  isOpen,
  onClose,
  onSubmit,
  user,
  cargos,
  isLoading,
}: UserEditFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      username: user.username || '',
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      cargo_id: user.cargo?.id || undefined,
      phone: user.phone || '',
      document_type: user.document_type || 'CC',
      document_number: user.document_number || '',
    },
  });

  const selectedCargoId = watch('cargo_id');
  const selectedCargo = cargos.find((c) => c.id === selectedCargoId);

  // Deteccion de auto-degradacion del ultimo ADMIN
  const currentAuthUser = useAuthStore((state) => state.user);
  const isEditingSelf = currentAuthUser && user.id === currentAuthUser.id;
  const userHadAdminCargo = user.cargo?.code === 'ADMIN';
  const isChangingFromAdmin =
    isEditingSelf && userHadAdminCargo && selectedCargo && selectedCargo.code !== 'ADMIN';

  useEffect(() => {
    if (isOpen) {
      setValue('username', user.username);
      setValue('email', user.email);
      setValue('first_name', user.first_name);
      setValue('last_name', user.last_name);
      setValue('cargo_id', user.cargo?.id || 0);
      setValue('phone', user.phone || '');
      setValue('document_type', user.document_type || 'CC');
      setValue('document_number', user.document_number || '');
    }
  }, [isOpen, user, setValue]);

  const handleFormSubmit = (data: UpdateUserFormData) => {
    onSubmit(data as UpdateUserDTO);
  };

  const cargoOptions = cargos.map((c) => ({
    value: c.id,
    label: `${c.name}${c.description ? ` - ${c.description}` : ''}`,
  }));

  const documentTypeOptions = [
    { value: 'CC', label: 'Cedula de Ciudadania' },
    { value: 'CE', label: 'Cedula de Extranjeria' },
    { value: 'NIT', label: 'NIT' },
  ];

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Editar Usuario" size="3xl">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Alerta de Superusuario */}
        {user.is_superuser && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Este usuario es Superusuario del Tenant
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-300 mt-0.5">
                  Tiene acceso completo a todas las secciones y funcionalidades de este tenant,
                  independiente del cargo asignado.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECCION 1: INFORMACION PERSONAL */}
        <Section title="Informacion Personal" icon={<UserIcon className="w-5 h-5" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre de Usuario *"
              {...register('username')}
              error={errors.username?.message}
              placeholder="usuario123"
            />
            <Input
              label="Email *"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              placeholder="usuario@ejemplo.com"
            />
            <Input
              label="Nombres *"
              {...register('first_name')}
              error={errors.first_name?.message}
              placeholder="Juan"
            />
            <Input
              label="Apellidos *"
              {...register('last_name')}
              error={errors.last_name?.message}
              placeholder="Perez"
            />
            <Select
              label="Tipo Documento *"
              {...register('document_type')}
              options={documentTypeOptions}
              error={errors.document_type?.message}
            />
            <Input
              label="Numero de Documento *"
              {...register('document_number')}
              error={errors.document_number?.message}
              placeholder="1234567890"
            />
            <Input
              label="Telefono"
              type="tel"
              {...register('phone')}
              error={errors.phone?.message}
              placeholder="3001234567"
            />
          </div>
        </Section>

        {/* SECCION 2: POSICION ORGANIZACIONAL */}
        <Section
          title="Posicion Organizacional"
          icon={<Building2 className="w-5 h-5" />}
          helpText={HELP_TEXTS.cargo}
        >
          <Select
            label="Cargo en el Organigrama *"
            {...register('cargo_id', { valueAsNumber: true })}
            options={cargoOptions}
            error={errors.cargo_id?.message}
            placeholder="Selecciona el cargo"
          />

          {isChangingFromAdmin && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-red-800 dark:text-red-200">
                    Advertencia: Esta cambiando su propio cargo de Administrador
                  </p>
                  <p className="text-red-600 dark:text-red-300 mt-1">
                    Si usted es el unico administrador, perdera acceso a las funciones de
                    administracion. Asegurese de que otro usuario tenga el cargo ADMIN antes de
                    continuar.
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedCargo && !isChangingFromAdmin && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-200">
                    Cargo: {selectedCargo.name}
                  </p>
                  <p className="text-blue-600 dark:text-blue-300 mt-1">
                    Los permisos de acceso y acciones se configuran en Configuracion &rarr; Cargos.
                    {selectedCargo.level !== undefined && ` Nivel: ${selectedCargo.level}`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* SECCION 3: NIVEL DE FIRMA DIGITAL */}
        <NivelFirmaSection user={user} />

        {/* FOOTER */}
        <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Actualizar Usuario
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};
