/**
 * EnProcesoSection — Documentos activos en flujo de trabajo.
 *
 * Responde: ¿cuál es el estado de los documentos en movimiento?
 * - Firmas pendientes (mi turno primero)
 * - Borradores propios
 * - Documentos en revisión esperando aprobación
 *
 * Absorbe la funcionalidad de ControlCambiosSection (firmas).
 * El historial de versiones se movió a ArchivoSection.
 */
import { useState } from 'react';
import {
  PenTool,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  FileText,
  Edit,
  Eye,
  GitPullRequest,
} from 'lucide-react';
import { Card, Button, EmptyState, Badge } from '@/components/common';
import { PageTabs, TableSkeleton } from '@/components/layout';
import type { TabItem } from '@/components/layout';
import { useModuleColor } from '@/hooks/useModuleColor';

import { useDocumentos } from '../hooks/useGestionDocumental';
import { useMisFirmasPendientes } from '@/features/gestion-estrategica/hooks/useWorkflowFirmas';
import type { Documento } from '../types/gestion-documental.types';

type ProcesoTab = 'firmas' | 'borradores' | 'revision';

const _PROCESO_TABS: TabItem[] = [
  { id: 'firmas', label: 'Firmas Pendientes', icon: PenTool },
  { id: 'borradores', label: 'Borradores', icon: FileText },
  { id: 'revision', label: 'En Revisión', icon: GitPullRequest },
];

interface EnProcesoSectionProps {
  onViewDocumento: (id: number) => void;
  onEditDocumento: (id: number) => void;
  onFirmar?: (firmaId: number, rolDisplay?: string) => void;
  onRechazar?: (firmaId: number) => void;
}

export function EnProcesoSection({
  onViewDocumento,
  onEditDocumento,
  onFirmar,
  onRechazar,
}: EnProcesoSectionProps) {
  const [activeTab, setActiveTab] = useState<ProcesoTab>('firmas');
  const { color: moduleColor } = useModuleColor('gestion_documental');

  const {
    firmasPendientes,
    totalPendientes,
    miTurno,
    isLoading: firmasLoading,
  } = useMisFirmasPendientes();

  const { data: borradores, isLoading: isLoadingBorradores } = useDocumentos({
    estado: 'BORRADOR',
  });
  const { data: enRevision, isLoading: isLoadingRevision } = useDocumentos({
    estado: 'EN_REVISION',
  });

  const tabsWithBadges: TabItem[] = [
    {
      id: 'firmas',
      label: 'Firmas Pendientes',
      icon: PenTool,
      badge: miTurno > 0 ? miTurno : undefined,
    },
    {
      id: 'borradores',
      label: 'Borradores',
      icon: FileText,
      badge: (borradores?.length ?? 0) > 0 ? borradores!.length : undefined,
    },
    {
      id: 'revision',
      label: 'En Revisión',
      icon: GitPullRequest,
      badge: (enRevision?.length ?? 0) > 0 ? enRevision!.length : undefined,
    },
  ];

  return (
    <div className="space-y-4">
      <PageTabs
        tabs={tabsWithBadges}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as ProcesoTab)}
        variant="underline"
        moduleColor={moduleColor}
      />

      {/* ── Firmas pendientes ── */}
      {activeTab === 'firmas' && (
        <section className="space-y-4">
          {totalPendientes > 0 && (
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-orange-500" />
                Pendientes:{' '}
                <strong className="text-gray-900 dark:text-white ml-1">{totalPendientes}</strong>
              </span>
              <span className="flex items-center gap-1">
                <PenTool className="w-3.5 h-3.5 text-indigo-500" />
                Mi turno:{' '}
                <strong className="text-indigo-600 dark:text-indigo-400 ml-1">{miTurno}</strong>
              </span>
            </div>
          )}

          {firmasLoading ? (
            <TableSkeleton rows={4} columns={3} />
          ) : !firmasPendientes || firmasPendientes.length === 0 ? (
            <EmptyState
              icon={<CheckCircle className="w-10 h-10" />}
              title="Sin firmas pendientes"
              description="No tienes documentos esperando tu firma en este momento."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {firmasPendientes.map((firma) => (
                <Card
                  key={firma.id}
                  className={`p-4 transition-all ${
                    firma.es_mi_turno
                      ? 'border-orange-300 dark:border-orange-700 bg-orange-50/30 dark:bg-orange-900/10'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant={firma.es_mi_turno ? 'warning' : 'secondary'}>
                          {firma.rol_firma_display}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Orden {firma.orden}
                        </span>
                        {firma.es_mi_turno && (
                          <Badge variant="primary" size="sm">
                            Tu turno
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate mb-0.5">
                        {firma.documento_titulo}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {firma.documento_tipo}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {firma.dias_pendiente} día(s) pendiente
                    </span>
                    {firma.fecha_limite && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Límite: {new Date(firma.fecha_limite).toLocaleDateString('es-CO')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      leftIcon={<PenTool className="w-4 h-4" />}
                      disabled={!firma.es_mi_turno}
                      onClick={() => onFirmar?.(firma.id, firma.rol_firma_display)}
                    >
                      Firmar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Eye className="w-4 h-4" />}
                      onClick={() => firma.documento_id && onViewDocumento(firma.documento_id)}
                    >
                      Ver
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<XCircle className="w-4 h-4 text-red-500" />}
                      disabled={!firma.es_mi_turno}
                      onClick={() => onRechazar?.(firma.id)}
                      title="Rechazar firma"
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Borradores ── */}
      {activeTab === 'borradores' && (
        <section className="space-y-4">
          {isLoadingBorradores ? (
            <TableSkeleton rows={3} columns={3} />
          ) : !borradores || borradores.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-10 h-10" />}
              title="Sin borradores"
              description="No hay documentos en estado borrador. Crea uno desde Repositorio."
            />
          ) : (
            <DocumentoMiniGrid
              documentos={borradores}
              onView={onViewDocumento}
              onEdit={onEditDocumento}
            />
          )}
        </section>
      )}

      {/* ── En revisión ── */}
      {activeTab === 'revision' && (
        <section className="space-y-4">
          {isLoadingRevision ? (
            <TableSkeleton rows={3} columns={3} />
          ) : !enRevision || enRevision.length === 0 ? (
            <EmptyState
              icon={<GitPullRequest className="w-10 h-10" />}
              title="Sin documentos en revisión"
              description="Los documentos enviados a revisión aparecerán aquí."
            />
          ) : (
            <DocumentoMiniGrid
              documentos={enRevision}
              onView={onViewDocumento}
              onEdit={onEditDocumento}
              readOnly
            />
          )}
        </section>
      )}
    </div>
  );
}

// ── Grid compacto de documentos ───────────────────────────────────────────

function DocumentoMiniGrid({
  documentos,
  onView,
  onEdit,
  readOnly = false,
}: {
  documentos: Documento[];
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {documentos.map((doc) => (
        <Card key={doc.id} className="p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <p className="text-xs font-mono text-gray-500 dark:text-gray-400">{doc.codigo}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {doc.titulo}
              </p>
            </div>
            <Badge variant="secondary" size="sm" className="shrink-0">
              v{doc.version_actual}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {doc.tipo_documento_detail?.nombre ?? String(doc.tipo_documento)}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              leftIcon={<Eye className="w-3.5 h-3.5" />}
              onClick={() => onView(doc.id)}
            >
              Ver
            </Button>
            {!readOnly && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                leftIcon={<Edit className="w-3.5 h-3.5" />}
                onClick={() => onEdit(doc.id)}
              >
                Editar
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
