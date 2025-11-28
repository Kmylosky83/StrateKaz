import { useState } from 'react';
import { UserPlus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { UsersTable } from '../components/UsersTable';
import { UserForm } from '../components/UserForm';
import { DeleteConfirmModal } from '@/components/users/DeleteConfirmModal';
import {
  useUsers,
  useCargos,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useToggleUserStatus,
} from '../hooks/useUsers';
import type { User, CreateUserDTO, UpdateUserDTO, UserFilters } from '@/types/users.types';

export default function UsersPage() {
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    cargo: '',
    is_active: undefined,
    page: 1,
    page_size: 10,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [userToDelete, setUserToDelete] = useState<User | undefined>();

  const { data: usersData, isLoading: isLoadingUsers } = useUsers(filters);
  const { data: cargos = [] } = useCargos();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const toggleStatusMutation = useToggleUserStatus();

  const handleOpenCreateForm = () => {
    setSelectedUser(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedUser(undefined);
  };

  const handleSubmit = async (data: CreateUserDTO | UpdateUserDTO) => {
    try {
      if (selectedUser) {
        await updateUserMutation.mutateAsync({
          id: selectedUser.id,
          data: data as UpdateUserDTO,
        });
      } else {
        await createUserMutation.mutateAsync(data as CreateUserDTO);
      }
      handleCloseForm();
    } catch (error: any) {
      console.error('Error submitting form:', error);
      console.error('Error response:', error.response?.data);
      alert(`Error: ${JSON.stringify(error.response?.data || error.message)}`);
    }
  };

  const handleOpenDeleteModal = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(undefined);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      try {
        await deleteUserMutation.mutateAsync(userToDelete.id);
        handleCloseDeleteModal();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await toggleStatusMutation.mutateAsync({
        id: user.id,
        is_active: !user.is_active,
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const handleFilterChange = (key: keyof UserFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const cargoFilterOptions = [
    { value: '', label: 'Todos los cargos' },
    ...cargos.map((cargo) => ({ value: String(cargo.id), label: cargo.name })),
  ];

  const statusFilterOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'true', label: 'Activos' },
    { value: 'false', label: 'Inactivos' },
  ];

  const users = usersData?.results || [];
  const totalUsers = usersData?.count || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Gestión de Usuarios
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Total de usuarios: {totalUsers}
          </p>
        </div>
        <Button onClick={handleOpenCreateForm} leftIcon={<UserPlus className="h-4 w-4" />}>
          Nuevo Usuario
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Buscar"
              placeholder="Nombre o username..."
              leftIcon={<Search className="h-4 w-4" />}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <Select
              label="Cargo"
              options={cargoFilterOptions}
              value={filters.cargo}
              onChange={(e) => handleFilterChange('cargo', e.target.value)}
            />
            <Select
              label="Estado"
              options={statusFilterOptions}
              value={String(filters.is_active || '')}
              onChange={(e) =>
                handleFilterChange(
                  'is_active',
                  e.target.value === '' ? undefined : e.target.value === 'true'
                )
              }
            />
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <UsersTable
        users={users}
        isLoading={isLoadingUsers}
        onEdit={handleOpenEditForm}
        onDelete={handleOpenDeleteModal}
        onToggleStatus={handleToggleStatus}
      />

      {/* Pagination */}
      {usersData && usersData.count > filters.page_size! && (
        <Card>
          <div className="p-4 flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Mostrando {(filters.page! - 1) * filters.page_size! + 1} -{' '}
              {Math.min(filters.page! * filters.page_size!, totalUsers)} de {totalUsers}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFilterChange('page', filters.page! - 1)}
                disabled={!usersData.previous}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFilterChange('page', filters.page! + 1)}
                disabled={!usersData.next}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Modals */}
      <UserForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        user={selectedUser}
        cargos={cargos}
        isLoading={createUserMutation.isPending || updateUserMutation.isPending}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        userName={userToDelete?.full_name || ''}
        isLoading={deleteUserMutation.isPending}
      />
    </div>
  );
}
