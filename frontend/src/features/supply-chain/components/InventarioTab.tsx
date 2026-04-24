/**
 * Tab Inventario — Supply Chain (Fase 1 Dashboard Almacén).
 *
 * Vista de listado de almacenes con cards responsivas. Al hacer click se abre
 * AlmacenDashboardModal con KPIs, inventario por producto, kardex y alertas.
 */
import { useMemo, useState } from 'react';
import { AlertTriangle, History, Package, Warehouse } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';

import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';

import { useAlmacenes } from '../hooks/useAlmacenes';
import { useResumenGeneralSC } from '../hooks/useInventario';
import type { AlmacenResumenItem } from '../types/inventario.types';

import AlmacenDashboardModal from './AlmacenDashboardModal';

export default function InventarioTab() {
  const { data: almacenesList = [], isLoading: almLoading } = useAlmacenes({ is_active: true });
  const { data: resumen, isLoading: resumenLoading } = useResumenGeneralSC();

  /**
   * Combina información: usamos `resumen.almacenes` si el backend lo expone
   * (incluye ocupación, última recepción, alertas), sino caemos al catálogo
   * base de almacenes.
   */
  const almacenesCombined = useMemo<AlmacenResumenItem[]>(() => {
    if (resumen?.almacenes && resumen.almacenes.length > 0) return resumen.almacenes;
    return almacenesList.map((a) => ({
      id: a.id,
      codigo: a.codigo,
      nombre: a.nombre,
      is_active: a.is_active,
      tipo_almacen_nombre: a.tipo_almacen_nombre ?? null,
      sede_nombre: a.sede_nombre ?? null,
      cantidad_total: 0,
      capacidad_maxima: a.capacidad_maxima ?? null,
      ocupacion_pct: null,
      productos_distintos: 0,
      ultima_recepcion: null,
      dias_desde_ultima_recepcion: null,
      alertas_activas: 0,
    }));
  }, [resumen, almacenesList]);

  const [selected, setSelected] = useState<AlmacenResumenItem | null>(null);
  const [open, setOpen] = useState(false);

  const isLoading = almLoading || resumenLoading;

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : almacenesCombined.length === 0 ? (
        <EmptyState
          icon={<Warehouse className="w-16 h-16" />}
          title="No hay almacenes configurados"
          description="Configura almacenes en Catálogos → Tipos de almacén y Almacenes físicos por sede para comenzar a ver inventario."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {almacenesCombined.map((a) => (
            <AlmacenCard
              key={a.id}
              almacen={a}
              onClick={() => {
                setSelected(a);
                setOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <AlmacenDashboardModal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          setSelected(null);
        }}
        almacen={selected}
      />
    </div>
  );
}

interface AlmacenCardProps {
  almacen: AlmacenResumenItem;
  onClick: () => void;
}

function AlmacenCard({ almacen, onClick }: AlmacenCardProps) {
  const pctRaw = almacen.ocupacion_pct;
  const pct = pctRaw === null || pctRaw === undefined ? null : Number(pctRaw);
  const pctColor =
    pct === null || Number.isNaN(pct)
      ? 'bg-gray-300 dark:bg-gray-600'
      : pct >= 90
        ? 'bg-danger-500'
        : pct >= 70
          ? 'bg-warning-500'
          : 'bg-success-500';

  return (
    <Card
      variant="bordered"
      padding="md"
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-gray-500" />
            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
              {almacen.nombre}
            </h4>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {almacen.codigo}
            {almacen.sede_nombre ? ` · ${almacen.sede_nombre}` : ''}
          </p>
        </div>
        <Badge variant={almacen.is_active ? 'success' : 'gray'} size="sm">
          {almacen.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      </div>

      <div className="space-y-3">
        {/* Cantidad total + ocupación */}
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Cantidad actual</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatNumber(almacen.cantidad_total)}
            </span>
          </div>
          {almacen.capacidad_maxima ? (
            <>
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${pctColor}`}
                  style={{ width: `${Math.min(pct ?? 0, 100)}%` }}
                />
              </div>
              <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 flex justify-between">
                <span>
                  {pct !== null && !Number.isNaN(pct)
                    ? `${pct.toFixed(1)}% ocupación`
                    : 'Sin datos'}
                </span>
                <span>Cap. {formatNumber(almacen.capacidad_maxima)}</span>
              </div>
            </>
          ) : (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 italic">
              Sin capacidad máxima definida
            </p>
          )}
        </div>

        {/* Productos + última recepción + alertas */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <Mini icon={<Package className="w-3.5 h-3.5" />} label="Productos">
            {almacen.productos_distintos}
          </Mini>
          <Mini icon={<History className="w-3.5 h-3.5" />} label="Última recep.">
            {almacen.ultima_recepcion
              ? formatDistanceToNowStrict(new Date(almacen.ultima_recepcion), {
                  locale: es,
                  addSuffix: false,
                })
              : '—'}
          </Mini>
          <Mini icon={<AlertTriangle className="w-3.5 h-3.5" />} label="Alertas">
            <span
              className={
                (almacen.alertas_activas ?? 0) > 0
                  ? 'text-danger-600 dark:text-danger-400 font-semibold'
                  : ''
              }
            >
              {almacen.alertas_activas ?? 0}
            </span>
          </Mini>
        </div>
      </div>
    </Card>
  );
}

function Mini({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] text-gray-400 uppercase tracking-wide">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm text-gray-900 dark:text-white mt-0.5">{children}</div>
    </div>
  );
}

function formatNumber(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return '—';
  const num = typeof n === 'string' ? Number(n) : n;
  if (Number.isNaN(num)) return String(n);
  return num.toLocaleString('es-CO', { maximumFractionDigits: 3 });
}
