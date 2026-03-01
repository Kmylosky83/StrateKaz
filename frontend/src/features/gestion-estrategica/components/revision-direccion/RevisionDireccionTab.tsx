/**
 * Tab principal de Revisión por la Dirección (ISO 9.3)
 *
 * Secciones: programacion, actas, compromisos
 *
 * Características pro:
 * - Panel ISO 9001/14001/45001/27001 con contexto normativo
 * - Indicador de actualización en tiempo real
 * - Próximas revisiones con countdown
 */
import { useEffect, useState } from 'react';
import {
  RefreshCw,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Card, Button } from '@/components/common';
import { ProgramacionTab, ActasTab } from './subtabs';
import { CompromisosDashboard } from './CompromisosDashboard';
import {
  useRevisionDireccionDashboard,
  useProgramacionesProximas,
} from '../../hooks/useRevisionDireccion';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// ==================== PANEL ISO ====================

const ISO_SECTIONS = [
  {
    norma: 'ISO 9001:2015',
    clausula: '§ 9.3',
    titulo: 'Revisión por la Dirección',
    color: 'blue',
    elements: [
      { code: '9.3.1', label: 'Generalidades', done: true },
      { code: '9.3.2', label: 'Entradas de la revisión', done: true },
      { code: '9.3.3', label: 'Salidas de la revisión', done: true },
    ],
  },
  {
    norma: 'ISO 14001:2015',
    clausula: '§ 9.3',
    titulo: 'Revisión por la Dirección',
    color: 'green',
    elements: [
      { code: '9.3a', label: 'Estado de acciones previas', done: true },
      { code: '9.3b', label: 'Cambios en cuestiones externas/internas', done: true },
      { code: '9.3c', label: 'Desempeño ambiental', done: true },
      { code: '9.3d', label: 'Cumplimiento de obligaciones', done: true },
    ],
  },
  {
    norma: 'ISO 45001:2018',
    clausula: '§ 9.3',
    titulo: 'Revisión por la Dirección',
    color: 'yellow',
    elements: [
      { code: '9.3a', label: 'Estado de acciones de revisiones previas', done: true },
      { code: '9.3b', label: 'Cambios en cuestiones pertinentes', done: true },
      { code: '9.3c', label: 'Desempeño de SST', done: true },
      { code: '9.3d', label: 'Oportunidades de mejora continua', done: true },
    ],
  },
  {
    norma: 'ISO 27001:2022',
    clausula: '§ 9.3',
    titulo: 'Revisión por la Dirección',
    color: 'purple',
    elements: [
      { code: '9.3.1', label: 'General', done: true },
      { code: '9.3.2', label: 'Entradas de la revisión', done: true },
      { code: '9.3.3', label: 'Resultados de la revisión', done: true },
    ],
  },
];

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
  green: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
  yellow: 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300',
  purple: 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300',
};

const ISOPanel = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border-indigo-100 dark:border-indigo-900">
      <div className="p-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full !justify-between !min-h-0 text-left"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
              Marco Normativo — Revisión por la Dirección
            </span>
            <span className="text-xs text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
              ISO 9001 · 14001 · 45001 · 27001
            </span>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </Button>

        {expanded && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {ISO_SECTIONS.map((iso) => (
              <div
                key={iso.norma}
                className={`rounded-lg border p-3 ${colorMap[iso.color]}`}
              >
                <p className="text-xs font-bold mb-0.5">{iso.norma}</p>
                <p className="text-xs font-medium mb-2">
                  {iso.clausula} — {iso.titulo}
                </p>
                <ul className="space-y-1">
                  {iso.elements.map((el) => (
                    <li key={el.code} className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-current flex-shrink-0" />
                      <span className="text-xs">
                        <span className="font-mono font-medium">{el.code}</span>{' '}
                        {el.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

// ==================== PANEL PRÓXIMAS REVISIONES ====================

const ProximasRevisionesPanel = () => {
  const { data: proximas, dataUpdatedAt } = useProgramacionesProximas(3);
  const [now, setNow] = useState(new Date());

  // Reloj en tiempo real para el countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const list = proximas ?? [];
  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  if (list.length === 0) return null;

  return (
    <Card className="border-teal-100 dark:border-teal-900">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-teal-600" />
            Próximas Revisiones
          </h3>
          {lastUpdate && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <RefreshCw className="h-3 w-3" />
              {formatDistanceToNow(lastUpdate, { locale: es, addSuffix: true })}
            </span>
          )}
        </div>
        <div className="space-y-2">
          {list.map((prog) => {
            const fechaRevision = new Date(prog.fecha_programada);
            const isPast = fechaRevision < now;
            const distancia = formatDistanceToNow(fechaRevision, { locale: es, addSuffix: true });

            return (
              <div
                key={prog.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {isPast && prog.estado !== 'CANCELADA' ? (
                    <AlertCircle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-teal-500 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {prog.codigo}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(fechaRevision, "d 'de' MMMM, HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>
                <span
                  className={`ml-2 text-xs font-medium flex-shrink-0 ${
                    isPast ? 'text-orange-600' : 'text-teal-600'
                  }`}
                >
                  {distancia}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

// ==================== INDICADOR TIEMPO REAL ====================

const RealTimeIndicator = () => {
  const { isFetching, dataUpdatedAt } = useRevisionDireccionDashboard();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (dataUpdatedAt && dataUpdatedAt > 0) setLastUpdate(new Date(dataUpdatedAt));
  }, [dataUpdatedAt]);

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-400">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isFetching ? 'bg-blue-400 animate-pulse' : 'bg-green-400'
        }`}
      />
      {isFetching
        ? 'Actualizando...'
        : lastUpdate
        ? `Actualizado ${formatDistanceToNow(lastUpdate, { locale: es, addSuffix: true })}`
        : 'En tiempo real'}
    </div>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================

interface RevisionDireccionTabProps {
  activeSection: string;
}

const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  programacion: ProgramacionTab,
  actas: ActasTab,
  compromisos: CompromisosDashboard,
};

export const RevisionDireccionTab = ({ activeSection }: RevisionDireccionTabProps) => {
  const ActiveComponent = SECTION_COMPONENTS[activeSection] ?? ProgramacionTab;

  return (
    <div className="space-y-4">
      {/* Banner superior: indicador tiempo real + próximas revisiones */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <RealTimeIndicator />
        <ProximasRevisionesPanel />
      </div>

      {/* Panel normativo ISO (colapsable) */}
      <ISOPanel />

      {/* Contenido de la sección activa */}
      <ActiveComponent />
    </div>
  );
};
