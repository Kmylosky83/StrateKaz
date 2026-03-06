/**
 * ProveedoresTab - Tab de gestión de proveedores (Tipo A — CRUD)
 * StatsGrid + SectionToolbar + tabla dedicada + modales
 */
import { useState } from 'react';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { StatsGrid, StatsGridSkeleton } from '@/components/layout/StatsGrid';
import { useModuleColor } from '@/hooks/useModuleColor';
import { Users, UserCheck, UserX, TrendingUp } from 'lucide-react';
import { ProveedoresTable } from './ProveedoresTable';
import { ProveedorForm } from './ProveedorForm';
import ImportProveedoresModal from './ImportProveedoresModal';
import { useProveedor, useEstadisticasProveedores } from '../hooks/useProveedores';
import type { ProveedorList } from '../types';

export default function ProveedoresTab() {
  const moduleColor = useModuleColor('supply_chain');
  const [showProveedorForm, setShowProveedorForm] = useState(false);
  const [editProveedorId, setEditProveedorId] = useState<number | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const { data: estadisticasData, isLoading: statsLoading } = useEstadisticasProveedores();
  const estadisticas = estadisticasData as Record<string, unknown> | undefined;
  const { data: proveedorDetalle } = useProveedor(editProveedorId ?? 0);

  const stats = [
    {
      label: 'Total Proveedores',
      value: (estadisticas?.total_proveedores as number) ?? 0,
      icon: Users,
      iconColor: 'primary' as const,
    },
    {
      label: 'Activos',
      value: (estadisticas?.proveedores_activos as number) ?? 0,
      icon: UserCheck,
      iconColor: 'success' as const,
    },
    {
      label: 'Inactivos',
      value: (estadisticas?.proveedores_inactivos as number) ?? 0,
      icon: UserX,
      iconColor: 'warning' as const,
    },
    {
      label: 'Calificación Promedio',
      value: estadisticas?.calificacion_promedio
        ? `${Number(estadisticas.calificacion_promedio).toFixed(1)}%`
        : 'N/A',
      icon: TrendingUp,
      iconColor: 'info' as const,
    },
  ];

  const handleNewProveedor = () => {
    setEditProveedorId(null);
    setShowProveedorForm(true);
  };

  const handleEditProveedor = (proveedor: ProveedorList) => {
    setEditProveedorId(proveedor.id);
    setShowProveedorForm(true);
  };

  const handleCloseForm = () => {
    setShowProveedorForm(false);
    setEditProveedorId(null);
  };

  return (
    <div className="space-y-6">
      {statsLoading ? (
        <StatsGridSkeleton count={4} />
      ) : (
        <StatsGrid stats={stats} columns={4} moduleColor={moduleColor} />
      )}

      <SectionToolbar
        title="Proveedores"
        primaryAction={{
          label: 'Nuevo Proveedor',
          onClick: handleNewProveedor,
        }}
        extraActions={[
          {
            label: 'Importar',
            onClick: () => setShowImportModal(true),
            variant: 'outline',
          },
        ]}
      />

      <ProveedoresTable onNew={handleNewProveedor} onEdit={handleEditProveedor} />

      <ProveedorForm
        isOpen={showProveedorForm}
        proveedor={editProveedorId ? proveedorDetalle : undefined}
        onClose={handleCloseForm}
      />

      <ImportProveedoresModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} />
    </div>
  );
}
