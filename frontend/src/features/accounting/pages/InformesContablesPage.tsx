/**
 * Pagina: Informes Contables
 *
 * Gestión de informes financieros con datos reales del backend:
 * - Definiciones: Catálogo de informes disponibles
 * - Generaciones: Historial de informes generados
 */
import { useState } from 'react';
import {
  BarChart3,
  FileText,
  BookOpen,
  FileSpreadsheet,
  Download,
  RefreshCw,
  Copy,
  Clock,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card, Button, Badge, Tabs, Spinner, EmptyState } from '@/components/common';
import { Input } from '@/components/forms';
import {
  useInformes,
  useInformeLineas,
  useGeneraciones,
  useGenerarInforme,
  useRegenerarInforme,
  useDuplicarInforme,
} from '../hooks';
import type { InformeContableList, GeneracionInformeList, LineaInforme } from '../types';

const extractResults = <T,>(data: unknown): T[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const d = data as { results?: T[] };
  return d.results ?? [];
};

const getTipoIcon = (tipo: string) => {
  switch (tipo) {
    case 'balance_general':
      return <FileSpreadsheet className="w-5 h-5 text-blue-600" />;
    case 'estado_resultados':
      return <BarChart3 className="w-5 h-5 text-green-600" />;
    case 'libro_mayor':
      return <BookOpen className="w-5 h-5 text-purple-600" />;
    case 'libro_diario':
      return <BookOpen className="w-5 h-5 text-orange-600" />;
    case 'balance_comprobacion':
      return <FileText className="w-5 h-5 text-primary-600" />;
    default:
      return <FileText className="w-5 h-5 text-gray-600" />;
  }
};

const getEstadoBadge = (estado: string) => {
  switch (estado) {
    case 'completado':
      return { variant: 'success' as const, label: 'Completado' };
    case 'generando':
      return { variant: 'warning' as const, label: 'Generando...' };
    case 'error':
      return { variant: 'danger' as const, label: 'Error' };
    case 'pendiente':
      return { variant: 'secondary' as const, label: 'Pendiente' };
    default:
      return { variant: 'secondary' as const, label: estado };
  }
};

// ==================== COMPONENTS ====================

const DefinicionesSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInforme, setSelectedInforme] = useState<number | null>(null);

  const { data: informesData, isLoading } = useInformes({ search: searchTerm || undefined });
  const { data: lineasData } = useInformeLineas(selectedInforme ?? 0, {
    enabled: !!selectedInforme,
  });
  const generarInforme = useGenerarInforme();
  const duplicarInforme = useDuplicarInforme();

  const informes = extractResults<InformeContableList>(informesData);
  const lineas = extractResults<LineaInforme>(lineasData);
  const selected = informes.find((i) => i.id === selectedInforme);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="medium" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          type="text"
          placeholder="Buscar informe..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lista de informes */}
        <div className="lg:col-span-2">
          {informes.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-12 h-12" />}
              title="Sin informes definidos"
              description="No se encontraron definiciones de informes contables"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {informes.map((informe) => (
                <Card
                  key={informe.id}
                  variant="bordered"
                  padding="md"
                  className={`cursor-pointer hover:shadow-lg transition-shadow ${selectedInforme === informe.id ? 'ring-2 ring-primary-500' : ''}`}
                  onClick={() => setSelectedInforme(informe.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      {getTipoIcon(informe.tipo_informe)}
                    </div>
                    <Badge variant={informe.is_active ? 'success' : 'secondary'} size="sm">
                      {informe.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>

                  <h3 className="font-semibold text-gray-900 dark:text-white">{informe.nombre}</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {informe.tipo_informe_display ?? informe.tipo_informe}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {informe.descripcion || 'Sin descripción'}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-400">
                      {informe.total_lineas ?? 0} líneas
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicarInforme.mutate(informe.id);
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          generarInforme.mutate({ informe: informe.id });
                        }}
                        disabled={generarInforme.isPending || !informe.is_active}
                      >
                        Generar
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Detalle del informe */}
        <div>
          <Card variant="bordered" padding="md">
            {selected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    {getTipoIcon(selected.tipo_informe)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {selected.nombre}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selected.tipo_informe_display ?? selected.tipo_informe}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selected.descripcion || 'Sin descripción'}
                </p>

                {/* Líneas del informe */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                    Líneas configuradas ({lineas.length})
                  </p>
                  {lineas.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">
                      Sin líneas configuradas
                    </p>
                  ) : (
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {lineas.map((linea) => (
                        <div
                          key={linea.id}
                          className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded flex justify-between"
                        >
                          <span className="text-gray-700 dark:text-gray-300">
                            {linea.etiqueta ?? linea.nombre}
                          </span>
                          <span className="text-gray-500 font-mono">
                            {linea.cuenta_codigo ?? '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Seleccione un informe para ver sus detalles</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

const GeneracionesSection = () => {
  const { data: generacionesData, isLoading } = useGeneraciones({ ordering: '-created_at' });
  const regenerar = useRegenerarInforme();

  const generaciones = extractResults<GeneracionInformeList>(generacionesData);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="medium" />
      </div>
    );
  }

  if (generaciones.length === 0) {
    return (
      <EmptyState
        icon={<Clock className="w-12 h-12" />}
        title="Sin generaciones"
        description="No se han generado informes contables aún"
      />
    );
  }

  return (
    <Card variant="bordered" padding="none">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Informe
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Periodo
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Generado
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Estado
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Formato
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {generaciones.map((gen) => {
            const badge = getEstadoBadge(gen.estado);
            return (
              <tr key={gen.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {gen.informe_nombre}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {gen.periodo_inicio && gen.periodo_fin
                    ? `${gen.periodo_inicio} - ${gen.periodo_fin}`
                    : (gen.fecha_corte ?? '-')}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {gen.created_at?.slice(0, 10) ?? '-'}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={badge.variant} size="sm">
                    {badge.label}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{gen.formato ?? 'PDF'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {gen.estado === 'completado' && gen.archivo && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1"
                        onClick={() => window.open(gen.archivo!, '_blank')}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1"
                      onClick={() => regenerar.mutate(gen.id)}
                      disabled={regenerar.isPending}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
};

// ==================== MAIN COMPONENT ====================

export default function InformesContablesPage() {
  const { data: generacionesData } = useGeneraciones({ ordering: '-created_at' });
  const generaciones = extractResults<GeneracionInformeList>(generacionesData);
  const pendientes = generaciones.filter(
    (g) => g.estado === 'generando' || g.estado === 'pendiente'
  );

  const tabs = [
    {
      id: 'definiciones',
      label: 'Informes Disponibles',
      icon: <FileSpreadsheet className="w-4 h-4" />,
      content: <DefinicionesSection />,
    },
    {
      id: 'generaciones',
      label: 'Generaciones',
      icon: <Clock className="w-4 h-4" />,
      badge: pendientes.length > 0 ? String(pendientes.length) : undefined,
      content: <GeneracionesSection />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Informes Contables"
        description="Estados financieros y reportes del sistema contable"
      />

      <Tabs tabs={tabs} defaultTab="definiciones" />
    </div>
  );
}
