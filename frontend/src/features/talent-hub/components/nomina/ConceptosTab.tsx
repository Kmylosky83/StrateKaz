/**
 * ConceptosTab - CRUD de conceptos de nómina (devengados y deducciones)
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
import { Plus, Pencil, Trash2, List, CheckCircle, XCircle } from 'lucide-react';
import { useConceptosNomina, useDeleteConceptoNomina } from '../../hooks/useNomina';
import type { ConceptoNomina } from '../../types';
import { tipoConceptoOptions, categoriaConceptoOptions } from '../../types';
import { ConceptoFormModal } from './ConceptoFormModal';

const TIPO_OPTIONS = [{ value: '', label: 'Todos los tipos' }, ...tipoConceptoOptions];
const CATEGORIA_OPTIONS = [
  { value: '', label: 'Todas las categorías' },
  ...categoriaConceptoOptions,
];

export const ConceptosTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [selectedConcepto, setSelectedConcepto] = useState<ConceptoNomina | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ConceptoNomina | null>(null);

  const { data: conceptos, isLoading } = useConceptosNomina();
  const deleteMutation = useDeleteConceptoNomina();

  const filtered = useMemo(() => {
    if (!conceptos) return [];
    return conceptos.filter((concepto) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (
          !concepto.codigo.toLowerCase().includes(term) &&
          !concepto.nombre.toLowerCase().includes(term)
        )
          return false;
      }
      if (tipoFilter && concepto.tipo !== tipoFilter) return false;
      if (categoriaFilter && concepto.categoria !== categoriaFilter) return false;
      return true;
    });
  }, [conceptos, searchTerm, tipoFilter, categoriaFilter]);

  const handleCreate = () => {
    setSelectedConcepto(null);
    setIsFormOpen(true);
  };

  const handleEdit = (concepto: ConceptoNomina) => {
    setSelectedConcepto(concepto);
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
          <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando conceptos...</span>
        </div>
      </Card>
    );
  }

  if (!conceptos || conceptos.length === 0) {
    return (
      <Card className="p-8">
        <EmptyState
          icon={<List className="h-12 w-12 text-gray-400" />}
          title="No hay conceptos de nómina"
          description="Crea los conceptos de devengados y deducciones para gestionar liquidaciones."
          action={
            <Button onClick={handleCreate} className="mt-4">
              <Plus size={16} className="mr-2" />
              Nuevo Concepto
            </Button>
          }
        />
        <ConceptoFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          concepto={selectedConcepto}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Conceptos de Nómina"
        description="Devengados y deducciones para liquidaciones de nómina"
      >
        <Button onClick={handleCreate}>
          <Plus size={16} className="mr-2" />
          Nuevo Concepto
        </Button>
      </SectionHeader>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Buscar por código o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            options={TIPO_OPTIONS}
          />
          <Select
            value={categoriaFilter}
            onChange={(e) => setCategoriaFilter(e.target.value)}
            options={CATEGORIA_OPTIONS}
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
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fijo
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Bases
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.map((concepto) => (
                <tr key={concepto.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {concepto.codigo}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {concepto.nombre}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant={concepto.tipo === 'devengado' ? 'success' : 'danger'}>
                      {concepto.tipo_display || concepto.tipo}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant="info">{concepto.categoria_display || concepto.categoria}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    {concepto.es_fijo ? (
                      <CheckCircle size={16} className="inline text-green-600" />
                    ) : (
                      <XCircle size={16} className="inline text-gray-400" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <div className="flex items-center justify-center gap-1">
                      {concepto.es_base_seguridad_social && (
                        <Badge variant="info" className="text-xs">
                          SS
                        </Badge>
                      )}
                      {concepto.es_base_parafiscales && (
                        <Badge variant="info" className="text-xs">
                          Paraf
                        </Badge>
                      )}
                      {concepto.es_base_prestaciones && (
                        <Badge variant="info" className="text-xs">
                          Prest
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(concepto)}>
                        <Pencil size={14} />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteTarget(concepto)}>
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
              No se encontraron conceptos con los filtros aplicados.
            </div>
          )}
        </div>
      </Card>

      <ConceptoFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        concepto={selectedConcepto}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Eliminar Concepto"
        message={`¿Está seguro de eliminar el concepto "${deleteTarget?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
