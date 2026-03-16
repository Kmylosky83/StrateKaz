/**
 * CaracterizacionesSection - SIPOC por Proceso
 * Módulo: C1 — Fundación / Organización
 *
 * Vista 2B: Lista CRUD con RBAC
 * - DataSection + DataTableCard
 * - Colores dinámicos via getModuleColorClasses()
 * - ResponsiveTable para columnas adaptables
 */
import { useState, useMemo } from 'react';
import {
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  Clock,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Alert, Badge, Button, BrandedSkeleton, ConfirmDialog } from '@/components/common';
import { DataTableCard, StatsGrid } from '@/components/layout';
import type { StatItem } from '@/components/layout';
import { DataSection } from '@/components/data-display';
import { ResponsiveTable } from '@/components/common/ResponsiveTable';
import type { ResponsiveTableColumn } from '@/components/common/ResponsiveTable';
import { usePermissions, useModuleColor } from '@/hooks';
import { Modules, Sections } from '@/constants/permissions';
import { getModuleColorClasses } from '@/utils/moduleColors';
import type { ModuleColor } from '@/utils/moduleColors';
import { useCaracterizaciones, useDeleteCaracterizacion } from '../hooks/useCaracterizaciones';
import { CaracterizacionFormModal } from './CaracterizacionFormModal';
import type { CaracterizacionProcesoList } from '../types/caracterizacion.types';
import { ESTADO_LABELS, ESTADO_BADGE_VARIANTS } from '../types/caracterizacion.types';

export const CaracterizacionesSection = () => {
  const { color: moduleColor } = useModuleColor('fundacion');
  const colorClasses = getModuleColorClasses(moduleColor as ModuleColor);

  const [selectedItem, setSelectedItem] = useState<CaracterizacionProcesoList | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CaracterizacionProcesoList | null>(null);

  // RBAC
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.FUNDACION, Sections.CARACTERIZACIONES, 'create');
  const canEdit = canDo(Modules.FUNDACION, Sections.CARACTERIZACIONES, 'edit');
  const canDelete = canDo(Modules.FUNDACION, Sections.CARACTERIZACIONES, 'delete');

  // Data
  const { data: caracterizacionesData, isLoading, error } = useCaracterizaciones();
  const deleteMutation = useDeleteCaracterizacion();

  const items = Array.isArray(caracterizacionesData) ? caracterizacionesData : [];

  // StatsGrid
  const stats: StatItem[] = useMemo(() => {
    const total = items.length;
    const aprobadas = items.filter((i) => i.estado === 'APROBADO').length;
    const borrador = items.filter((i) => i.estado === 'BORRADOR').length;
    const enRevision = items.filter((i) => i.estado === 'EN_REVISION').length;

    return [
      {
        label: 'Total Procesos',
        value: total,
        icon: FileText,
        iconColor: 'info',
        description: 'Caracterizaciones registradas',
      },
      {
        label: 'Aprobadas',
        value: aprobadas,
        icon: CheckCircle,
        iconColor: 'success',
        description:
          total > 0 ? `${Math.round((aprobadas / total) * 100)}% del total` : 'Sin datos',
      },
      {
        label: 'En Revisión',
        value: enRevision,
        icon: Clock,
        iconColor: 'warning',
        description: 'Pendientes de aprobación',
      },
      {
        label: 'Borrador',
        value: borrador,
        icon: AlertTriangle,
        iconColor: 'danger',
        description: 'Requieren completar',
      },
    ];
  }, [items]);

  // Handlers
  const handleCreate = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: CaracterizacionProcesoList) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (item: CaracterizacionProcesoList) => {
    setItemToDelete(item);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    await deleteMutation.mutateAsync(itemToDelete.id);
    setItemToDelete(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  // Columnas
  const columns: ResponsiveTableColumn<CaracterizacionProcesoList & Record<string, unknown>>[] = [
    {
      key: 'area',
      header: 'Proceso / Área',
      priority: 1,
      render: (row) => {
        const item = row as unknown as CaracterizacionProcesoList;
        return (
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{item.area_name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{item.area_code}</p>
          </div>
        );
      },
    },
    {
      key: 'objetivo',
      header: 'Objetivo',
      hideOnTablet: true,
      render: (row) => {
        const item = row as unknown as CaracterizacionProcesoList;
        return (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {item.objetivo_resumen || '—'}
          </span>
        );
      },
    },
    {
      key: 'estado',
      header: 'Estado',
      priority: 2,
      render: (row) => {
        const item = row as unknown as CaracterizacionProcesoList;
        return (
          <Badge variant={ESTADO_BADGE_VARIANTS[item.estado] || 'secondary'} size="sm">
            {ESTADO_LABELS[item.estado] || item.estado}
          </Badge>
        );
      },
    },
    {
      key: 'lider',
      header: 'Líder',
      hideOnTablet: true,
      render: (row) => {
        const item = row as unknown as CaracterizacionProcesoList;
        return (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {item.lider_proceso_nombre || '—'}
          </span>
        );
      },
    },
    {
      key: 'version',
      header: 'Ver.',
      priority: 3,
      render: (row) => {
        const item = row as unknown as CaracterizacionProcesoList;
        return (
          <Badge variant="secondary" size="sm">
            v{item.version}
          </Badge>
        );
      },
    },
    {
      key: 'acciones',
      header: '',
      priority: 1,
      render: (row) => {
        const item = row as unknown as CaracterizacionProcesoList;
        return (
          <div className="flex items-center justify-end gap-1">
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(item)}
                className="p-2 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                title="Editar"
              >
                <Pencil className="h-4 w-4 text-gray-500 hover:text-orange-600" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(item)}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  // Loading
  if (isLoading) {
    return <BrandedSkeleton height="h-80" logoSize="xl" showText />;
  }

  // Error
  if (error) {
    return (
      <Alert
        variant="error"
        message="Error al cargar las caracterizaciones. Por favor, intente nuevamente."
      />
    );
  }

  return (
    <div className="space-y-6">
      <StatsGrid stats={stats} columns={4} moduleColor={moduleColor as string} />

      <DataSection
        icon={ClipboardList}
        iconBgClass={colorClasses.badge}
        iconClass={colorClasses.icon}
        title="Caracterización de Procesos"
        description="Fichas SIPOC: Proveedores, Entradas, Actividades, Salidas y Clientes por proceso"
        action={
          canCreate ? (
            <Button variant="primary" size="sm" onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Caracterización
            </Button>
          ) : undefined
        }
      />

      <DataTableCard
        isEmpty={items.length === 0}
        isLoading={false}
        emptyMessage="No hay caracterizaciones registradas. Crea una ficha SIPOC para un proceso."
      >
        {items.length > 0 && (
          <ResponsiveTable
            columns={columns}
            data={items as (CaracterizacionProcesoList & Record<string, unknown>)[]}
            keyExtractor={(item) => item.id as number}
          />
        )}
      </DataTableCard>

      {/* Modal */}
      <CaracterizacionFormModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar Caracterización"
        message={`¿Está seguro de eliminar la caracterización del proceso "${itemToDelete?.area_name}"?`}
        variant="danger"
        confirmText="Eliminar"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
