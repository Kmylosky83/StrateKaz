/**
 * Modal para crear/editar Roles
 *
 * Usa Design System:
 * - BaseModal para el contenedor
 * - Tabs para navegación interna
 * - Input, Textarea para formulario
 * - Alert para mensajes
 * - Badge para etiquetas
 * - Button para acciones
 */
import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Tabs } from '@/components/common/Tabs';
import { Alert } from '@/components/common/Alert';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { useCreateRole, useUpdateRole } from '../hooks/useRoles';
import { PermissionSelector } from './PermissionSelector';
import type { Role, CreateRoleDTO, UpdateRoleDTO } from '../types/rbac.types';
import type { Tab } from '@/components/common';

interface RoleFormModalProps {
  role: Role | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'general' | 'permisos';

const TABS: Tab[] = [
  { id: 'general', label: 'General' },
  { id: 'permisos', label: 'Permisos' },
];

export const RoleFormModal = ({ role, isOpen, onClose }: RoleFormModalProps) => {
  const isEditing = role !== null;

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
  });
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('general');

  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();

  useEffect(() => {
    if (role) {
      setFormData({
        code: role.code,
        name: role.name,
        description: role.description || '',
      });
      setSelectedPermissionIds(role.permisos?.map((p) => p.id) || []);
    } else {
      setFormData({
        code: '',
        name: '',
        description: '',
      });
      setSelectedPermissionIds([]);
    }
    setActiveTab('general');
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && role) {
      const updateData: UpdateRoleDTO = {
        name: formData.name,
        description: formData.description || undefined,
        permission_ids: selectedPermissionIds,
      };
      await updateMutation.mutateAsync({ id: role.id, data: updateData });
    } else {
      const createData: CreateRoleDTO = {
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
        permission_ids: selectedPermissionIds,
      };
      await createMutation.mutateAsync(createData);
    }

    onClose();
  };

  // Actualizar labels de tabs con conteos
  const tabsWithCounts: Tab[] = TABS.map((tab) => {
    if (tab.id === 'permisos') {
      return { ...tab, label: `Permisos (${selectedPermissionIds.length})` };
    }
    return tab;
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isSystemRole = role?.is_system;

  const title = (
    <div className="flex items-center gap-2">
      <span>{isEditing ? 'Editar Rol' : 'Nuevo Rol'}</span>
      {isSystemRole && (
        <Badge variant="gray" size="sm">
          <Lock className="h-3 w-3 mr-1" />
          Sistema
        </Badge>
      )}
    </div>
  );

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button
        type="submit"
        variant="primary"
        onClick={handleSubmit}
        disabled={isLoading || isSystemRole}
        isLoading={isLoading}
      >
        {isEditing ? 'Guardar Cambios' : 'Crear Rol'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Rol' : 'Nuevo Rol'}
      subtitle={isSystemRole ? 'Rol del sistema - Solo lectura' : undefined}
      size="2xl"
      footer={footer}
    >
      <div className="space-y-6">
        <Tabs
          tabs={tabsWithCounts}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as TabType)}
          variant="underline"
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'general' && (
            <>
              {isSystemRole && (
                <Alert
                  variant="warning"
                  message="Este es un rol del sistema. Solo puedes activar/desactivar el rol. Los permisos no pueden ser modificados."
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Código *"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="aprobador_recolecciones"
                  disabled={isEditing}
                  required
                  helperText={isEditing ? 'El código no se puede modificar' : undefined}
                />
                <Input
                  label="Nombre *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Aprobador de Recolecciones"
                  disabled={isSystemRole}
                  required
                />
              </div>

              <Textarea
                label="Descripción"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del rol..."
                disabled={isSystemRole}
                rows={3}
              />
            </>
          )}

          {activeTab === 'permisos' && (
            <>
              <Alert
                variant="info"
                message="Selecciona los permisos que tendrá este rol. Los usuarios con este rol heredarán automáticamente estos permisos."
              />
              <PermissionSelector
                selectedIds={selectedPermissionIds}
                onChange={setSelectedPermissionIds}
                disabled={isSystemRole}
              />
            </>
          )}
        </form>
      </div>
    </BaseModal>
  );
};
