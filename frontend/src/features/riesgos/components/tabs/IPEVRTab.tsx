/**
 * IPEVRTab - Tab Principal de Identificación de Peligros, Evaluación y Valoración de Riesgos
 * Sistema de Gestión StrateKaz
 *
 * Implementa la metodología GTC-45 con 4 subtabs:
 * 1. Resumen - Cards estadísticos y métricas clave
 * 2. Matriz IPEVR - Tabla completa de valoraciones
 * 3. Peligros - Catálogo de 78 peligros GTC-45
 * 4. Controles SST - Jerarquía de controles
 */

import { useState } from 'react';
import { Tabs } from '@/components/common';
import { Button } from '@/components/common';
import { LayoutDashboard, Table2, AlertTriangle, Shield, Plus, Download, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';

// Hooks
import {
  useResumenIPEVR,
  useMatricesIPEVR,
  useMatricesCriticos,
  useMatricesPorArea,
  useMatricesPorCargo,
  useMatricesPorPeligro,
  useClasificacionesPorCategoria,
  usePeligrosPorClasificacion,
  useControlesSST,
  useControlesPorTipo,
} from '../../hooks/useIPEVR';

// Componentes visuales
import { ResumenIPEVRCards } from '../ipevr/ResumenIPEVRCards';
import { MatrizGTC45Table } from '../ipevr/MatrizGTC45Table';
import { NivelRiesgoIndicator } from '../ipevr/NivelRiesgoIndicator';

// Tipos
import type {
  MatrizIPEVR,
  CategoriaGTC45,
  InterpretacionNR,
  Aceptabilidad,
  TipoControlSST,
  ClasificacionPeligro,
  PeligroGTC45,
  ControlSST,
} from '../../types';
import { CATEGORIA_GTC45_LABELS, CATEGORIA_COLORS, TIPO_CONTROL_SST_LABELS } from '../../types';

// ==================== RESUMEN SECTION ====================

interface ResumenSectionProps {
  className?: string;
}

function ResumenSection({ className }: ResumenSectionProps) {
  const { data: resumen, isLoading: isLoadingResumen } = useResumenIPEVR();
  const { data: criticos, isLoading: isLoadingCriticos } = useMatricesCriticos();
  const { data: porArea, isLoading: isLoadingArea } = useMatricesPorArea();
  const { data: porCargo, isLoading: isLoadingCargo } = useMatricesPorCargo();
  const { data: porPeligro, isLoading: isLoadingPeligro } = useMatricesPorPeligro();

  const _isLoading =
    isLoadingResumen || isLoadingCriticos || isLoadingArea || isLoadingCargo || isLoadingPeligro;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Cards de Resumen */}
      <ResumenIPEVRCards resumen={resumen} isLoading={isLoadingResumen} />

      {/* Riesgos Críticos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Riesgos Críticos (NR I y II) */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Riesgos Críticos
            </h3>
            <span className="text-sm text-muted-foreground">
              {isLoadingCriticos ? '...' : criticos?.length || 0} registros
            </span>
          </div>

          {isLoadingCriticos ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted/30 rounded animate-pulse-subtle" />
              ))}
            </div>
          ) : criticos && criticos.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {criticos.slice(0, 10).map((matriz) => (
                <div
                  key={matriz.id}
                  className="p-3 rounded-lg border bg-red-50 dark:bg-red-950/20 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {matriz.area} - {matriz.cargo}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{matriz.peligro_nombre}</p>
                    </div>
                    <NivelRiesgoIndicator
                      interpretacionNR={matriz.interpretacion_nr as InterpretacionNR}
                      nivelRiesgo={matriz.nivel_riesgo}
                      aceptabilidad={matriz.aceptabilidad as Aceptabilidad}
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay riesgos críticos registrados
            </div>
          )}
        </div>

        {/* Distribución por Peligro */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Distribución por Categoría de Peligro</h3>
          </div>

          {isLoadingPeligro ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted/30 rounded animate-pulse-subtle" />
              ))}
            </div>
          ) : porPeligro && porPeligro.length > 0 ? (
            <div className="space-y-2">
              {porPeligro.map((item, idx) => {
                const categoria = item.peligro__clasificacion__categoria as CategoriaGTC45;
                const total = porPeligro.reduce((sum, p) => sum + p.total, 0);
                const porcentaje = total > 0 ? (item.total / total) * 100 : 0;

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.peligro__clasificacion__nombre}</span>
                      <span className="text-muted-foreground">
                        {item.total} ({porcentaje.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${porcentaje}%`,
                          backgroundColor: CATEGORIA_COLORS[categoria] || '#6B7280',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay datos de distribución
            </div>
          )}
        </div>
      </div>

      {/* Distribución por Área y Cargo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por Área */}
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Top 10 Áreas con Más Riesgos</h3>

          {isLoadingArea ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-muted/30 rounded animate-pulse-subtle" />
              ))}
            </div>
          ) : porArea && porArea.length > 0 ? (
            <div className="space-y-2">
              {porArea.slice(0, 10).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <span className="text-sm font-medium">{item.area}</span>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {item.total}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No hay datos por área</div>
          )}
        </div>

        {/* Por Cargo */}
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Top 10 Cargos con Más Riesgos</h3>

          {isLoadingCargo ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-muted/30 rounded animate-pulse-subtle" />
              ))}
            </div>
          ) : porCargo && porCargo.length > 0 ? (
            <div className="space-y-2">
              {porCargo.slice(0, 10).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <span className="text-sm font-medium">{item.cargo}</span>
                  <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    {item.total}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No hay datos por cargo</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== MATRIZ SECTION ====================

interface MatrizSectionProps {
  className?: string;
  canCreate?: boolean;
}

function MatrizSection({ className, canCreate = true }: MatrizSectionProps) {
  const [filters, _setFilters] = useState<{
    area?: string;
    cargo?: string;
    estado?: string;
    aceptabilidad?: string;
  }>({});

  const { data: matricesData, isLoading } = useMatricesIPEVR(filters);
  const matrices = matricesData?.results || [];

  const [_selectedMatriz, setSelectedMatriz] = useState<MatrizIPEVR | null>(null);

  const handleRowClick = (matriz: MatrizIPEVR) => {
    setSelectedMatriz(matriz);
    // TODO: Abrir modal de detalles
  };

  const handleExport = () => {
    // TODO: Implementar exportación a Excel
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header con acciones */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Matriz IPEVR Completa</h3>
          <p className="text-sm text-muted-foreground">
            Identificación de Peligros, Evaluación y Valoración de Riesgos (GTC-45)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Exportar Excel
          </Button>
          {canCreate && (
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Nueva Valoración
            </Button>
          )}
        </div>
      </div>

      {/* Tabla de Matriz */}
      <MatrizGTC45Table matrices={matrices} onRowClick={handleRowClick} isLoading={isLoading} />

      {/* Información de paginación */}
      {matricesData && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Mostrando {matrices.length} de {matricesData.count} registros
          </span>
          {matricesData.next && (
            <Button variant="ghost" size="sm">
              Cargar más
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== PELIGROS SECTION ====================

interface PeligrosSectionProps {
  className?: string;
}

function PeligrosSection({ className }: PeligrosSectionProps) {
  const { data: clasificacionesPorCategoria, isLoading } = useClasificacionesPorCategoria();
  const [selectedClasificacion, setSelectedClasificacion] = useState<number | undefined>();
  const { data: peligrosData } = usePeligrosPorClasificacion(selectedClasificacion);

  const categorias = clasificacionesPorCategoria
    ? (Object.keys(clasificacionesPorCategoria) as CategoriaGTC45[])
    : [];

  return (
    <div className={cn('space-y-6', className)}>
      <div>
        <h3 className="text-lg font-semibold">Catálogo de Peligros GTC-45</h3>
        <p className="text-sm text-muted-foreground">
          78 peligros clasificados en 7 categorías según la GTC-45
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-muted/30 rounded-lg animate-pulse-subtle" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Categorías */}
          {categorias.map((categoria) => {
            const categoriaData = clasificacionesPorCategoria?.[categoria];
            if (!categoriaData) return null;

            return (
              <div key={categoria} className="space-y-3">
                <div
                  className="flex items-center gap-3 p-3 rounded-lg border"
                  style={{
                    backgroundColor: `${CATEGORIA_COLORS[categoria]}15`,
                    borderColor: CATEGORIA_COLORS[categoria],
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: CATEGORIA_COLORS[categoria] }}
                  />
                  <h4 className="font-semibold text-lg">{CATEGORIA_GTC45_LABELS[categoria]}</h4>
                  <span className="ml-auto text-sm text-muted-foreground">
                    {categoriaData.items?.length || 0} clasificaciones
                  </span>
                </div>

                {/* Clasificaciones */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pl-6">
                  {categoriaData.items?.map((clasificacion: ClasificacionPeligro) => (
                    <div
                      key={clasificacion.id}
                      className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedClasificacion(clasificacion.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{clasificacion.nombre}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {clasificacion.codigo}
                          </p>
                        </div>
                        {clasificacion.total_peligros !== undefined && (
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {clasificacion.total_peligros}
                          </span>
                        )}
                      </div>
                      {clasificacion.descripcion && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {clasificacion.descripcion}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de peligros por clasificación */}
      {selectedClasificacion && peligrosData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Peligros Detallados</h4>
              <Button variant="ghost" size="sm" onClick={() => setSelectedClasificacion(undefined)}>
                <X size={18} />
              </Button>
            </div>

            <div className="space-y-3">
              {Object.values(peligrosData).map((grupo: unknown) =>
                grupo.peligros?.map((peligro: PeligroGTC45) => (
                  <div key={peligro.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-medium">{peligro.nombre}</p>
                        <p className="text-sm text-muted-foreground mt-1">{peligro.codigo}</p>
                        {peligro.descripcion && (
                          <p className="text-sm mt-2">{peligro.descripcion}</p>
                        )}
                        {peligro.efectos_posibles && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-muted-foreground">
                              Efectos Posibles:
                            </p>
                            <p className="text-sm mt-1">{peligro.efectos_posibles}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== CONTROLES SECTION ====================

interface ControlesSectionProps {
  className?: string;
  canCreate?: boolean;
}

function ControlesSection({ className, canCreate = true }: ControlesSectionProps) {
  const { data: controlesData, isLoading: isLoadingControles } = useControlesSST();
  const { data: controlesPorTipo, isLoading: isLoadingPorTipo } = useControlesPorTipo();

  const controles = controlesData?.results || [];

  // Agrupar controles por tipo
  const controlesPorTipoMap = controles.reduce(
    (acc, control) => {
      const tipo = control.tipo_control;
      if (!acc[tipo]) {
        acc[tipo] = [];
      }
      acc[tipo].push(control);
      return acc;
    },
    {} as Record<TipoControlSST, ControlSST[]>
  );

  const tiposOrdenados: TipoControlSST[] = [
    'eliminacion',
    'sustitucion',
    'ingenieria',
    'administrativo',
    'epp',
  ];

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Jerarquía de Controles SST</h3>
          <p className="text-sm text-muted-foreground">
            Controles implementados según la jerarquía de control de riesgos
          </p>
        </div>
        {canCreate && (
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo Control
          </Button>
        )}
      </div>

      {/* Estadísticas por tipo */}
      {!isLoadingPorTipo && controlesPorTipo && controlesPorTipo.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {controlesPorTipo.map((item, idx) => {
            const tipoKey = item.tipo_control as TipoControlSST;
            const porcentajeImplementado =
              item.total > 0 ? (item.implementados / item.total) * 100 : 0;

            return (
              <div key={idx} className="bg-card rounded-lg border p-4">
                <div className="flex items-center justify-between mb-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span className="text-2xl font-bold">{item.total}</span>
                </div>
                <p className="text-sm font-medium mb-2">{TIPO_CONTROL_SST_LABELS[tipoKey]}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${porcentajeImplementado}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{item.implementados} implementados</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Controles por tipo (jerarquía) */}
      <div className="space-y-4">
        {isLoadingControles ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-muted/30 rounded-lg animate-pulse-subtle" />
            ))}
          </div>
        ) : (
          tiposOrdenados.map((tipo, nivel) => {
            const controlesDelTipo = controlesPorTipoMap[tipo] || [];
            if (controlesDelTipo.length === 0) return null;

            // Color según nivel de jerarquía
            const nivelColor = [
              'bg-green-100 border-green-500',
              'bg-blue-100 border-blue-500',
              'bg-yellow-100 border-yellow-500',
              'bg-orange-100 border-orange-500',
              'bg-red-100 border-red-500',
            ][nivel];

            return (
              <div key={tipo} className={cn('rounded-lg border-l-4 p-4', nivelColor)}>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  {TIPO_CONTROL_SST_LABELS[tipo]}
                  <span className="ml-auto text-sm text-muted-foreground">
                    {controlesDelTipo.length} controles
                  </span>
                </h4>

                <div className="space-y-2">
                  {controlesDelTipo.slice(0, 5).map((control) => (
                    <div
                      key={control.id}
                      className="bg-card rounded border p-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{control.descripcion}</p>
                          {control.matriz_area && control.matriz_cargo && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {control.matriz_area} - {control.matriz_cargo}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {control.estado_display && (
                            <span className="text-xs px-2 py-1 rounded bg-muted">
                              {control.estado_display}
                            </span>
                          )}
                          {control.efectividad_display && (
                            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                              {control.efectividad_display}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {controlesDelTipo.length > 5 && (
                    <Button variant="ghost" size="sm" className="w-full">
                      Ver todos ({controlesDelTipo.length - 5} más)
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}

        {!isLoadingControles && controles.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay controles SST registrados</p>
            <p className="text-sm mt-1">
              Comienza agregando controles a tus valoraciones de riesgo
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== MAIN TAB COMPONENT ====================

interface IPEVRTabProps {
  activeSection?: string;
}

export const IPEVRTab = ({ activeSection }: IPEVRTabProps) => {
  const { canDo } = usePermissions();
  const canCreateIPEVR = canDo(
    Modules.PROTECCION_CUMPLIMIENTO,
    Sections.IDENTIFICACION_PELIGROS,
    'create'
  );
  const canCreateControles = canDo(Modules.PROTECCION_CUMPLIMIENTO, Sections.CONTROLES, 'create');

  const [activeTab, setActiveTab] = useState<'resumen' | 'matriz' | 'peligros' | 'controles'>(
    'resumen'
  );

  // Si viene activeSection, renderizar directamente
  if (activeSection) {
    const renderBySection = () => {
      switch (activeSection) {
        case 'resumen':
          return <ResumenSection />;
        case 'matriz':
          return <MatrizSection canCreate={canCreateIPEVR} />;
        case 'peligros':
          return <PeligrosSection />;
        case 'controles':
          return <ControlesSection canCreate={canCreateControles} />;
        default:
          console.warn(
            `[IPEVRTab] Sección "${activeSection}" no encontrada. ` +
              `Secciones disponibles: resumen, matriz, peligros, controles`
          );
          return <ResumenSection />;
      }
    };

    return <div className="space-y-6">{renderBySection()}</div>;
  }

  // Tabs para navegación interna
  const tabs = [
    {
      id: 'resumen' as const,
      label: 'Resumen',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      id: 'matriz' as const,
      label: 'Matriz IPEVR',
      icon: <Table2 className="h-4 w-4" />,
    },
    {
      id: 'peligros' as const,
      label: 'Catálogo de Peligros',
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    {
      id: 'controles' as const,
      label: 'Controles SST',
      icon: <Shield className="h-4 w-4" />,
    },
  ];

  // Renderizar el componente según activeTab
  const renderContent = () => {
    switch (activeTab) {
      case 'resumen':
        return <ResumenSection />;
      case 'matriz':
        return <MatrizSection canCreate={canCreateIPEVR} />;
      case 'peligros':
        return <PeligrosSection />;
      case 'controles':
        return <ControlesSection canCreate={canCreateControles} />;
      default:
        return <ResumenSection />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            IPEVR - Matriz GTC-45
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Identificación de Peligros, Evaluación y Valoración de Riesgos
          </p>
        </div>
      </div>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as typeof activeTab)}
      />

      <div className="mt-6">{renderContent()}</div>
    </div>
  );
};

export default IPEVRTab;
