/**
 * Modal para crear/editar Módulos del Sistema
 *
 * Usa Design System:
 * - BaseModal para el contenedor
 * - Input, Textarea, Select para formulario
 * - Switch para opciones
 * - Alert para información
 * - Button para acciones
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Alert } from '@/components/common/Alert';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import { Switch } from '@/components/forms/Switch';
import { Checkbox } from '@/components/forms/Checkbox';
import { Lock } from 'lucide-react';
import {
  useCreateModule,
  useUpdateModule,
  useModuleCategories,
  useModules,
} from '../../hooks/useStrategic';
import type {
  SystemModule,
  CreateSystemModuleDTO,
  UpdateSystemModuleDTO,
  ModuleCategory,
} from '../../types/strategic.types';

interface ModuleFormModalProps {
  module: SystemModule | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ModuleFormModal = ({ module, isOpen, onClose }: ModuleFormModalProps) => {
  const isEditing = module !== null;

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: 'SUPPORT' as ModuleCategory,
    icon: '',
    route: '',
    is_core: false,
    is_enabled: true,
    order: 0,
    dependency_ids: [] as number[],
  });

  const createMutation = useCreateModule();
  const updateMutation = useUpdateModule();
  const { data: categories } = useModuleCategories();
  const { data: modulesData } = useModules();

  // Obtener módulos disponibles para dependencias (excluyendo el actual)
  const allModules = Array.isArray(modulesData) ? modulesData : [];
  const availableModules = allModules.filter((m) => m.id !== module?.id);

  useEffect(() => {
    if (module) {
      setFormData({
        code: module.code,
        name: module.name,
        description: module.description || '',
        category: module.category,
        icon: module.icon || '',
        route: module.route || '',
        is_core: module.is_core,
        is_enabled: module.is_enabled,
        order: module.order,
        dependency_ids: module.dependencies?.map((d) => d.id) || [],
      });
    } else {
      setFormData({
        code: '',
        name: '',
        description: '',
        category: 'SUPPORT',
        icon: '',
        route: '',
        is_core: false,
        is_enabled: true,
        order: 0,
        dependency_ids: [],
      });
    }
  }, [module]);

  const handleDependencyToggle = (moduleId: number) => {
    setFormData((prev) => ({
      ...prev,
      dependency_ids: prev.dependency_ids.includes(moduleId)
        ? prev.dependency_ids.filter((id) => id !== moduleId)
        : [...prev.dependency_ids, moduleId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && module) {
      const updateData: UpdateSystemModuleDTO = {
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category,
        icon: formData.icon || undefined,
        route: formData.route || undefined,
        order: formData.order,
        dependency_ids: formData.dependency_ids,
      };
      await updateMutation.mutateAsync({ id: module.id, data: updateData });
    } else {
      const createData: CreateSystemModuleDTO = {
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category,
        icon: formData.icon || undefined,
        route: formData.route || undefined,
        is_core: formData.is_core,
        order: formData.order,
        dependency_ids: formData.dependency_ids,
      };
      await createMutation.mutateAsync(createData);
    }

    onClose();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isSystemModule = module?.is_core;

  const categoryOptions = categories?.map((c) => ({ value: c.value, label: c.label })) || [
    { value: 'STRATEGIC', label: 'Estrategico' },
    { value: 'COMPLIANCE', label: 'Cumplimiento' },
    { value: 'INTEGRATED', label: 'Integral' },
    { value: 'OPERATIONAL', label: 'Operacional' },
    { value: 'SUPPORT', label: 'Apoyo' },
    { value: 'INTELLIGENCE', label: 'Inteligencia' },
  ];

  const title = (
    <div className="flex items-center gap-2">
      <span>{isEditing ? 'Editar Módulo' : 'Nuevo Módulo'}</span>
      {isSystemModule && (
        <Badge variant="gray" size="sm">
          <Lock className="h-3 w-3 mr-1" />
          Core
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
        disabled={isLoading || !formData.code || !formData.name || isSystemModule}
        isLoading={isLoading}
      >
        {isEditing ? 'Guardar Cambios' : 'Crear Módulo'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={
        isSystemModule
          ? 'Módulo core del sistema - Solo lectura'
          : 'Configura un módulo del marketplace'
      }
      size="xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSystemModule && (
          <Alert
            variant="warning"
            message="Este es un módulo core del sistema y no puede ser modificado ni desactivado."
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Código *"
            value={formData.code}
            onChange={(e) =>
              setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/\s/g, '_') })
            }
            placeholder="gestion_estrategica"
            disabled={isEditing}
            required
          />
          <Select
            label="Categoría *"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value as ModuleCategory })
            }
            options={categoryOptions}
            disabled={isSystemModule}
            required
          />
        </div>

        <Input
          label="Nombre *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Dirección Estratégica"
          disabled={isSystemModule}
          required
        />

        <Textarea
          label="Descripción"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe las funcionalidades del módulo..."
          rows={3}
          disabled={isSystemModule}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Icono (Lucide)"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            placeholder="Settings"
            disabled={isSystemModule}
          />
          <Input
            label="Ruta"
            value={formData.route}
            onChange={(e) => setFormData({ ...formData, route: e.target.value })}
            placeholder="/gestion-estrategica"
            disabled={isSystemModule}
          />
          <Input
            label="Orden"
            type="number"
            value={formData.order.toString()}
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
            disabled={isSystemModule}
          />
        </div>

        {!isEditing && (
          <Switch
            label="Módulo Core"
            checked={formData.is_core}
            onCheckedChange={(checked) => setFormData({ ...formData, is_core: checked })}
            description="Los módulos core no pueden ser desactivados por los usuarios"
          />
        )}

        {/* Dependencias */}
        {availableModules.length > 0 && !isSystemModule && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Dependencias</label>
            <p className="text-xs text-gray-500 mb-2">
              Selecciona los módulos que deben estar activos para que este funcione
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded">
              {availableModules.map((m) => (
                <Checkbox
                  key={m.id}
                  label={m.name}
                  checked={formData.dependency_ids.includes(m.id)}
                  onChange={() => handleDependencyToggle(m.id)}
                />
              ))}
            </div>
          </div>
        )}
      </form>
    </BaseModal>
  );
};
