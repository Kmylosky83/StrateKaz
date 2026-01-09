/**
 * UserForm - Formulario completo de usuario con claridad de roles
 *
 * Sistema de 3 tipos de "roles" claramente diferenciados:
 * 1. Cargo = Posicion organizacional (Operario, Supervisor)
 * 2. Roles Funcionales = Permisos RBAC adicionales (aprobador, auditor)
 * 3. Especialidades Certificadas = Roles legales/certificacion (COPASST, Brigadista)
 */
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User as UserIcon,
  Shield,
  Award,
  Info,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Building2,
  Lock,
} from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import type { User, CreateUserDTO, UpdateUserDTO, Cargo } from '@/types/users.types';
import type { Role } from '@/features/configuracion/types/rbac.types';
import { cn } from '@/lib/utils';

// =============================================================================
// SCHEMAS
// =============================================================================

const createUserSchema = z
  .object({
    username: z.string().min(3, 'Minimo 3 caracteres').max(20).regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, numeros y guion bajo'),
    email: z.string().email('Email invalido'),
    first_name: z.string().min(2, 'Minimo 2 caracteres'),
    last_name: z.string().min(2, 'Minimo 2 caracteres'),
    password: z.string().min(8, 'Minimo 8 caracteres'),
    password_confirm: z.string(),
    cargo_id: z.number({ required_error: 'Selecciona un cargo' }),
    role_ids: z.array(z.number()).optional(),
    phone: z.string().optional(),
    document_type: z.enum(['CC', 'CE', 'NIT']),
    document_number: z.string().min(6, 'Minimo 6 digitos').max(11).regex(/^\d+$/, 'Solo numeros'),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: 'Las contrasenas no coinciden',
    path: ['password_confirm'],
  });

const updateUserSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  cargo_id: z.number(),
  role_ids: z.array(z.number()).optional(),
  phone: z.string().optional(),
  document_type: z.enum(['CC', 'CE', 'NIT']),
  document_number: z.string().min(6).max(11).regex(/^\d+$/),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;
type UpdateUserFormData = z.infer<typeof updateUserSchema>;

// =============================================================================
// HELP TEXTS
// =============================================================================

const HELP_TEXTS = {
  cargo: 'El cargo define la posicion en el organigrama y otorga permisos base automaticamente.',
  roles: 'Roles funcionales adicionales que agregan permisos especificos mas alla del cargo.',
  especialidades: 'Roles certificados por ley (COPASST, Brigadista). Se gestionan en el modulo de Especialidades.',
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
                <div className="fixed transform -translate-x-full -translate-y-full ml-4 mt-[-8px] w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg pointer-events-none"
                  style={{ zIndex: 9999 }}
                >
                  {helpText}
                  <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900" />
                </div>
              )}
            </div>
          )}
          {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>
      {isOpen && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
};

// =============================================================================
// ROLE CHECKBOX
// =============================================================================

interface RoleCheckboxProps {
  role: Role;
  isSelected: boolean;
  onToggle: (roleId: number) => void;
}

const RoleCheckbox = ({ role, isSelected, onToggle }: RoleCheckboxProps) => (
  <label
    className={cn(
      'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
      isSelected
        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
    )}
  >
    <input
      type="checkbox"
      checked={isSelected}
      onChange={() => onToggle(role.id)}
      className="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
    />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{role.name}</span>
        {role.is_system && (
          <Badge variant="gray" size="sm">Sistema</Badge>
        )}
      </div>
      {role.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
          {role.description}
        </p>
      )}
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        {role.permissions_count} permisos
      </p>
    </div>
  </label>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserDTO | UpdateUserDTO) => void;
  user?: User & {
    roles?: Role[];
    roles_adicionales?: Array<{ id: number; nombre: string; tipo: string }>;
  };
  cargos: Cargo[];
  roles?: Role[];
  isLoading?: boolean;
}

export const UserForm = ({
  isOpen,
  onClose,
  onSubmit,
  user,
  cargos,
  roles = [],
  isLoading,
}: UserFormProps) => {
  const isEditMode = !!user;
  const schema = isEditMode ? updateUserSchema : createUserSchema;

  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>(
    user?.roles?.map(r => r.id) || []
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateUserFormData | UpdateUserFormData>({
    resolver: zodResolver(schema),
    defaultValues: isEditMode
      ? {
          username: user?.username || '',
          email: user?.email || '',
          first_name: user?.first_name || '',
          last_name: user?.last_name || '',
          cargo_id: user?.cargo?.id || undefined,
          role_ids: user?.roles?.map(r => r.id) || [],
          phone: user?.phone || '',
          document_type: user?.document_type || 'CC',
          document_number: user?.document_number || '',
        }
      : { document_type: 'CC', role_ids: [] },
  });

  const selectedCargoId = watch('cargo_id');
  const selectedCargo = cargos.find(c => c.id === selectedCargoId);

  useEffect(() => {
    if (isOpen && user) {
      setValue('username', user.username);
      setValue('email', user.email);
      setValue('first_name', user.first_name);
      setValue('last_name', user.last_name);
      setValue('cargo_id', user.cargo?.id || 0);
      setValue('phone', user.phone || '');
      setValue('document_type', user.document_type || 'CC');
      setValue('document_number', user.document_number || '');
      setSelectedRoleIds(user.roles?.map(r => r.id) || []);
    } else if (isOpen && !user) {
      reset({ document_type: 'CC', role_ids: [] });
      setSelectedRoleIds([]);
    }
  }, [isOpen, user, setValue, reset]);

  const handleRoleToggle = (roleId: number) => {
    setSelectedRoleIds(prev => {
      const newIds = prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId];
      setValue('role_ids', newIds);
      return newIds;
    });
  };

  const handleFormSubmit = (data: CreateUserFormData | UpdateUserFormData) => {
    const submitData = {
      ...data,
      role_ids: selectedRoleIds,
    };

    if (isEditMode) {
      onSubmit(submitData as UpdateUserDTO);
    } else {
      onSubmit(submitData as any);
    }
  };

  const cargoOptions = cargos.map(c => ({
    value: c.id,
    label: `${c.name}${c.description ? ` - ${c.description}` : ''}`,
  }));

  const documentTypeOptions = [
    { value: 'CC', label: 'Cedula de Ciudadania' },
    { value: 'CE', label: 'Cedula de Extranjeria' },
    { value: 'NIT', label: 'NIT' },
  ];

  // Agrupar roles por tipo
  const systemRoles = roles.filter(r => r.is_system);
  const customRoles = roles.filter(r => !r.is_system);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Usuario' : 'Nuevo Usuario'}
      size="3xl"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* SECCION 1: INFORMACION PERSONAL */}
        <Section
          title="Informacion Personal"
          icon={<UserIcon className="w-5 h-5" />}
        >
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
              label="Tipo de Documento *"
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

          {!isEditMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Input
                label="Contrasena *"
                type="password"
                {...register('password' as keyof CreateUserFormData)}
                error={(errors as any).password?.message}
                placeholder="Minimo 8 caracteres"
              />
              <Input
                label="Confirmar Contrasena *"
                type="password"
                {...register('password_confirm' as keyof CreateUserFormData)}
                error={(errors as any).password_confirm?.message}
                placeholder="Repetir contrasena"
              />
            </div>
          )}
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
            placeholder="Selecciona el cargo del empleado"
          />

          {selectedCargo && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-200">
                    Cargo: {selectedCargo.name}
                  </p>
                  <p className="text-blue-600 dark:text-blue-300 mt-1">
                    Este cargo otorga automaticamente los permisos base definidos en el Manual de Funciones.
                    {selectedCargo.level && ` Nivel: ${selectedCargo.level}`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* SECCION 3: ROLES FUNCIONALES (RBAC) */}
        {roles.length > 0 && (
          <Section
            title="Roles Funcionales"
            icon={<Shield className="w-5 h-5" />}
            helpText={HELP_TEXTS.roles}
            badge={
              selectedRoleIds.length > 0 && (
                <Badge variant="primary" size="sm">
                  {selectedRoleIds.length} seleccionados
                </Badge>
              )
            }
            defaultOpen={isEditMode && (user?.roles?.length || 0) > 0}
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Asigna roles adicionales para otorgar permisos especificos mas alla del cargo.
              Estos roles permiten funciones como aprobar documentos, auditar procesos, etc.
            </p>

            {customRoles.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  Roles Personalizados
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {customRoles.map(role => (
                    <RoleCheckbox
                      key={role.id}
                      role={role}
                      isSelected={selectedRoleIds.includes(role.id)}
                      onToggle={handleRoleToggle}
                    />
                  ))}
                </div>
              </div>
            )}

            {systemRoles.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  Roles del Sistema
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {systemRoles.map(role => (
                    <RoleCheckbox
                      key={role.id}
                      role={role}
                      isSelected={selectedRoleIds.includes(role.id)}
                      onToggle={handleRoleToggle}
                    />
                  ))}
                </div>
              </div>
            )}

            {roles.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No hay roles funcionales configurados en el sistema.
              </p>
            )}
          </Section>
        )}

        {/* SECCION 4: ESPECIALIDADES CERTIFICADAS (SOLO INFO) */}
        <Section
          title="Especialidades Certificadas"
          icon={<Award className="w-5 h-5" />}
          helpText={HELP_TEXTS.especialidades}
          defaultOpen={false}
          badge={
            user?.roles_adicionales && user.roles_adicionales.length > 0 && (
              <Badge variant="warning" size="sm">
                {user.roles_adicionales.length} asignadas
              </Badge>
            )
          }
        >
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Gestion de Especialidades Certificadas
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">
                  Las especialidades como <strong>COPASST</strong>, <strong>Brigadista</strong>,{' '}
                  <strong>Operador de Montacargas</strong>, etc. requieren certificacion y se
                  gestionan en el modulo especializado.
                </p>
                <p className="text-xs text-amber-500 dark:text-amber-400 mt-2">
                  Ir a: Direccion Estrategica &rarr; Organizacion &rarr; Especialidades Certificadas
                </p>

                {user?.roles_adicionales && user.roles_adicionales.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-700">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-2">
                      Especialidades asignadas actualmente:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {user.roles_adicionales.map(ra => (
                        <Badge key={ra.id} variant="warning" size="sm">
                          {ra.nombre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Section>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {isEditMode ? 'Actualizar' : 'Crear'} Usuario
          </Button>
        </div>
      </form>
    </Modal>
  );
};
