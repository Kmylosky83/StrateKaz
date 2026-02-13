/**
 * DocumentosTab - Firmas de documentos de onboarding
 */
import { useState, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { SectionHeader } from '@/components/common/SectionHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import { FileSignature, Plus, CheckCircle } from 'lucide-react';
import { useFirmasDocumentos, useMarcarFirmado } from '../../hooks/useOnboardingInduccion';
import type { FirmaDocumento } from '../../types';
import { FirmaDocumentoFormModal } from './FirmaDocumentoFormModal';

const TIPO_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'contrato', label: 'Contrato de Trabajo' },
  { value: 'reglamento_interno', label: 'Reglamento Interno' },
  { value: 'politica_datos', label: 'Politica de Datos' },
  { value: 'politica_sst', label: 'Politica SST' },
  { value: 'acuerdo_confidencialidad', label: 'Confidencialidad' },
  { value: 'autorizacion_descuento', label: 'Autorizacion Descuento' },
  { value: 'compromiso_cumplimiento', label: 'Compromiso Cumplimiento' },
  { value: 'otro', label: 'Otro' },
];

const ESTADO_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'firmado', label: 'Firmados' },
  { value: 'pendiente', label: 'Pendientes' },
];

const METODO_LABELS: Record<string, string> = {
  fisico: 'Fisica',
  digital: 'Digital',
  electronica: 'Electronica',
};

export const DocumentosTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  const { data: firmas, isLoading } = useFirmasDocumentos();
  const marcarFirmadoMutation = useMarcarFirmado();

  const filtered = useMemo(() => {
    if (!firmas) return [];
    return firmas.filter((f) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (
          !f.nombre_documento.toLowerCase().includes(term) &&
          !(f.colaborador_nombre || '').toLowerCase().includes(term)
        )
          return false;
      }
      if (tipoFilter && f.tipo_documento !== tipoFilter) return false;
      if (estadoFilter === 'firmado' && !f.firmado) return false;
      if (estadoFilter === 'pendiente' && f.firmado) return false;
      return true;
    });
  }, [firmas, searchTerm, tipoFilter, estadoFilter]);

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <FileSignature className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Documentos"
        description="Firma de documentos durante el proceso de onboarding"
        variant="compact"
        actions={
          <div className="flex items-center gap-3 flex-nowrap">
            <Input
              placeholder="Buscar documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48"
            />
            <Select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              options={TIPO_OPTIONS}
              className="w-40"
            />
            <Select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              options={ESTADO_OPTIONS}
              className="w-32"
            />
            <Button variant="primary" size="sm" onClick={() => setIsFormOpen(true)}>
              <Plus size={16} className="mr-1" />
              Registrar
            </Button>
          </div>
        }
      />

      <Card variant="bordered" padding="none">
        {isLoading ? (
          <div className="py-16 text-center">
            <Spinner size="lg" className="mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<FileSignature className="h-12 w-12 text-gray-300" />}
              title="Sin documentos"
              description={
                searchTerm || tipoFilter || estadoFilter
                  ? 'No se encontraron documentos con los filtros aplicados.'
                  : 'Registra el primer documento de onboarding.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Colaborador
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Documento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Metodo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {filtered.map((doc) => (
                  <tr key={doc.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {doc.colaborador_nombre}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="gray" size="sm">
                        {doc.tipo_documento_display || doc.tipo_documento}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {doc.nombre_documento}
                      </p>
                      {doc.version && <p className="text-xs text-gray-500">v{doc.version}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(doc.fecha_firma).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {METODO_LABELS[doc.metodo_firma] || doc.metodo_firma}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={doc.firmado ? 'success' : 'warning'} size="sm">
                        {doc.firmado ? 'Firmado' : 'Pendiente'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!doc.firmado && (
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => marcarFirmadoMutation.mutate(doc.id)}
                          disabled={marcarFirmadoMutation.isPending}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <CheckCircle size={14} className="mr-1" />
                          Marcar Firmado
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-500">
            Mostrando {filtered.length} de {firmas?.length || 0} documentos
          </div>
        )}
      </Card>

      <FirmaDocumentoFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
};
