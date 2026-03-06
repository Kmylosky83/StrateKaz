/**
 * ProveedoresTab - Tab de gestión de proveedores
 * KPIs + tabla + modales crear/editar + importación masiva
 */
import { useState } from 'react';
import { KpiCard, KpiCardGrid } from '@/components/common/KpiCard';
import { Button } from '@/components/common/Button';
import { Users, Upload, UserCheck, UserX, TrendingUp } from 'lucide-react';
import { ProveedoresTable } from './ProveedoresTable';
import { ProveedorForm } from './ProveedorForm';
import ImportProveedoresModal from './ImportProveedoresModal';
import { useProveedor, useEstadisticasProveedores } from '../hooks/useProveedores';
import type { ProveedorList } from '../types';

export default function ProveedoresTab() {
  const [showProveedorForm, setShowProveedorForm] = useState(false);
  const [editProveedorId, setEditProveedorId] = useState<number | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const { data: estadisticasData } = useEstadisticasProveedores();
  const estadisticas = estadisticasData as Record<string, unknown> | undefined;
  const { data: proveedorDetalle } = useProveedor(editProveedorId ?? 0);

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
      {/* KPIs */}
      <KpiCardGrid columns={4}>
        <KpiCard
          label="Total Proveedores"
          value={estadisticas?.total_proveedores ?? 0}
          icon={<Users className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="Activos"
          value={estadisticas?.proveedores_activos ?? 0}
          icon={<UserCheck className="w-5 h-5" />}
          color="success"
        />
        <KpiCard
          label="Inactivos"
          value={estadisticas?.proveedores_inactivos ?? 0}
          icon={<UserX className="w-5 h-5" />}
          color="warning"
        />
        <KpiCard
          label="Calificación Promedio"
          value={
            estadisticas?.calificacion_promedio
              ? `${Number(estadisticas.calificacion_promedio).toFixed(1)}%`
              : 'N/A'
          }
          icon={<TrendingUp className="w-5 h-5" />}
          color="info"
        />
      </KpiCardGrid>

      {/* Botón Importar */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowImportModal(true)}
          leftIcon={<Upload className="w-4 h-4" />}
        >
          Importar Proveedores
        </Button>
      </div>

      {/* Tabla de Proveedores */}
      <ProveedoresTable onNew={handleNewProveedor} onEdit={handleEditProveedor} />

      {/* Modal Crear/Editar Proveedor */}
      <ProveedorForm
        isOpen={showProveedorForm}
        proveedor={editProveedorId ? proveedorDetalle : undefined}
        onClose={handleCloseForm}
      />

      {/* Modal Importar Proveedores */}
      <ImportProveedoresModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} />
    </div>
  );
}
