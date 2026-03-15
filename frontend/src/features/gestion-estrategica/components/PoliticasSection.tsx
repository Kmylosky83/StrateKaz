/**
 * Sección: Políticas — Autocontenida (solo lectura)
 *
 * Lee políticas desde Gestión Documental (tipo_documento='POL').
 * Muestra badges de estado, firma digital y alertas de revisión.
 *
 * Se usa en: Tab "Mi Sistema de Gestión" → subtab "politicas"
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Shield,
  Calendar,
  ExternalLink,
  FileText,
  Clock,
  CheckCircle2,
  PenLine,
  AlertTriangle,
  Info,
  User,
} from 'lucide-react';
import { Card, Badge, EmptyState } from '@/components/common';
import { DataSection } from '@/components/data-display';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import type { ModuleColor } from '@/utils/moduleColors';
import { useDocumentos } from '../hooks/useGestionDocumental';
import type { Documento } from '../types/gestion-documental.types';
import { useSelectCargos } from '@/hooks/useSelectLists';
import { cn } from '@/utils/cn';

/** Mapeo de estado a badge variant + etiqueta legible */
const ESTADO_POLITICA_CONFIG: Record<
  string,
  { variant: 'gray' | 'warning' | 'info' | 'success' | 'danger'; label: string }
> = {
  BORRADOR: { variant: 'gray', label: 'Borrador' },
  EN_REVISION: { variant: 'warning', label: 'En Revisión' },
  APROBADO: { variant: 'info', label: 'Aprobado' },
  PUBLICADO: { variant: 'success', label: 'Publicado' },
  OBSOLETO: { variant: 'danger', label: 'Obsoleto' },
  ARCHIVADO: { variant: 'gray', label: 'Archivado' },
};

/** Calcula estado de revisión programada */
const getRevisionStatus = (fecha: string | null) => {
  if (!fecha) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const revision = new Date(fecha);
  revision.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((revision.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { type: 'vencida' as const, days: Math.abs(diffDays) };
  if (diffDays <= 30) return { type: 'proxima' as const, days: diffDays };
  return { type: 'ok' as const, days: diffDays };
};

/** Calcula estado de firmas de un documento */
const getFirmaStatus = (doc: Documento) => {
  const requiereFirma = doc.tipo_documento_detail?.requiere_firma;
  if (!requiereFirma) return null;

  const firmas = doc.firmas_digitales ?? [];
  const totalFirmas = firmas.length;
  const firmadasCount = firmas.filter(
    (f: { estado?: string }) => f.estado === 'FIRMADO' || f.estado === 'COMPLETADO'
  ).length;

  if (totalFirmas === 0) return { status: 'sin_flujo' as const, firmadas: 0, total: 0 };
  if (firmadasCount === totalFirmas)
    return { status: 'completo' as const, firmadas: firmadasCount, total: totalFirmas };
  return { status: 'pendiente' as const, firmadas: firmadasCount, total: totalFirmas };
};

export const PoliticasSection = () => {
  const { color: moduleColor } = useModuleColor('fundacion');
  const colorClasses = getModuleColorClasses(moduleColor as ModuleColor);

  const { data: documentosData, isLoading } = useDocumentos({ tipo_documento_codigo: 'POL' });
  const documentos: Documento[] = useMemo(
    () => (Array.isArray(documentosData) ? documentosData : []),
    [documentosData]
  );

  const { data: cargos, isLoading: cargosLoading } = useSelectCargos();
  const hayCargos = (cargos?.length ?? 0) > 0;

  const grouped = useMemo(() => {
    const groups: Record<string, Documento[]> = {};
    for (const doc of documentos) {
      const key = doc.norma_iso_nombre || 'General';
      if (!groups[key]) groups[key] = [];
      groups[key].push(doc);
    }
    return groups;
  }, [documentos]);

  const stats = useMemo(() => {
    const publicadas = documentos.filter((d) => d.estado === 'PUBLICADO').length;
    const enRevision = documentos.filter((d) => d.estado === 'EN_REVISION').length;
    const vencidas = documentos.filter(
      (d) => getRevisionStatus(d.fecha_revision_programada)?.type === 'vencida'
    ).length;
    return { total: documentos.length, publicadas, enRevision, vencidas };
  }, [documentos]);

  const totalPolicies = documentos.length;

  return (
    <div className="space-y-6">
      <DataSection
        icon={Shield}
        iconBgClass={colorClasses.badge}
        iconClass={colorClasses.icon}
        title="Políticas"
        description={`${totalPolicies} política${totalPolicies !== 1 ? 's' : ''} registrada${totalPolicies !== 1 ? 's' : ''} en Gestión Documental`}
        action={
          <Link
            to="/sistema-gestion/documentos"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Ir a Gestión Documental
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        }
      />

      {/* Prerequisite: sin cargos configurados */}
      {!cargosLoading && !hayCargos && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Cargos no configurados
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
              Para habilitar flujos de aprobación y firma en políticas, primero configura los cargos
              en{' '}
              <Link
                to="/talento/estructura"
                className="underline font-medium hover:text-amber-900 dark:hover:text-amber-200"
              >
                Talento Humano → Estructura de Cargos
              </Link>
              .
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <div className="p-4 animate-pulse-subtle">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : totalPolicies === 0 ? (
        <EmptyState
          icon={<Shield className="w-12 h-12 text-gray-400" />}
          title="Sin políticas registradas"
          description={
            hayCargos
              ? 'No hay políticas registradas. Crea una desde Sistema de Gestión → Documentos seleccionando tipo «Política».'
              : 'Para crear políticas con flujo de aprobación, primero configura los cargos en Talento Humano → Estructura de Cargos. Luego crea políticas desde Sistema de Gestión → Documentos.'
          }
          action={{
            label: 'Crear política',
            onClick: () => window.open('/sistema-gestion/documentos', '_self'),
            icon: <Plus className="h-4 w-4" />,
          }}
        />
      ) : (
        <>
          {/* Resumen rápido */}
          {stats.total > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-800 p-3 text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.publicadas}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Publicadas</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-800 p-3 text-center">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {stats.enRevision}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">En Revisión</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800 p-3 text-center">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.vencidas}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Revisión Vencida</p>
              </div>
            </div>
          )}

          {/* Cards agrupadas por norma */}
          <div className="space-y-6">
            {Object.entries(grouped).map(([norma, docs]) => (
              <div key={norma}>
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  {norma}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {docs.map((doc) => {
                    const estadoConfig = ESTADO_POLITICA_CONFIG[doc.estado] ?? {
                      variant: 'gray' as const,
                      label: doc.estado,
                    };
                    const revisionStatus = getRevisionStatus(doc.fecha_revision_programada);
                    const firmaStatus = getFirmaStatus(doc);

                    return (
                      <Card
                        key={doc.id}
                        className={cn(
                          'hover:shadow-md transition-shadow',
                          revisionStatus?.type === 'vencida' &&
                            'ring-1 ring-red-300 dark:ring-red-700'
                        )}
                      >
                        <div className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center flex-wrap gap-2 mb-1">
                                <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                                  {doc.codigo}
                                </span>
                                <Badge variant={estadoConfig.variant} size="sm">
                                  {estadoConfig.label}
                                </Badge>
                                {doc.es_politica_integral && (
                                  <Badge variant="info" size="sm">
                                    Integral
                                  </Badge>
                                )}
                              </div>
                              <h5 className="font-medium text-gray-900 dark:text-white line-clamp-2">
                                {doc.titulo}
                              </h5>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                            <span className="inline-flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" />v{doc.version_actual}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {doc.fecha_publicacion
                                ? new Date(doc.fecha_publicacion).toLocaleDateString('es-CO', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : 'Sin publicar'}
                            </span>
                            {doc.responsable_cargo_nombre && (
                              <span className="inline-flex items-center gap-1">
                                <User className="w-3.5 h-3.5" />
                                {doc.responsable_cargo_nombre}
                              </span>
                            )}
                          </div>

                          {revisionStatus && revisionStatus.type !== 'ok' && (
                            <div
                              className={cn(
                                'flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-md',
                                revisionStatus.type === 'vencida'
                                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                  : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                              )}
                            >
                              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                              {revisionStatus.type === 'vencida'
                                ? `Revisión vencida hace ${revisionStatus.days} día${revisionStatus.days !== 1 ? 's' : ''}`
                                : `Revisión programada en ${revisionStatus.days} día${revisionStatus.days !== 1 ? 's' : ''}`}
                            </div>
                          )}

                          {firmaStatus && (
                            <div
                              className={cn(
                                'flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-md',
                                firmaStatus.status === 'completo'
                                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                  : firmaStatus.status === 'pendiente'
                                    ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                              )}
                            >
                              {firmaStatus.status === 'completo' ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                                  Firmado completamente
                                </>
                              ) : firmaStatus.status === 'pendiente' ? (
                                <>
                                  <PenLine className="w-3.5 h-3.5 flex-shrink-0" />
                                  Pendiente de firma ({firmaStatus.firmadas} de {firmaStatus.total})
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                                  Sin flujo de firmas asignado
                                </>
                              )}
                            </div>
                          )}

                          <div className="pt-1 border-t border-gray-100 dark:border-gray-700">
                            <Link
                              to="/sistema-gestion/documentos"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            >
                              Ver en Gestión Documental
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
