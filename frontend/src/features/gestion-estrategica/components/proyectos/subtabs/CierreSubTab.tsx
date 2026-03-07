/**
 * SubTab de Cierre — Workspace por proyecto
 * Selector de proyecto + Tabs: Checklist | Lecciones Aprendidas | Acta de Cierre
 */
import { useState, useEffect } from 'react';
import { Card, Badge, EmptyState } from '@/components/common';
import { Tabs } from '@/components/common/Tabs';
import { Select } from '@/components/forms';
import { useProyectos, useLecciones, useActasCierre } from '../../../hooks/useProyectos';
import { LeccionesSection } from '../cierre/LeccionesSection';
import { ActaCierreSection } from '../cierre/ActaCierreSection';
import type { Proyecto } from '../../../types/proyectos.types';
import type { Tab } from '@/components/common/Tabs';
import {
  CheckCircle2,
  ClipboardCheck,
  BookOpen,
  FileCheck,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

// ==================== TABS CONFIG ====================

const CIERRE_TABS: Tab[] = [
  { id: 'checklist', label: 'Checklist', icon: <ClipboardCheck className="h-4 w-4" /> },
  { id: 'lecciones', label: 'Lecciones', icon: <BookOpen className="h-4 w-4" /> },
  { id: 'acta', label: 'Acta de Cierre', icon: <FileCheck className="h-4 w-4" /> },
];

// ==================== CHECKLIST TAB ====================

interface CheckItem {
  label: string;
  completed: boolean;
  detail?: string;
}

const ChecklistTab = ({ proyectoId }: { proyectoId: number }) => {
  const { data: leccionesData } = useLecciones({ proyecto: proyectoId, is_active: true });
  const { data: actasData } = useActasCierre({ proyecto: proyectoId });

  const lecciones = leccionesData?.results ?? (Array.isArray(leccionesData) ? leccionesData : []);
  const actas = actasData?.results ?? (Array.isArray(actasData) ? actasData : []);
  const acta = actas[0];

  const items: CheckItem[] = [
    {
      label: 'Lecciones aprendidas registradas',
      completed: lecciones.length > 0,
      detail:
        lecciones.length > 0
          ? `${lecciones.length} lección(es) documentada(s)`
          : 'Registre al menos una lección aprendida',
    },
    {
      label: 'Acta de cierre generada',
      completed: !!acta,
      detail: acta
        ? `Generada el ${new Date(acta.fecha_cierre).toLocaleDateString('es-CO')}`
        : 'Genere el acta de cierre del proyecto',
    },
    {
      label: 'Objetivos evaluados',
      completed: !!acta?.objetivos_cumplidos,
      detail: acta?.objetivos_cumplidos
        ? 'Objetivos cumplidos documentados'
        : 'Documente los objetivos cumplidos y no cumplidos',
    },
    {
      label: 'Entregables verificados',
      completed: !!acta?.entregables_completados,
      detail: acta?.entregables_completados
        ? 'Entregables completados documentados'
        : 'Documente los entregables completados y pendientes',
    },
    {
      label: 'Evaluación general completada',
      completed: !!acta?.evaluacion_general,
      detail: acta?.evaluacion_general
        ? 'Evaluación general registrada'
        : 'Complete la evaluación general del proyecto',
    },
    {
      label: 'Acta aprobada por sponsor',
      completed: !!acta?.aprobado_por_sponsor,
      detail: acta?.aprobado_por_sponsor
        ? `Aprobada por ${acta.aprobado_por_nombre || 'Sponsor'}`
        : 'El sponsor debe aprobar el acta de cierre',
    },
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const progress = Math.round((completedCount / items.length) * 100);

  return (
    <Card>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Checklist de Cierre
          </h4>
          <Badge
            variant={progress === 100 ? 'success' : progress >= 50 ? 'warning' : 'gray'}
            size="sm"
          >
            {completedCount}/{items.length} completados
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              progress === 100 ? 'bg-green-600' : progress >= 50 ? 'bg-yellow-500' : 'bg-gray-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Items */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 py-3">
              {item.completed ? (
                <ShieldCheck className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-300 dark:text-gray-600 mt-0.5 shrink-0" />
              )}
              <div className="min-w-0">
                <p
                  className={`text-sm font-medium ${
                    item.completed
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {item.label}
                </p>
                {item.detail && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.detail}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================

export const CierreSubTab = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('checklist');

  const { data: proyectosCierre, isLoading: loadingCierre } = useProyectos({
    estado: 'cierre',
    is_active: true,
  });
  const { data: proyectosCompletados, isLoading: loadingCompletados } = useProyectos({
    estado: 'completado',
    is_active: true,
  });

  const isLoading = loadingCierre || loadingCompletados;

  const rawCierre =
    proyectosCierre?.results ?? (Array.isArray(proyectosCierre) ? proyectosCierre : []);
  const rawCompletados =
    proyectosCompletados?.results ??
    (Array.isArray(proyectosCompletados) ? proyectosCompletados : []);
  const proyectos: Proyecto[] = [...rawCierre, ...rawCompletados];

  // Auto-select first project
  useEffect(() => {
    if (proyectos.length > 0 && !selectedProjectId) {
      setSelectedProjectId(proyectos[0].id);
    }
  }, [proyectos, selectedProjectId]);

  const selectedProyecto = proyectos.find((p) => p.id === selectedProjectId);

  const proyectoOptions = [
    { value: '', label: 'Seleccionar proyecto...' },
    ...proyectos.map((p) => ({
      value: String(p.id),
      label: `${p.codigo} - ${p.nombre}`,
    })),
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <div className="p-6 animate-pulse-subtle">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (proyectos.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle2 className="h-12 w-12" />}
        title="No hay proyectos en cierre"
        description="Los proyectos pasarán a esta fase desde ejecución/monitoreo"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Project Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
        <div className="w-full sm:max-w-md">
          <Select
            label="Proyecto"
            value={selectedProjectId ? String(selectedProjectId) : ''}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedProjectId(val ? Number(val) : null);
              setActiveTab('checklist');
            }}
            options={proyectoOptions}
          />
        </div>
        {selectedProyecto && (
          <div className="flex items-center gap-2 pb-1">
            <Badge variant="info" size="sm">
              {selectedProyecto.codigo}
            </Badge>
            <Badge
              variant={selectedProyecto.estado === 'completado' ? 'success' : 'warning'}
              size="sm"
            >
              {selectedProyecto.estado_display ?? selectedProyecto.estado}
            </Badge>
            <span className="text-xs text-gray-500">
              {selectedProyecto.porcentaje_avance ?? 0}% avance
            </span>
          </div>
        )}
      </div>

      {selectedProjectId && (
        <>
          {/* Tabs */}
          <Tabs
            tabs={CIERRE_TABS}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="underline"
          />

          {/* Tab Content */}
          <div className="mt-4">
            {activeTab === 'checklist' && <ChecklistTab proyectoId={selectedProjectId} />}
            {activeTab === 'lecciones' && <LeccionesSection proyectoId={selectedProjectId} />}
            {activeTab === 'acta' && <ActaCierreSection proyectoId={selectedProjectId} />}
          </div>
        </>
      )}
    </div>
  );
};
