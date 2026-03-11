/**
 * PrestacionesTab - CRUD de prestaciones sociales
 */
import { useState, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { Plus, Pencil, Trash2, Gift } from 'lucide-react';
import { usePrestaciones, useDeletePrestacion } from '../../hooks/useNomina';
import type { Prestacion } from '../../types';
import { tipoPrestacionOptions, estadoPrestacionOptions } from '../../types';
import { PrestacionFormModal } from './PrestacionFormModal';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';

const TIPO_OPTIONS = [{ value: '', label: 'Todos los tipos' }, ...tipoPrestacionOptions];
const ESTADO_OPTIONS = [{ value: '', label: 'Todos los estados' }, ...estadoPrestacionOptions];

const formatCurrency = (value: number | undefined) => {
  if (!value && value !== 0) return '-';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
};

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case 'en_provision':
      return 'warning';
    case 'liquidada':
      return 'info';
    case 'pagada':
      return 'success';
    default:
      return 'gray';
  }
};

export const PrestacionesTab = () => {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.TALENT_HUB, Sections.PRESTACIONES, 'create');

  const [tipoFilter, setTipoFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [anioFilter, setAnioFilter] = useState('');
  const [selectedPrestacion, setSelectedPrestacion] = useState<Prestacion | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Prestacion | null>(null);

  const { data: prestaciones, isLoading } = usePrestaciones();
  const deleteMutation = useDeletePrestacion();

  const filtered = useMemo(() => {
    if (!prestaciones) return [];
    return prestaciones.filter((prest) => {
      if (tipoFilter && prest.tipo !== tipoFilter) return false;
      if (estadoFilter && prest.estado !== estadoFilter) return false;
      if (anioFilter && prest.anio.toString() !== anioFilter) return false;
      return true;
    });
  }, [prestaciones, tipoFilter, estadoFilter, anioFilter]);

  const handleCreate = () => {
    setSelectedPrestacion(null);
    setIsFormOpen(true);
  };

  const handleEdit = (prestacion: Prestacion) => {
    setSelectedPrestacion(prestacion);
    setIsFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Spinner size="lg" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando prestaciones...</span>
        </div>
      </Card>
    );
  }

  if (!prestaciones || prestaciones.length === 0) {
    return (
      <Card className="p-8">
        <EmptyState
          icon={<Gift className="h-12 w-12 text-gray-400" />}
          title="No hay prestaciones sociales"
          description="Registra cesantías, prima de servicios y vacaciones."
          action={
            canCreate ? (
              <Button onClick={handleCreate} className="mt-4">
                <Plus size={16} className="mr-2" />
                Nueva Prestación
              </Button>
            ) : undefined
          }
        />
        <PrestacionFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          prestacion={selectedPrestacion}
        />
      </Card>
    );
  }

  const aniosDisponibles = Array.from(new Set(prestaciones.map((p) => p.anio.toString()))).sort(
    (a, b) => b.localeCompare(a)
  );

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Prestaciones Sociales"
        description="Gestión de cesantías, prima de servicios y vacaciones"
      >
        {canCreate && (
          <Button onClick={handleCreate}>
            <Plus size={16} className="mr-2" />
            Nueva Prestación
          </Button>
        )}
      </SectionHeader>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            options={TIPO_OPTIONS}
          />
          <Select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            options={ESTADO_OPTIONS}
          />
          <Select
            value={anioFilter}
            onChange={(e) => setAnioFilter(e.target.value)}
            options={[
              { value: '', label: 'Todos los años' },
              ...aniosDisponibles.map((a) => ({ value: a, label: a })),
            ]}
          />
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Colaborador
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Año
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Provisionado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pagado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Saldo
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.map((prestacion) => (
                <tr key={prestacion.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {prestacion.colaborador_nombre}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant="info">{prestacion.tipo_display || prestacion.tipo}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">
                    {prestacion.anio}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                    {formatCurrency(prestacion.valor_provisionado)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400">
                    {formatCurrency(prestacion.valor_pagado)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(prestacion.saldo_pendiente)}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <Badge variant={getEstadoColor(prestacion.estado)}>
                      {prestacion.estado_display || prestacion.estado}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(prestacion)}>
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteTarget(prestacion)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              No se encontraron prestaciones con los filtros aplicados.
            </div>
          )}
        </div>
      </Card>

      <PrestacionFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        prestacion={selectedPrestacion}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Eliminar Prestación"
        message={`¿Está seguro de eliminar esta prestación? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
