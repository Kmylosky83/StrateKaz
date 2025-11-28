import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import type { User, CreateUserDTO, UpdateUserDTO, Cargo } from '@/types/users.types';

const createUserSchema = z
  .object({
    username: z.string().min(3, 'Mínimo 3 caracteres').max(20).regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guion bajo'),
    email: z.string().email('Email inválido'),
    first_name: z.string().min(2, 'Mínimo 2 caracteres'),
    last_name: z.string().min(2, 'Mínimo 2 caracteres'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    password_confirm: z.string(),
    cargo_id: z.number({ required_error: 'Selecciona un cargo' }),
    phone: z.string().optional(),
    document_type: z.enum(['CC', 'CE', 'NIT']),
    document_number: z.string().min(6, 'Mínimo 6 dígitos').max(11).regex(/^\d+$/, 'Solo números'),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['password_confirm'],
  });

const updateUserSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  cargo_id: z.number(),
  phone: z.string().optional(),
  document_type: z.enum(['CC', 'CE', 'NIT']),
  document_number: z.string().min(6).max(11).regex(/^\d+$/),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;
type UpdateUserFormData = z.infer<typeof updateUserSchema>;

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserDTO | UpdateUserDTO) => void;
  user?: User;
  cargos: Cargo[];
  isLoading?: boolean;
}

export const UserForm = ({ isOpen, onClose, onSubmit, user, cargos, isLoading }: UserFormProps) => {
  const isEditMode = !!user;
  const schema = isEditMode ? updateUserSchema : createUserSchema;

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<CreateUserFormData | UpdateUserFormData>({
    resolver: zodResolver(schema),
    defaultValues: isEditMode ? {
      username: user?.username || '',
      email: user?.email || '',
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      cargo_id: user?.cargo?.id || undefined,
      phone: user?.phone || '',
      document_type: user?.document_type || 'CC',
      document_number: user?.document_number || '',
    } : { document_type: 'CC' },
  });

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
    } else if (isOpen && !user) {
      reset({ document_type: 'CC' });
    }
  }, [isOpen, user, setValue, reset]);

  const handleFormSubmit = (data: CreateUserFormData | UpdateUserFormData) => {
    console.log('Datos del formulario:', data);
    if (isEditMode) {
      onSubmit(data as UpdateUserDTO);
    } else {
      // Los datos ya tienen la estructura correcta (cargo_id y password_confirm)
      const createData = data as CreateUserFormData;
      console.log('Datos a enviar al backend:', createData);
      onSubmit(createData as any);
    }
  };

  const cargoOptions = cargos.map(c => ({ value: c.id, label: `${c.name} - ${c.code}` }));
  const documentTypeOptions = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'NIT', label: 'NIT' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Editar Usuario' : 'Nuevo Usuario'} size="2xl">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nombre de Usuario *" {...register('username')} error={errors.username?.message} placeholder="usuario123" />
          <Input label="Email *" type="email" {...register('email')} error={errors.email?.message} placeholder="usuario@ejemplo.com" />
          <Input label="Nombres *" {...register('first_name')} error={errors.first_name?.message} placeholder="Juan" />
          <Input label="Apellidos *" {...register('last_name')} error={errors.last_name?.message} placeholder="Pérez" />
          
          {!isEditMode && (
            <>
              <Input label="Contraseña *" type="password" {...register('password')} error={errors.password?.message} placeholder="Mínimo 8 caracteres" />
              <Input label="Confirmar Contraseña *" type="password" {...register('password_confirm')} error={errors.password_confirm?.message} placeholder="Repetir contraseña" />
            </>
          )}

          <Select label="Cargo *" {...register('cargo_id', { valueAsNumber: true })} options={cargoOptions} error={errors.cargo_id?.message} placeholder="Selecciona un cargo" />
          <Input label="Teléfono" type="tel" {...register('phone')} error={errors.phone?.message} placeholder="3001234567" />
          <Select label="Tipo de Documento *" {...register('document_type')} options={documentTypeOptions} error={errors.document_type?.message} />
          <Input label="Número de Documento *" {...register('document_number')} error={errors.document_number?.message} placeholder="1234567890" />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button type="submit" isLoading={isLoading}>{isEditMode ? 'Actualizar' : 'Crear'} Usuario</Button>
        </div>
      </form>
    </Modal>
  );
};