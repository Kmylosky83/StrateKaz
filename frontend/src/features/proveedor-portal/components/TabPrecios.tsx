/**
 * TabPrecios — Tabla de precios de materia prima del proveedor
 *
 * Visible para tipos: MATERIA_PRIMA, UNIDAD_NEGOCIO
 * (cualquier tipo con requiere_materia_prima = true)
 */
import { Badge, Skeleton } from '@/components/common';
import { DollarSign, TrendingUp } from 'lucide-react';
import { useMisPrecios } from '../hooks/useMiEmpresa';
import type { PrecioMateriaPrimaPortal } from '../types';

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(value: string | number | null): string {
  if (value == null) return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

/** Agrupa precios por categoría */
function groupByCategoria(
  precios: PrecioMateriaPrimaPortal[]
): Record<string, PrecioMateriaPrimaPortal[]> {
  const groups: Record<string, PrecioMateriaPrimaPortal[]> = {};
  for (const p of precios) {
    const cat = p.categoria_nombre || 'Sin categoría';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(p);
  }
  return groups;
}

export function TabPrecios() {
  const { data: precios, isLoading } = useMisPrecios();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const lista = precios ?? [];

  if (lista.length === 0) {
    return (
      <div className="text-center py-12">
        <DollarSign className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No hay precios de materia prima registrados.
        </p>
      </div>
    );
  }

  const grouped = groupByCategoria(lista);

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
        <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Se muestran los precios vigentes por tipo de materia prima. Los cambios de precio son
          gestionados por la empresa.
        </p>
      </div>

      {Object.entries(grouped).map(([categoria, items]) => (
        <div key={categoria}>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            {categoria}
          </h3>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl divide-y divide-gray-100 dark:divide-gray-700">
            {items.map((precio) => (
              <div
                key={precio.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {precio.tipo_materia_nombre}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Código: {precio.tipo_materia_codigo}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="info" size="sm">
                    {formatCurrency(precio.precio_kg)} / kg
                  </Badge>
                  <span className="text-xs text-gray-400">
                    Actualizado: {formatDate(precio.modificado_fecha)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
