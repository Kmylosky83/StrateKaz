/**
 * ContratosTab - Historial de Contratos con cumplimiento Ley 2466/2025
 * Sub-tab dentro de SeleccionSection para gestion contractual
 *
 * Funcionalidades:
 * - StatsGrid con metricas de contratos
 * - Alerta de contratos por vencer (30 dias)
 * - Tabla con filtros (tipo movimiento, vigentes, busqueda)
 * - Crear nuevo contrato/renovacion/otrosi/prorroga
 * - Firmar contrato
 * - Indicadores de warnings Ley 2466/2025
 */
import { useState, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ResponsiveTable } from '@/components/common/ResponsiveTable';
import type { ResponsiveTableColumn } from '@/components/common/ResponsiveTable';
import { cn } from '@/utils/cn';
import {
  FileText,
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  User,
  PenTool,
  CalendarClock,
  Clock,
  Send,
  RefreshCw,
  Mail,
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import {
  useHistorialContratos,
  useContratosPorVencer,
  useFirmarContrato,
  useEnviarContrato,
  useReenviarContrato,
} from '@/features/talent-hub/hooks/useSeleccionContratacion';
import { TIPO_MOVIMIENTO_OPTIONS, TIPO_MOVIMIENTO_BADGE } from '@/features/talent-hub/types';
import type { HistorialContratoList, HistorialContratoFilters } from '@/features/talent-hub/types';
import { ContratoFormModal } from './ContratoFormModal';

// ============================================================================
// StatsGrid
// ============================================================================

const StatsGrid = ({
  contratos,
  porVencer,
}: {
  contratos: HistorialContratoList[];
  porVencer: number;
}) => {
  const stats = useMemo(() => {
    const total = contratos.length;
    const vigentes = contratos.filter((c) => c.esta_vigente).length;
    const sinFirmar = contratos.filter((c) => !c.firmado).length;

    return [
      {
        label: 'Total',
        value: total,
        icon: FileText,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
      },
      {
        label: 'Vigentes',
        value: vigentes,
        icon: CheckCircle,
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-50 dark:bg-green-900/20',
      },
      {
        label: 'Por Vencer',
        value: porVencer,
        icon: AlertTriangle,
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-900/20',
      },
      {
        label: 'Sin Firmar',
        value: sinFirmar,
        icon: PenTool,
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-900/20',
      },
    ];
  }, [contratos, porVencer]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-center gap-3"
        >
          <div className={cn('p-2 rounded-lg', stat.bg)}>
            <stat.icon size={18} className={stat.color} />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// Alerta contratos por vencer
// ============================================================================

const AlertaPorVencer = ({ contratos }: { contratos: HistorialContratoList[] }) => {
  if (contratos.length === 0) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
        <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
          {contratos.length} contrato{contratos.length > 1 ? 's' : ''} por vencer en los proximos 30
          dias
        </span>
      </div>
      <div className="space-y-1">
        {contratos.slice(0, 5).map((c) => (
          <div key={c.id} className="flex items-center justify-between text-xs">
            <span className="text-amber-700 dark:text-amber-400">
              {c.colaborador_nombre} — {c.numero_contrato}
            </span>
            <span className="text-amber-600 font-medium">
              {c.dias_para_vencer != null ? `${c.dias_para_vencer} dias` : 'Sin fecha'}
            </span>
          </div>
        ))}
        {contratos.length > 5 && (
          <p className="text-xs text-amber-500 mt-1">... y {contratos.length - 5} mas</p>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Formato moneda COP
// ============================================================================

const formatCOP = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

// ============================================================================
// Columnas ResponsiveTable
// ============================================================================

const contratoColumns: ResponsiveTableColumn<HistorialContratoList & Record<string, unknown>>[] = [
  {
    key: 'colaborador',
    header: 'Colaborador',
    priority: 1,
    render: (item) => {
      const c = item as unknown as HistorialContratoList;
      return (
        <div className="flex items-center gap-2">
          <User size={14} className="text-gray-400 shrink-0" />
          <div>
            <p className="font-medium text-gray-900 dark:text-white truncate max-w-[180px]">
              {c.colaborador_nombre}
            </p>
            <p className="text-xs text-gray-500">{c.colaborador_identificacion}</p>
          </div>
        </div>
      );
    },
  },
  {
    key: 'numero_contrato',
    header: 'No. Contrato',
    priority: 2,
    render: (item) => {
      const c = item as unknown as HistorialContratoList;
      return (
        <span className="text-gray-700 dark:text-gray-300 font-mono text-xs">
          {c.numero_contrato}
        </span>
      );
    },
  },
  {
    key: 'tipo_contrato',
    header: 'Tipo',
    hideOnTablet: true,
    render: (item) => {
      const c = item as unknown as HistorialContratoList;
      return (
        <span className="text-xs text-gray-600 dark:text-gray-400">{c.tipo_contrato_nombre}</span>
      );
    },
  },
  {
    key: 'movimiento',
    header: 'Movimiento',
    priority: 2,
    render: (item) => {
      const c = item as unknown as HistorialContratoList;
      return (
        <div className="flex items-center gap-1">
          <Badge variant={TIPO_MOVIMIENTO_BADGE[c.tipo_movimiento]}>
            {c.tipo_movimiento_display}
          </Badge>
          {c.numero_renovacion > 0 && (
            <span className="text-[10px] text-gray-400">#{c.numero_renovacion}</span>
          )}
        </div>
      );
    },
  },
  {
    key: 'vigencia',
    header: 'Vigencia',
    render: (item) => {
      const c = item as unknown as HistorialContratoList;
      return (
        <div className="text-xs">
          <p className="text-gray-700 dark:text-gray-300">
            {new Date(c.fecha_inicio).toLocaleDateString('es-CO')}
          </p>
          {c.fecha_fin ? (
            <p className="text-gray-500">al {new Date(c.fecha_fin).toLocaleDateString('es-CO')}</p>
          ) : (
            <p className="text-green-600 dark:text-green-400 font-medium">Indefinido</p>
          )}
          {c.dias_para_vencer != null && c.dias_para_vencer <= 30 && c.dias_para_vencer >= 0 && (
            <p className="text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
              <CalendarClock size={10} />
              {c.dias_para_vencer}d
            </p>
          )}
        </div>
      );
    },
  },
  {
    key: 'salario',
    header: 'Salario',
    align: 'right',
    hideOnTablet: true,
    render: (item) => {
      const c = item as unknown as HistorialContratoList;
      return (
        <span className="text-gray-700 dark:text-gray-300 font-medium text-xs">
          {formatCOP(c.salario_pactado)}
        </span>
      );
    },
  },
  {
    key: 'estado',
    header: 'Estado',
    align: 'center',
    priority: 1,
    render: (item) => {
      const c = item as unknown as HistorialContratoList;
      return (
        <div className="flex flex-col items-center gap-1">
          {c.esta_vigente ? (
            <Badge variant="success">Vigente</Badge>
          ) : (
            <Badge variant="gray">Vencido</Badge>
          )}
          {c.firmado ? (
            <span className="text-[10px] text-green-600 flex items-center gap-0.5">
              <PenTool size={8} /> Firmado
            </span>
          ) : c.firma_enviada && !c.firma_token_expirado ? (
            <span className="text-[10px] text-blue-600 flex items-center gap-0.5">
              <Mail size={8} /> Enviado
            </span>
          ) : c.firma_enviada && c.firma_token_expirado ? (
            <span className="text-[10px] text-red-600 flex items-center gap-0.5">
              <Clock size={8} /> Expirado
            </span>
          ) : (
            <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
              <PenTool size={8} /> Sin firmar
            </span>
          )}
        </div>
      );
    },
  },
];

// ============================================================================
// Componente Principal
// ============================================================================

export const ContratosTab = () => {
  // RBAC
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.TALENT_HUB, Sections.CONTRATOS, 'create');
  const canEdit = canDo(Modules.TALENT_HUB, Sections.CONTRATOS, 'edit');

  // Filtros
  const [filters, setFilters] = useState<HistorialContratoFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showVigentes, setShowVigentes] = useState(false);

  // Datos
  const { data: contratosData, isLoading } = useHistorialContratos({
    ...filters,
    vigentes: showVigentes || undefined,
  });
  const { data: porVencerData } = useContratosPorVencer(30);
  const firmarMutation = useFirmarContrato();
  const enviarMutation = useEnviarContrato();
  const reenviarMutation = useReenviarContrato();

  // Modales
  const [showFormModal, setShowFormModal] = useState(false);
  const [showFirmarDialog, setShowFirmarDialog] = useState(false);
  const [showEnviarDialog, setShowEnviarDialog] = useState(false);
  const [firmarId, setFirmarId] = useState<number | null>(null);
  const [enviarId, setEnviarId] = useState<number | null>(null);

  const contratos = useMemo(() => contratosData?.results || [], [contratosData]);
  const porVencer = porVencerData?.results || [];

  // Filtrar por busqueda local
  const filteredContratos = useMemo(() => {
    if (!searchTerm) return contratos;
    const term = searchTerm.toLowerCase();
    return contratos.filter(
      (c) =>
        c.colaborador_nombre?.toLowerCase().includes(term) ||
        c.numero_contrato?.toLowerCase().includes(term) ||
        c.tipo_contrato_nombre?.toLowerCase().includes(term)
    );
  }, [contratos, searchTerm]);

  const handleFilterChange = (field: keyof HistorialContratoFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value || undefined,
    }));
  };

  const handleFirmar = (id: number) => {
    setFirmarId(id);
    setShowFirmarDialog(true);
  };

  const confirmFirmar = () => {
    if (firmarId) {
      firmarMutation.mutate(firmarId, {
        onSuccess: () => setShowFirmarDialog(false),
      });
    }
  };

  const handleEnviarFirma = (id: number) => {
    setEnviarId(id);
    setShowEnviarDialog(true);
  };

  const confirmEnviarFirma = () => {
    if (enviarId) {
      const contrato = contratos.find((c) => c.id === enviarId);
      const mutation = contrato?.firma_enviada ? reenviarMutation : enviarMutation;
      mutation.mutate(enviarId, {
        onSuccess: () => setShowEnviarDialog(false),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StatsGrid contratos={contratos} porVencer={porVencer.length} />

      {/* Alerta por vencer */}
      <AlertaPorVencer contratos={porVencer} />

      {/* Tabla de contratos */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <FileText size={16} />
            Historial de Contratos
            <span className="text-xs text-gray-400 font-normal">(Ley 2466/2025)</span>
          </h3>
          {canCreate && (
            <Button size="sm" onClick={() => setShowFormModal(true)}>
              <Plus size={14} className="mr-1" />
              Nuevo Contrato
            </Button>
          )}
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar colaborador, contrato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={filters.tipo_movimiento || ''}
            onChange={(e) => handleFilterChange('tipo_movimiento', e.target.value)}
          >
            <option value="">Todos los tipos</option>
            {TIPO_MOVIMIENTO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg">
            <input
              type="checkbox"
              checked={showVigentes}
              onChange={(e) => setShowVigentes(e.target.checked)}
              className="rounded border-gray-300"
            />
            Solo vigentes
          </label>
          <div /> {/* Spacer */}
        </div>

        {/* Tabla */}
        {filteredContratos.length === 0 ? (
          <EmptyState
            icon={
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                <FileText size={24} className="text-blue-500" />
              </div>
            }
            title="Sin contratos"
            description="No se encontraron contratos con los filtros actuales."
          />
        ) : (
          <ResponsiveTable<HistorialContratoList & Record<string, unknown>>
            data={filteredContratos as (HistorialContratoList & Record<string, unknown>)[]}
            columns={contratoColumns}
            keyExtractor={(item) => item.id}
            mobileCardTitle={(item) => (
              <div className="flex items-center gap-2">
                <User size={14} className="text-gray-400" />
                <span>{(item as unknown as HistorialContratoList).colaborador_nombre}</span>
              </div>
            )}
            mobileCardSubtitle={(item) => {
              const c = item as unknown as HistorialContratoList;
              return (
                <span className="font-mono text-xs">
                  {c.numero_contrato} — {c.tipo_contrato_nombre}
                </span>
              );
            }}
            renderActions={(item) => {
              const c = item as unknown as HistorialContratoList;
              if (c.firmado || !canEdit) return null;
              return (
                <div className="flex items-center gap-1">
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => handleEnviarFirma(c.id)}
                    title={
                      c.firma_enviada ? 'Reenviar email de firma' : 'Enviar para firma digital'
                    }
                  >
                    {c.firma_enviada ? (
                      <RefreshCw size={14} className="text-blue-500" />
                    ) : (
                      <Send size={14} className="text-blue-500" />
                    )}
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => handleFirmar(c.id)}
                    title="Marcar como firmado (manual)"
                  >
                    <PenTool size={14} className="text-green-500" />
                  </Button>
                </div>
              );
            }}
            hoverable
            dense
          />
        )}
      </Card>

      {/* Modales */}
      {showFormModal && (
        <ContratoFormModal isOpen={showFormModal} onClose={() => setShowFormModal(false)} />
      )}

      <ConfirmDialog
        isOpen={showFirmarDialog}
        onClose={() => setShowFirmarDialog(false)}
        onConfirm={confirmFirmar}
        title="Firmar Contrato"
        message="Confirma que el contrato ha sido firmado por ambas partes? Se registrara la fecha de firma actual."
        confirmText="Confirmar Firma"
        variant="info"
        isLoading={firmarMutation.isPending}
      />

      <ConfirmDialog
        isOpen={showEnviarDialog}
        onClose={() => setShowEnviarDialog(false)}
        onConfirm={confirmEnviarFirma}
        title="Enviar para Firma Digital"
        message="Se enviara un email al colaborador con un enlace para firmar digitalmente el contrato. El enlace tendra una validez de 7 dias."
        confirmText="Enviar Email"
        variant="info"
        isLoading={enviarMutation.isPending || reenviarMutation.isPending}
      />
    </div>
  );
};
