/**
 * Modal para crear/editar Estrategias TOWS
 *
 * Estrategias cruzadas de la matriz TOWS:
 * - FO (Fortalezas-Oportunidades): Ofensiva
 * - FA (Fortalezas-Amenazas): Defensiva
 * - DO (Debilidades-Oportunidades): Adaptativa
 * - DA (Debilidades-Amenazas): Supervivencia
 *
 * Usa Design System dinamico sin colores hardcoded
 */
import { useState, useEffect } from 'react';
import {
  Target,
  Calendar,
  Users,
  Building2,
  Flag,
  TrendingUp,
  Shield,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Slider } from '@/components/forms/Slider';
import {
  useCreateEstrategiaTows,
  useUpdateEstrategiaTows,
  useEstrategiaTowsDetail,
  useAnalisisDofa,
} from '../../hooks/useContexto';
import { useAreas } from '../../hooks/useAreas';
import { useSelectCargos } from '@/hooks/useSelectLists';
import type {
  EstrategiaTOWS,
  CreateEstrategiaTOWSDTO,
  UpdateEstrategiaTOWSDTO,
  TipoEstrategiaTOWS,
  Prioridad,
  EstadoEstrategia,
} from '../../types/contexto.types';
import {
  TIPO_ESTRATEGIA_TOWS_CONFIG,
  PRIORIDAD_CONFIG,
  ESTADO_ESTRATEGIA_CONFIG,
} from '../../types/contexto.types';
import { ConvertirObjetivoModal } from './ConvertirObjetivoModal';

// =============================================================================
// INTERFACES
// =============================================================================

interface EstrategiaTowsFormModalProps {
  estrategia: EstrategiaTOWS | null;
  analisisId?: number;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  analisis: string;
  tipo: TipoEstrategiaTOWS;
  descripcion: string;
  objetivo: string;
  responsable: string;
  area_responsable: string;
  fecha_implementacion: string;
  fecha_limite: string;
  prioridad: Prioridad;
  estado: EstadoEstrategia;
  recursos_necesarios: string;
  indicadores_exito: string;
  progreso_porcentaje: number;
}

// =============================================================================
// CONSTANTES
// =============================================================================

const defaultFormData: FormData = {
  analisis: '',
  tipo: 'fo',
  descripcion: '',
  objetivo: '',
  responsable: '',
  area_responsable: '',
  fecha_implementacion: new Date().toISOString().split('T')[0],
  fecha_limite: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  prioridad: 'media',
  estado: 'propuesta',
  recursos_necesarios: '',
  indicadores_exito: '',
  progreso_porcentaje: 0,
};

const TIPO_ESTRATEGIA_OPTIONS: {
  value: TipoEstrategiaTOWS;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: 'fo', label: 'FO - Ofensiva', icon: TrendingUp },
  { value: 'fa', label: 'FA - Defensiva', icon: Shield },
  { value: 'do', label: 'DO - Adaptativa', icon: Lightbulb },
  { value: 'da', label: 'DA - Supervivencia', icon: AlertTriangle },
];

const PRIORIDAD_OPTIONS = Object.entries(PRIORIDAD_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}));

const ESTADO_OPTIONS = Object.entries(ESTADO_ESTRATEGIA_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}));

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const EstrategiaTowsFormModal = ({
  estrategia,
  analisisId,
  isOpen,
  onClose,
}: EstrategiaTowsFormModalProps) => {
  const isEditing = estrategia !== null;

  // Form state
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [showConvertirModal, setShowConvertirModal] = useState(false);

  // Queries
  const { data: estrategiaDetail } = useEstrategiaTowsDetail(estrategia?.id);
  const { data: analisisData } = useAnalisisDofa({}, 1, 100);
  const { data: areasData } = useAreas();
  const { data: cargosData } = useSelectCargos();

  // Mutations
  const createMutation = useCreateEstrategiaTows();
  const updateMutation = useUpdateEstrategiaTows();

  // Cargar datos al editar
  useEffect(() => {
    if (isEditing && estrategiaDetail) {
      setFormData({
        analisis: estrategiaDetail.analisis.toString(),
        tipo: estrategiaDetail.tipo,
        descripcion: estrategiaDetail.descripcion,
        objetivo: estrategiaDetail.objetivo || '',
        responsable: estrategiaDetail.responsable?.toString() || '',
        area_responsable: estrategiaDetail.area_responsable?.toString() || '',
        fecha_implementacion: estrategiaDetail.fecha_implementacion?.split('T')[0] || '',
        fecha_limite: estrategiaDetail.fecha_limite?.split('T')[0] || '',
        prioridad: estrategiaDetail.prioridad,
        estado: estrategiaDetail.estado,
        recursos_necesarios: estrategiaDetail.recursos_necesarios || '',
        indicadores_exito: estrategiaDetail.indicadores_exito || '',
        progreso_porcentaje: estrategiaDetail.progreso_porcentaje || 0,
      });
    } else if (!isEditing) {
      setFormData({
        ...defaultFormData,
        analisis: analisisId?.toString() || '',
      });
    }
  }, [estrategiaDetail, isEditing, isOpen, analisisId]);

  // Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && estrategia) {
      const updateData: UpdateEstrategiaTOWSDTO = {
        tipo: formData.tipo,
        descripcion: formData.descripcion,
        objetivo: formData.objetivo,
        responsable: formData.responsable ? parseInt(formData.responsable) : undefined,
        area_responsable: formData.area_responsable
          ? parseInt(formData.area_responsable)
          : undefined,
        fecha_implementacion: formData.fecha_implementacion || undefined,
        fecha_limite: formData.fecha_limite || undefined,
        prioridad: formData.prioridad,
        estado: formData.estado,
        recursos_necesarios: formData.recursos_necesarios || undefined,
        indicadores_exito: formData.indicadores_exito || undefined,
        progreso_porcentaje: formData.progreso_porcentaje,
      };
      await updateMutation.mutateAsync({ id: estrategia.id, data: updateData });
    } else {
      const createData: CreateEstrategiaTOWSDTO = {
        analisis: parseInt(formData.analisis),
        tipo: formData.tipo,
        descripcion: formData.descripcion,
        objetivo: formData.objetivo,
        responsable: formData.responsable ? parseInt(formData.responsable) : undefined,
        area_responsable: formData.area_responsable
          ? parseInt(formData.area_responsable)
          : undefined,
        fecha_implementacion: formData.fecha_implementacion || undefined,
        fecha_limite: formData.fecha_limite || undefined,
        prioridad: formData.prioridad,
        recursos_necesarios: formData.recursos_necesarios || undefined,
        indicadores_exito: formData.indicadores_exito || undefined,
      };
      await createMutation.mutateAsync(createData);
    }

    onClose();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Options
  const analisisOptions =
    analisisData?.results?.map((a) => ({
      value: a.id.toString(),
      label: a.nombre,
    })) || [];

  const areaOptions =
    areasData?.results?.map((a) => ({
      value: a.id.toString(),
      label: a.name,
    })) || [];

  // Opciones para Cargo Responsable
  const cargoOptions =
    cargosData?.map((c) => ({
      value: c.id.toString(),
      label: c.label,
    })) || [];

  const selectedTipoConfig = TIPO_ESTRATEGIA_TOWS_CONFIG[formData.tipo];

  // Footer con botones
  const footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button
        type="submit"
        variant="primary"
        onClick={handleSubmit}
        disabled={isLoading || !formData.descripcion || (!isEditing && !formData.analisis)}
        isLoading={isLoading}
      >
        {isEditing ? 'Guardar Cambios' : 'Crear Estrategia'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Estrategia TOWS' : 'Nueva Estrategia TOWS'}
      subtitle={selectedTipoConfig.description}
      size="3xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seccion: Tipo de Estrategia */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Tipo de Estrategia
          </h4>

          <div className="grid grid-cols-4 gap-3">
            {TIPO_ESTRATEGIA_OPTIONS.map(({ value, label, icon: Icon }) => {
              const config = TIPO_ESTRATEGIA_TOWS_CONFIG[value];
              const isSelected = formData.tipo === value;

              return (
                <Button
                  key={value}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData({ ...formData, tipo: value })}
                  className={`!p-4 !min-h-0 rounded-lg border-2 !justify-start text-left transition-all w-full ${
                    isSelected
                      ? `${config.bgClass} ${config.borderClass}`
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-start w-full">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon
                        className={`h-5 w-5 ${isSelected ? config.textClass : 'text-gray-500'}`}
                      />
                      <span
                        className={`text-sm font-semibold ${isSelected ? config.textClass : ''}`}
                      >
                        {label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{config.description}</p>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Seccion: Analisis Asociado */}
        {!isEditing && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
              <Target className="h-4 w-4" />
              Analisis DOFA Asociado
            </h4>

            <Select
              label="Analisis DOFA *"
              value={formData.analisis}
              onChange={(e) => setFormData({ ...formData, analisis: e.target.value })}
              options={[{ value: '', label: 'Seleccione un analisis...' }, ...analisisOptions]}
              required
              helperText="Esta estrategia se derivara de los factores del analisis DOFA seleccionado"
            />
          </div>
        )}

        {/* Seccion: Descripcion y Objetivo */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Descripcion de la Estrategia
          </h4>

          <Textarea
            label="Descripción *"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            placeholder="Describa la estrategia a implementar..."
            rows={3}
            required
          />

          <Textarea
            label="Objetivo"
            value={formData.objetivo}
            onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
            placeholder="Objetivo especifico que se busca alcanzar..."
            rows={2}
          />
        </div>

        {/* Seccion: Responsables y Fechas */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Planificacion
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Cargo Responsable"
              value={formData.responsable}
              onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
              options={[{ value: '', label: 'Sin asignar' }, ...cargoOptions]}
            />
            <Select
              label="Area Responsable"
              value={formData.area_responsable}
              onChange={(e) => setFormData({ ...formData, area_responsable: e.target.value })}
              options={[{ value: '', label: 'Sin asignar' }, ...areaOptions]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Prioridad"
              value={formData.prioridad}
              onChange={(e) => setFormData({ ...formData, prioridad: e.target.value as Prioridad })}
              options={PRIORIDAD_OPTIONS}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label="Fecha de Implementacion"
              value={formData.fecha_implementacion}
              onChange={(e) => setFormData({ ...formData, fecha_implementacion: e.target.value })}
            />
            <Input
              type="date"
              label="Fecha Limite"
              value={formData.fecha_limite}
              onChange={(e) => setFormData({ ...formData, fecha_limite: e.target.value })}
              min={formData.fecha_implementacion}
            />
          </div>
        </div>

        {/* Seccion: Estado y Progreso (solo edicion) */}
        {isEditing && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Estado y Progreso
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Estado"
                value={formData.estado}
                onChange={(e) =>
                  setFormData({ ...formData, estado: e.target.value as EstadoEstrategia })
                }
                options={ESTADO_OPTIONS}
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Progreso: {formData.progreso_porcentaje}%
                </label>
                <div className="pt-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={formData.progreso_porcentaje}
                    onChange={(e) =>
                      setFormData({ ...formData, progreso_porcentaje: parseInt(e.target.value) })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${formData.progreso_porcentaje}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Seccion: Alineacion con Objetivo Estrategico (solo edicion) */}
        {isEditing && estrategiaDetail && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
              <Target className="h-4 w-4" />
              Alineacion Estrategica
            </h4>

            {estrategiaDetail.objetivo_estrategico ? (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Vinculada a Objetivo Estrategico
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      <span className="font-mono">
                        {estrategiaDetail.objetivo_estrategico_code}
                      </span>
                      {estrategiaDetail.objetivo_estrategico_name && (
                        <span className="ml-2">- {estrategiaDetail.objetivo_estrategico_name}</span>
                      )}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.open(
                        `/gestion-estrategica/planeacion?objetivo=${estrategiaDetail.objetivo_estrategico}`,
                        '_blank'
                      );
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Ver Objetivo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Sin Objetivo Estrategico
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Convierte esta estrategia en un objetivo para monitorear KPIs
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setShowConvertirModal(true)}
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    Convertir a Objetivo
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Seccion: Recursos e Indicadores */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Recursos e Indicadores
          </h4>

          <Textarea
            label="Recursos Necesarios"
            value={formData.recursos_necesarios}
            onChange={(e) => setFormData({ ...formData, recursos_necesarios: e.target.value })}
            placeholder="Presupuesto, personal, herramientas, etc..."
            rows={2}
          />

          <Textarea
            label="Indicadores de Exito"
            value={formData.indicadores_exito}
            onChange={(e) => setFormData({ ...formData, indicadores_exito: e.target.value })}
            placeholder="KPIs o metricas para medir el exito de la estrategia..."
            rows={2}
          />
        </div>
      </form>

      {/* Modal para convertir a objetivo */}
      {estrategiaDetail && (
        <ConvertirObjetivoModal
          isOpen={showConvertirModal}
          onClose={() => setShowConvertirModal(false)}
          estrategia={estrategiaDetail}
          onSuccess={() => {
            setShowConvertirModal(false);
          }}
        />
      )}
    </BaseModal>
  );
};

export default EstrategiaTowsFormModal;
