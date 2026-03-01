/**
 * CertificadosTab - Gestion de certificados de capacitacion
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
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import { Award, Ban, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { useCertificados, useAnularCertificado } from '../../hooks/useFormacionReinduccion';
import type { Certificado } from '../../types';

export const CertificadosTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [anularTarget, setAnularTarget] = useState<Certificado | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  const { data: certificados, isLoading } = useCertificados();
  const anularMutation = useAnularCertificado();

  const filtered = useMemo(() => {
    if (!certificados) return [];
    return certificados.filter((c) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (
          !c.numero_certificado.toLowerCase().includes(term) &&
          !c.titulo_capacitacion.toLowerCase().includes(term) &&
          !(c.colaborador_nombre || '').toLowerCase().includes(term)
        )
          return false;
      }
      if (estadoFilter === 'vigente' && (!c.esta_vigente || c.anulado)) return false;
      if (estadoFilter === 'vencido' && (c.esta_vigente || c.anulado)) return false;
      if (estadoFilter === 'anulado' && !c.anulado) return false;
      return true;
    });
  }, [certificados, searchTerm, estadoFilter]);

  const confirmAnular = async () => {
    if (!anularTarget || !motivoAnulacion) return;
    await anularMutation.mutateAsync({ id: anularTarget.id, motivo: motivoAnulacion });
    setAnularTarget(null);
    setMotivoAnulacion('');
  };

  const getEstadoBadge = (cert: Certificado) => {
    if (cert.anulado) return { variant: 'danger' as const, label: 'Anulado' };
    if (cert.esta_vigente) return { variant: 'success' as const, label: 'Vigente' };
    return { variant: 'warning' as const, label: 'Vencido' };
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <Award className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Certificados"
        description="Certificados de capacitacion emitidos"
        variant="compact"
        actions={
          <div className="flex items-center gap-3 flex-nowrap">
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-56"
            />
            <Select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              options={[
                { value: '', label: 'Todos' },
                { value: 'vigente', label: 'Vigentes' },
                { value: 'vencido', label: 'Vencidos' },
                { value: 'anulado', label: 'Anulados' },
              ]}
              className="w-36"
            />
          </div>
        }
      />

      <Card variant="bordered" padding="none">
        {isLoading ? (
          <div className="py-16 text-center">
            <Spinner size="lg" className="mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Cargando certificados...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<Award className="h-12 w-12 text-gray-300" />}
              title="Sin certificados"
              description={
                searchTerm || estadoFilter
                  ? 'No se encontraron certificados con los filtros aplicados.'
                  : 'Los certificados se generan al completar capacitaciones.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    No. Certificado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Colaborador
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Capacitacion
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Emision
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Vencimiento
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Horas
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Nota
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {filtered.map((cert) => {
                  const estado = getEstadoBadge(cert);
                  return (
                    <tr
                      key={cert.id}
                      className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-300">
                        {cert.numero_certificado}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {cert.colaborador_nombre}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {cert.titulo_capacitacion}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {new Date(cert.fecha_emision).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {cert.fecha_vencimiento ? (
                          <div className="flex items-center gap-1">
                            <Clock size={14} className="text-gray-400" />
                            {new Date(cert.fecha_vencimiento).toLocaleDateString('es-CO')}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No vence</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-300">
                        {cert.duracion_horas}h
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-300">
                        {cert.nota_obtenida != null ? `${cert.nota_obtenida}%` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={estado.variant} size="sm">
                          {cert.anulado ? (
                            <AlertTriangle size={12} className="mr-1 inline" />
                          ) : cert.esta_vigente ? (
                            <CheckCircle size={12} className="mr-1 inline" />
                          ) : null}
                          {estado.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          {!cert.anulado && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setAnularTarget(cert)}
                              title="Anular certificado"
                              className="text-red-500 hover:text-red-700"
                            >
                              <Ban size={16} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-500">
            Mostrando {filtered.length} de {certificados?.length || 0} certificados
          </div>
        )}
      </Card>

      <ConfirmDialog
        isOpen={!!anularTarget}
        title="Anular Certificado"
        message={
          <div className="space-y-3">
            <p>
              ¿Estas seguro de anular el certificado{' '}
              <strong>{anularTarget?.numero_certificado}</strong>?
            </p>
            <Input
              label="Motivo de anulacion"
              placeholder="Describe el motivo..."
              value={motivoAnulacion}
              onChange={(e) => setMotivoAnulacion(e.target.value)}
            />
          </div>
        }
        confirmText="Anular"
        variant="danger"
        isLoading={anularMutation.isPending}
        onConfirm={confirmAnular}
        onClose={() => {
          setAnularTarget(null);
          setMotivoAnulacion('');
        }}
      />
    </div>
  );
};
