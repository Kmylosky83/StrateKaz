/**
 * Sección de Unidades de Medida - Catálogo de Solo Lectura
 * Sistema de Gestión StrateKaz
 *
 * Vista de consulta: Catálogo predefinido de unidades del sistema.
 * Las unidades de medida son estándares internacionales y NO se crean manualmente.
 * Solo admins pueden cargar las unidades del sistema si aún no están cargadas.
 *
 * Catálogo transversal usado por múltiples módulos:
 * - SedeEmpresa (capacidad de almacenamiento)
 * - Supply Chain (cantidades de productos)
 * - Gestión Ambiental (residuos, emisiones)
 * - Gestor Documental (tamaños de archivo)
 */
import { useState } from 'react';
import {
  Ruler,
  Download,
  Lock,
  Scale,
  Box,
  ArrowLeftRight,
  Square,
  Hash,
  Clock,
  Package,
  HelpCircle,
  ArrowRightLeft,
  Info,
} from 'lucide-react';
import { Badge, Button, Alert, BrandedSkeleton } from '@/components/common';
import { Select } from '@/components/forms/Select';
import { DataTableCard } from '@/components/layout';
import { DataSection } from '@/components/data-display';
import { usePermissions, useModuleColor } from '@/hooks';
import { Modules, Sections } from '@/constants/permissions';
import { getModuleColorClasses } from '@/utils/moduleColors';
import type { ModuleColor } from '@/utils/moduleColors';
import { useUnidadesMedida, useCargarUnidadesSistema } from '../hooks/useStrategic';
import type { UnidadMedidaList, CategoriaUnidad } from '../api/strategicApi';

// Iconos por categoría
const CATEGORIA_ICONS: Record<CategoriaUnidad, React.ComponentType<{ className?: string }>> = {
  MASA: Scale,
  VOLUMEN: Box,
  LONGITUD: ArrowLeftRight,
  AREA: Square,
  CANTIDAD: Hash,
  TIEMPO: Clock,
  CONTENEDOR: Package,
  OTRO: HelpCircle,
};

const CATEGORIA_LABELS: Record<CategoriaUnidad, string> = {
  MASA: 'Masa / Peso',
  VOLUMEN: 'Volumen',
  LONGITUD: 'Longitud',
  AREA: 'Área',
  CANTIDAD: 'Cantidad / Unidades',
  TIEMPO: 'Tiempo',
  CONTENEDOR: 'Contenedores / Embalaje',
  OTRO: 'Otro',
};

export const UnidadesMedidaSection = () => {
  // Color del módulo (sin hardcoding)
  const { color: moduleColor } = useModuleColor('GESTION_ESTRATEGICA');
  const colorClasses = getModuleColorClasses(moduleColor as ModuleColor);

  const { canDo } = usePermissions();
  const isAdmin = canDo(Modules.GESTION_ESTRATEGICA, Sections.UNIDADES_MEDIDA, 'delete');

  // Estado local — solo filtros
  const [filterCategoria, setFilterCategoria] = useState<CategoriaUnidad | ''>('');

  // Filtros para API
  const filters = {
    ...(filterCategoria && { categoria: filterCategoria }),
  };

  // Hooks de datos
  const { data: unidadesData, isLoading, error } = useUnidadesMedida(filters);
  const cargarSistemaMutation = useCargarUnidadesSistema();

  const unidades = unidadesData?.results || [];

  const handleCargarSistema = async () => {
    await cargarSistemaMutation.mutateAsync();
  };

  // Loading state
  if (isLoading) {
    return <BrandedSkeleton height="h-80" logoSize="xl" showText />;
  }

  // Error state
  if (error) {
    return (
      <Alert
        variant="error"
        title="Error"
        message="Error al cargar las unidades de medida. Intente de nuevo."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <DataSection
        icon={Ruler}
        iconBgClass={colorClasses.badge}
        iconClass={colorClasses.icon}
        title="Catálogo de Unidades de Medida"
        description="Unidades estándar predefinidas para el sistema"
        action={
          <div className="flex items-center gap-3 flex-nowrap">
            <Select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value as CategoriaUnidad | '')}
              options={[
                { value: '', label: 'Todas las categorías' },
                ...Object.entries(CATEGORIA_LABELS).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
              className="w-48"
            />
            {isAdmin && unidades.length === 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleCargarSistema}
                disabled={cargarSistemaMutation.isPending}
              >
                <Download
                  className={`h-4 w-4 mr-2 ${cargarSistemaMutation.isPending ? 'animate-spin' : ''}`}
                />
                Cargar Unidades del Sistema
              </Button>
            )}
          </div>
        }
      />

      {/* Info banner */}
      <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Las unidades de medida son estándares internacionales predefinidos. Se utilizan en sedes,
          supply chain, gestión ambiental y otros módulos.
        </p>
      </div>

      {/* Tabla de unidades (solo lectura) */}
      <DataTableCard
        isEmpty={unidades.length === 0}
        isLoading={false}
        emptyMessage={
          filterCategoria
            ? 'No se encontraron unidades en esta categoría.'
            : 'No hay unidades cargadas. Un administrador debe cargar las unidades del sistema.'
        }
      >
        {unidades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Código
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Nombre
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Símbolo
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Categoría
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Conversión
                  </th>
                </tr>
              </thead>
              <tbody>
                {unidades.map((unidad: UnidadMedidaList) => {
                  const CatIcon = CATEGORIA_ICONS[unidad.categoria] || HelpCircle;

                  return (
                    <tr
                      key={unidad.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded bg-gray-100 dark:bg-gray-800">
                            <CatIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                            {unidad.codigo}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {unidad.nombre}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary" size="sm">
                          {unidad.simbolo}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {unidad.categoria_display || CATEGORIA_LABELS[unidad.categoria]}
                      </td>
                      <td className="py-3 px-4">
                        {unidad.unidad_base_nombre && unidad.factor_conversion ? (
                          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                            <ArrowRightLeft className="h-3.5 w-3.5" />
                            <span>
                              1 {unidad.simbolo} = {Number(unidad.factor_conversion)}{' '}
                              {unidad.unidad_base_nombre}
                            </span>
                          </div>
                        ) : (
                          <Badge variant="info" size="sm">
                            <Lock className="h-3 w-3 mr-1" />
                            Base
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </DataTableCard>
    </div>
  );
};
