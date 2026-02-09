/**
 * Modal wizard para agregar widgets a un dashboard
 * 4 pasos: Seleccionar KPI → Tipo Widget → Configurar → Confirmar
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button, Card, Badge, Spinner, EmptyState } from '@/components/common';
import { Input, Select } from '@/components/forms';
import { cn } from '@/utils/cn';
import {
  BarChart3,
  TrendingUp,
  BarChart,
  PieChart,
  Table,
  Gauge,
  Grid3x3,
  Search,
  ChevronRight,
  ChevronLeft,
  Check,
} from 'lucide-react';
import { useCatalogosKPI, useCreateWidgetDashboard } from '../hooks/useAnalytics';
import type { TipoWidget, CatalogoKPI } from '../types';

interface WidgetSelectorModalProps {
  vistaId: number;
  isOpen: boolean;
  onClose: () => void;
}

interface WidgetTypeOption {
  type: TipoWidget;
  icon: typeof BarChart3;
  label: string;
  description: string;
}

const WIDGET_TYPES: WidgetTypeOption[] = [
  {
    type: 'kpi_card',
    icon: BarChart3,
    label: 'Tarjeta KPI',
    description: 'Vista compacta con valor principal',
  },
  {
    type: 'grafico_linea',
    icon: TrendingUp,
    label: 'Gráfico de Línea',
    description: 'Tendencia en el tiempo',
  },
  {
    type: 'grafico_barra',
    icon: BarChart,
    label: 'Gráfico de Barras',
    description: 'Comparación de valores',
  },
  {
    type: 'grafico_pie',
    icon: PieChart,
    label: 'Gráfico Circular',
    description: 'Distribución porcentual',
  },
  {
    type: 'tabla',
    icon: Table,
    label: 'Tabla de Datos',
    description: 'Valores detallados',
  },
  {
    type: 'gauge',
    icon: Gauge,
    label: 'Velocímetro',
    description: 'Progreso vs meta',
  },
  {
    type: 'mapa_calor',
    icon: Grid3x3,
    label: 'Mapa de Calor',
    description: 'Visualización matricial',
  },
];

const ANCHO_OPTIONS = [
  { value: '3', label: '3 columnas (25%)' },
  { value: '4', label: '4 columnas (33%)' },
  { value: '6', label: '6 columnas (50%)' },
  { value: '8', label: '8 columnas (66%)' },
  { value: '12', label: '12 columnas (100%)' },
];

const ALTO_OPTIONS = [
  { value: '1', label: '1 fila (Pequeño)' },
  { value: '2', label: '2 filas (Mediano)' },
  { value: '3', label: '3 filas (Grande)' },
];

export const WidgetSelectorModal = ({
  vistaId,
  isOpen,
  onClose,
}: WidgetSelectorModalProps) => {
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Selections
  const [selectedKPI, setSelectedKPI] = useState<CatalogoKPI | null>(null);
  const [selectedType, setSelectedType] = useState<TipoWidget | null>(null);
  const [config, setConfig] = useState({
    titulo: '',
    ancho: '6',
    alto: '2',
    mostrar_tendencia: true,
    mostrar_meta: true,
    mostrar_semaforo: true,
  });

  const { data: kpisData, isLoading } = useCatalogosKPI({ activo: true });
  const createWidget = useCreateWidgetDashboard();

  const kpis = kpisData?.data || [];

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSearchTerm('');
      setCategoryFilter('');
      setSelectedKPI(null);
      setSelectedType(null);
      setConfig({
        titulo: '',
        ancho: '6',
        alto: '2',
        mostrar_tendencia: true,
        mostrar_meta: true,
        mostrar_semaforo: true,
      });
    }
  }, [isOpen]);

  // Update titulo when KPI selected
  useEffect(() => {
    if (selectedKPI && !config.titulo) {
      setConfig((prev) => ({ ...prev, titulo: selectedKPI.nombre }));
    }
  }, [selectedKPI, config.titulo]);

  // Filtrar KPIs
  const filteredKPIs = kpis.filter((kpi) => {
    const matchesSearch =
      searchTerm === '' ||
      kpi.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kpi.codigo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === '' || kpi.categoria === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(kpis.map((k) => k.categoria)));

  const handleSelectKPI = (kpi: CatalogoKPI) => {
    setSelectedKPI(kpi);
    setStep(2);
  };

  const handleSelectType = (type: TipoWidget) => {
    setSelectedType(type);
    setStep(3);
  };

  const handleConfigChange = (field: string, value: string | boolean) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!selectedKPI || !selectedType) return;

    const payload = {
      vista: vistaId,
      kpi: selectedKPI.id,
      tipo_widget: selectedType,
      posicion_fila: 0, // Backend will auto-assign
      posicion_columna: 0,
      ancho: parseInt(config.ancho),
      alto: parseInt(config.alto),
      mostrar_tendencia: config.mostrar_tendencia,
      mostrar_meta: config.mostrar_meta,
      mostrar_semaforo: config.mostrar_semaforo,
      configuracion_grafico: { titulo: config.titulo },
    };

    createWidget.mutate(payload, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="flex items-center">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
              s < step
                ? 'bg-green-500 text-white'
                : s === step
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            )}
          >
            {s < step ? <Check className="h-4 w-4" /> : s}
          </div>
          {s < 4 && (
            <div
              className={cn(
                'w-12 h-0.5 mx-1',
                s < step
                  ? 'bg-green-500'
                  : 'bg-gray-200 dark:bg-gray-700'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar KPI por nombre o código..."
            className="pl-10"
          />
        </div>
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          options={[
            { value: '', label: 'Todas las categorías' },
            ...categories.map((cat) => ({
              value: cat,
              label: cat.toUpperCase(),
            })),
          ]}
          className="w-48"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : filteredKPIs.length === 0 ? (
        <EmptyState
          title="No hay KPIs disponibles"
          description="No se encontraron KPIs activos con los filtros aplicados"
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
          {filteredKPIs.map((kpi) => (
            <Card
              key={kpi.id}
              className="p-4 cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
              onClick={() => handleSelectKPI(kpi)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{kpi.codigo}</Badge>
                    <Badge>{kpi.categoria}</Badge>
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {kpi.nombre}
                  </h4>
                  {kpi.descripcion && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                      {kpi.descripcion}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="mb-4">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
          KPI Seleccionado
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {selectedKPI?.codigo} - {selectedKPI?.nombre}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {WIDGET_TYPES.map((widget) => {
          const Icon = widget.icon;
          return (
            <Card
              key={widget.type}
              className="p-4 cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-md"
              onClick={() => handleSelectType(widget.type)}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {widget.label}
                  </h5>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {widget.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline">{selectedKPI?.codigo}</Badge>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <Badge>
            {WIDGET_TYPES.find((w) => w.type === selectedType)?.label}
          </Badge>
        </div>
      </div>

      <Input
        label="Título del Widget"
        value={config.titulo}
        onChange={(e) => handleConfigChange('titulo', e.target.value)}
        placeholder="Título personalizado"
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Ancho"
          value={config.ancho}
          onChange={(e) => handleConfigChange('ancho', e.target.value)}
          options={ANCHO_OPTIONS}
        />
        <Select
          label="Alto"
          value={config.alto}
          onChange={(e) => handleConfigChange('alto', e.target.value)}
          options={ALTO_OPTIONS}
        />
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
          <input
            type="checkbox"
            checked={config.mostrar_tendencia}
            onChange={(e) =>
              handleConfigChange('mostrar_tendencia', e.target.checked)
            }
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <div className="flex-1">
            <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
              Mostrar Tendencia
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Indicador de cambio vs período anterior
            </div>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
          <input
            type="checkbox"
            checked={config.mostrar_meta}
            onChange={(e) =>
              handleConfigChange('mostrar_meta', e.target.checked)
            }
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <div className="flex-1">
            <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
              Mostrar Meta
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Línea de meta objetivo
            </div>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
          <input
            type="checkbox"
            checked={config.mostrar_semaforo}
            onChange={(e) =>
              handleConfigChange('mostrar_semaforo', e.target.checked)
            }
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <div className="flex-1">
            <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
              Mostrar Semáforo
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Código de color según umbrales
            </div>
          </div>
        </label>
      </div>
    </div>
  );

  const renderStep4 = () => {
    const widgetType = WIDGET_TYPES.find((w) => w.type === selectedType);
    const Icon = widgetType?.icon || BarChart3;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
            <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Configuración Completada
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Revisa el resumen antes de agregar el widget
          </p>
        </div>

        <Card className="p-6 bg-gray-50 dark:bg-gray-800/50">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Tipo de Widget
                </div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {widgetType?.label}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                KPI
              </div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {selectedKPI?.codigo} - {selectedKPI?.nombre}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Título
              </div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {config.titulo}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Tamaño
                </div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {config.ancho} × {config.alto}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Opciones
                </div>
                <div className="flex flex-wrap gap-1">
                  {config.mostrar_tendencia && (
                    <Badge variant="outline" size="sm">
                      Tendencia
                    </Badge>
                  )}
                  {config.mostrar_meta && (
                    <Badge variant="outline" size="sm">
                      Meta
                    </Badge>
                  )}
                  {config.mostrar_semaforo && (
                    <Badge variant="outline" size="sm">
                      Semáforo
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const canGoNext =
    (step === 1 && selectedKPI) ||
    (step === 2 && selectedType) ||
    (step === 3 && config.titulo);

  const isPending = createWidget.isPending;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar Widget al Dashboard"
      size="2xl"
    >
      <div className="space-y-6">
        {renderStepIndicator()}

        <div className="min-h-[400px]">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={() => (step === 1 ? onClose() : setStep(step - 1))}
            disabled={isPending}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {step === 1 ? 'Cancelar' : 'Anterior'}
          </Button>

          {step < 4 ? (
            <Button
              variant="primary"
              onClick={() => setStep(step + 1)}
              disabled={!canGoNext}
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isPending}
              isLoading={isPending}
            >
              Agregar Widget
            </Button>
          )}
        </div>
      </div>
    </BaseModal>
  );
};
