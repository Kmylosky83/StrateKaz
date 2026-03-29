/**
 * Modal para crear/editar Analisis PESTEL
 *
 * Formulario completo para gestion de analisis PESTEL:
 * - Tab Datos Basicos: nombre, periodo, responsable, conclusiones
 * - Tab Factores: lista CRUD de factores (P/E/S/T/E/L)
 *
 * Usa Design System dinamico sin colores hardcoded
 */
import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Target,
  Landmark,
  DollarSign,
  Users,
  Cpu,
  Leaf,
  Scale,
  TrendingUp,
  Minus,
  TrendingDown,
} from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Alert } from '@/components/common/Alert';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import {
  useCreateAnalisisPestel,
  useUpdateAnalisisPestel,
  useAnalisisPestelDetail,
  useFactoresPestel,
  useCreateFactorPestel,
  useUpdateFactorPestel,
  useDeleteFactorPestel,
  useTiposAnalisisPestel,
} from '../../hooks/useContexto';
import { useSelectCargos } from '@/hooks/useSelectLists';
import type {
  AnalisisPESTEL,
  FactorPESTEL,
  CreateAnalisisPESTELDTO,
  UpdateAnalisisPESTELDTO,
  CreateFactorPESTELDTO,
  UpdateFactorPESTELDTO,
  TipoFactorPESTEL,
  NivelImpacto,
  TendenciaFactor,
} from '../../types/contexto.types';
import {
  TIPO_FACTOR_PESTEL_CONFIG,
  NIVEL_IMPACTO_CONFIG,
  TENDENCIA_FACTOR_CONFIG,
} from '../../types/contexto.types';

// =============================================================================
// INTERFACES
// =============================================================================

interface AnalisisPestelFormModalProps {
  analisis: AnalisisPESTEL | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  tipo_analisis: string;
  nombre: string;
  fecha_analisis: string;
  periodo: string;
  responsable: string;
  conclusiones: string;
}

interface FactorForm {
  tipo: TipoFactorPESTEL;
  descripcion: string;
  tendencia: TendenciaFactor;
  impacto: NivelImpacto;
  probabilidad: NivelImpacto;
  implicaciones: string;
  fuentes: string;
}

// =============================================================================
// CONSTANTES
// =============================================================================

const defaultFormData: FormData = {
  tipo_analisis: '',
  nombre: '',
  fecha_analisis: new Date().toISOString().split('T')[0],
  periodo: new Date().getFullYear().toString(),
  responsable: '',
  conclusiones: '',
};

const defaultFactorForm: FactorForm = {
  tipo: 'politico',
  descripcion: '',
  tendencia: 'estable',
  impacto: 'medio',
  probabilidad: 'medio',
  implicaciones: '',
  fuentes: '',
};

const TIPO_FACTOR_OPTIONS: { value: TipoFactorPESTEL; label: string; icon: React.ElementType }[] = [
  { value: 'politico', label: 'Político', icon: Landmark },
  { value: 'economico', label: 'Económico', icon: DollarSign },
  { value: 'social', label: 'Social', icon: Users },
  { value: 'tecnologico', label: 'Tecnologico', icon: Cpu },
  { value: 'ecologico', label: 'Ecológico', icon: Leaf },
  { value: 'legal', label: 'Legal', icon: Scale },
];

const IMPACTO_OPTIONS = Object.entries(NIVEL_IMPACTO_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}));

const TENDENCIA_OPTIONS = Object.entries(TENDENCIA_FACTOR_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}));

const getTendenciaIcon = (tendencia: TendenciaFactor) => {
  switch (tendencia) {
    case 'mejorando':
      return TrendingUp;
    case 'empeorando':
      return TrendingDown;
    default:
      return Minus;
  }
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const AnalisisPestelFormModal = ({
  analisis,
  isOpen,
  onClose,
}: AnalisisPestelFormModalProps) => {
  const isEditing = analisis !== null;

  // Form state
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [activeTab, setActiveTab] = useState<'datos' | 'factores'>('datos');

  // Factor state
  const [factorForm, setFactorForm] = useState<FactorForm>(defaultFactorForm);
  const [editingFactorId, setEditingFactorId] = useState<number | null>(null);
  const [filterTipo, setFilterTipo] = useState<TipoFactorPESTEL | ''>('');

  // Queries
  const { data: analisisDetail } = useAnalisisPestelDetail(analisis?.id);
  const { data: factoresData } = useFactoresPestel(
    analisis?.id ? { analisis: analisis.id } : undefined
  );
  const { data: tiposAnalisisData } = useTiposAnalisisPestel();
  const { data: cargosData } = useSelectCargos();

  // Opciones para selects
  const tipoAnalisisOptions =
    tiposAnalisisData?.results?.map((t) => ({
      value: t.id.toString(),
      label: t.nombre,
    })) || [];

  const cargoOptions =
    cargosData?.map((c) => ({
      value: c.id.toString(),
      label: c.label,
    })) || [];

  // Mutations
  const createMutation = useCreateAnalisisPestel();
  const updateMutation = useUpdateAnalisisPestel();
  const createFactorMutation = useCreateFactorPestel();
  const updateFactorMutation = useUpdateFactorPestel();
  const deleteFactorMutation = useDeleteFactorPestel();

  // Cargar datos al editar
  useEffect(() => {
    if (isEditing && analisisDetail) {
      setFormData({
        tipo_analisis: analisisDetail.tipo_analisis?.toString() || '',
        nombre: analisisDetail.nombre,
        fecha_analisis: analisisDetail.fecha_analisis.split('T')[0],
        periodo: analisisDetail.periodo,
        responsable: analisisDetail.responsable?.toString() || '',
        conclusiones: analisisDetail.conclusiones || '',
      });
    } else if (!isEditing) {
      setFormData(defaultFormData);
      setActiveTab('datos');
    }
  }, [analisisDetail, isEditing, isOpen]);

  // Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && analisis) {
      const updateData: UpdateAnalisisPESTELDTO = {
        tipo_analisis: formData.tipo_analisis ? parseInt(formData.tipo_analisis) : undefined,
        nombre: formData.nombre,
        fecha_analisis: formData.fecha_analisis,
        periodo: formData.periodo,
        responsable: formData.responsable ? parseInt(formData.responsable) : undefined,
        conclusiones: formData.conclusiones || undefined,
      };
      await updateMutation.mutateAsync({ id: analisis.id, data: updateData });
    } else {
      const createData: CreateAnalisisPESTELDTO = {
        tipo_analisis: formData.tipo_analisis ? parseInt(formData.tipo_analisis) : undefined,
        nombre: formData.nombre,
        fecha_analisis: formData.fecha_analisis,
        periodo: formData.periodo,
        responsable: formData.responsable ? parseInt(formData.responsable) : undefined,
        conclusiones: formData.conclusiones || undefined,
      };
      await createMutation.mutateAsync(createData);
    }

    onClose();
  };

  const handleAddFactor = async () => {
    if (!analisis?.id || !factorForm.descripcion.trim()) return;

    const data: CreateFactorPESTELDTO = {
      analisis: analisis.id,
      tipo: factorForm.tipo,
      descripcion: factorForm.descripcion,
      tendencia: factorForm.tendencia,
      impacto: factorForm.impacto,
      probabilidad: factorForm.probabilidad,
      implicaciones: factorForm.implicaciones || undefined,
      fuentes: factorForm.fuentes || undefined,
    };

    await createFactorMutation.mutateAsync(data);
    setFactorForm(defaultFactorForm);
  };

  const handleUpdateFactor = async () => {
    if (!editingFactorId || !factorForm.descripcion.trim()) return;

    const data: UpdateFactorPESTELDTO = {
      tipo: factorForm.tipo,
      descripcion: factorForm.descripcion,
      tendencia: factorForm.tendencia,
      impacto: factorForm.impacto,
      probabilidad: factorForm.probabilidad,
      implicaciones: factorForm.implicaciones || undefined,
      fuentes: factorForm.fuentes || undefined,
    };

    await updateFactorMutation.mutateAsync({ id: editingFactorId, data });
    setEditingFactorId(null);
    setFactorForm(defaultFactorForm);
  };

  const handleEditFactor = (factor: FactorPESTEL) => {
    setEditingFactorId(factor.id);
    setFactorForm({
      tipo: factor.tipo,
      descripcion: factor.descripcion,
      tendencia: factor.tendencia,
      impacto: factor.impacto,
      probabilidad: factor.probabilidad,
      implicaciones: factor.implicaciones || '',
      fuentes: factor.fuentes || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingFactorId(null);
    setFactorForm(defaultFactorForm);
  };

  const handleDeleteFactor = async (factorId: number) => {
    await deleteFactorMutation.mutateAsync(factorId);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Filtrar factores
  const factores = factoresData?.results || [];
  const filteredFactores = filterTipo ? factores.filter((f) => f.tipo === filterTipo) : factores;

  // Agrupar por tipo para estadisticas
  const factoresPorTipo = factores.reduce(
    (acc, f) => {
      acc[f.tipo] = (acc[f.tipo] || 0) + 1;
      return acc;
    },
    {} as Record<TipoFactorPESTEL, number>
  );

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
        disabled={isLoading || !formData.nombre}
        isLoading={isLoading}
      >
        {isEditing ? 'Guardar Cambios' : 'Crear Análisis'}
      </Button>
    </>
  );

  // Renderizar tabs
  const renderTabs = () => (
    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
      {[
        { key: 'datos', label: 'Datos Básicos', disabled: false },
        { key: 'factores', label: `Factores (${factores.length})`, disabled: !isEditing },
      ].map((tab) => (
        <Button
          key={tab.key}
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => !tab.disabled && setActiveTab(tab.key as typeof activeTab)}
          disabled={tab.disabled}
          className={`border-b-2 -mb-px rounded-none !min-h-0 transition-colors ${
            activeTab === tab.key
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : tab.disabled
                ? 'border-transparent text-gray-400 cursor-not-allowed'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );

  // Tab: Datos Basicos
  const renderDatosTab = () => (
    <div className="space-y-6">
      {/* Seccion: Informacion General */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Información General
        </h4>

        <Select
          label="Tipo de Análisis"
          value={formData.tipo_analisis}
          onChange={(e) => setFormData({ ...formData, tipo_analisis: e.target.value })}
          options={[{ value: '', label: 'Seleccionar tipo...' }, ...tipoAnalisisOptions]}
        />

        <Input
          label="Nombre del Análisis *"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          placeholder="Ej: Análisis PESTEL 2026"
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="date"
            label="Fecha de Análisis *"
            value={formData.fecha_analisis}
            onChange={(e) => setFormData({ ...formData, fecha_analisis: e.target.value })}
            required
          />
          <Input
            label="Periodo *"
            value={formData.periodo}
            onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
            placeholder="Ej: 2026, Q1-2026"
            required
          />
        </div>

        <Select
          label="Cargo Responsable"
          value={formData.responsable}
          onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
          options={[{ value: '', label: 'Sin asignar' }, ...cargoOptions]}
        />
      </div>

      {/* Seccion: Conclusiones */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Conclusiones
        </h4>

        <Textarea
          label="Conclusiones del Análisis"
          value={formData.conclusiones}
          onChange={(e) => setFormData({ ...formData, conclusiones: e.target.value })}
          placeholder="Conclusiones generales del análisis PESTEL..."
          rows={5}
        />
      </div>
    </div>
  );

  // Tab: Factores
  const renderFactoresTab = () => (
    <div className="space-y-6">
      {/* Estadisticas por tipo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {TIPO_FACTOR_OPTIONS.map(({ value, label: _label, icon: Icon }) => {
          const config = TIPO_FACTOR_PESTEL_CONFIG[value];
          const count = factoresPorTipo[value] || 0;
          const isActive = filterTipo === value;

          return (
            <Button
              key={value}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFilterTipo(isActive ? '' : value)}
              className={`p-2 rounded-lg border transition-all text-center !min-h-0 flex-col w-full ${
                isActive
                  ? `${config.bgClass} border-2 border-gray-400`
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className={`p-1.5 rounded mx-auto w-fit ${config.bgClass}`}>
                <Icon className={`h-4 w-4 ${config.textClass}`} />
              </div>
              <span className={`text-lg font-bold ${config.textClass} block`}>{count}</span>
              <p className="text-xs text-gray-600 dark:text-gray-400">{config.shortLabel}</p>
            </Button>
          );
        })}
      </div>

      {filterTipo && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Mostrando: {TIPO_FACTOR_PESTEL_CONFIG[filterTipo].label}
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={() => setFilterTipo('')}>
            Ver todos
          </Button>
        </div>
      )}

      {/* Lista de factores */}
      <div className="space-y-2 max-h-56 overflow-y-auto">
        {filteredFactores.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>
              No hay factores{' '}
              {filterTipo ? `de tipo ${TIPO_FACTOR_PESTEL_CONFIG[filterTipo].label}` : ''}
            </p>
          </div>
        ) : (
          filteredFactores.map((factor) => {
            const config = TIPO_FACTOR_PESTEL_CONFIG[factor.tipo];
            const impactoConfig = NIVEL_IMPACTO_CONFIG[factor.impacto];
            const tendenciaConfig = TENDENCIA_FACTOR_CONFIG[factor.tendencia];
            const TendenciaIcon = getTendenciaIcon(factor.tendencia);

            return (
              <div
                key={factor.id}
                className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border-l-4"
                style={{
                  borderColor: config.textClass.includes('purple')
                    ? '#9333ea'
                    : config.textClass.includes('green')
                      ? '#22c55e'
                      : config.textClass.includes('blue')
                        ? '#3b82f6'
                        : config.textClass.includes('cyan')
                          ? '#06b6d4'
                          : config.textClass.includes('emerald')
                            ? '#10b981'
                            : config.textClass.includes('amber')
                              ? '#f59e0b'
                              : '#6b7280',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${config.bgClass} ${config.textClass}`}
                      >
                        {config.label}
                      </span>
                      <Badge variant={impactoConfig.color} size="sm">
                        Impacto: {impactoConfig.label}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <TendenciaIcon className="h-3 w-3" />
                        {tendenciaConfig.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{factor.descripcion}</p>
                    {factor.implicaciones && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        Implicaciones: {factor.implicaciones}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditFactor(factor)}
                      disabled={analisis?.estado !== 'borrador'}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFactor(factor.id)}
                      disabled={analisis?.estado !== 'borrador' || deleteFactorMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Formulario para agregar/editar factor */}
      {analisis?.estado === 'borrador' && (
        <div className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg space-y-4">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {editingFactorId ? 'Editar Factor' : 'Agregar Nuevo Factor'}
          </h5>

          {/* Tipo de factor */}
          <div className="flex flex-wrap gap-2">
            {TIPO_FACTOR_OPTIONS.map(({ value, label, icon: Icon }) => {
              const config = TIPO_FACTOR_PESTEL_CONFIG[value];
              return (
                <Button
                  key={value}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFactorForm({ ...factorForm, tipo: value })}
                  className={`!min-h-0 rounded-lg border transition-colors ${
                    factorForm.tipo === value
                      ? `${config.bgClass} border-2 border-gray-400`
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${factorForm.tipo === value ? config.textClass : ''}`}
                  />
                  <span className={`text-sm ${factorForm.tipo === value ? config.textClass : ''}`}>
                    {label}
                  </span>
                </Button>
              );
            })}
          </div>

          <Textarea
            label="Descripción del Factor *"
            value={factorForm.descripcion}
            onChange={(e) => setFactorForm({ ...factorForm, descripcion: e.target.value })}
            placeholder="Describa el factor externo identificado..."
            rows={2}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Tendencia *"
              value={factorForm.tendencia}
              onChange={(e) =>
                setFactorForm({ ...factorForm, tendencia: e.target.value as TendenciaFactor })
              }
              options={TENDENCIA_OPTIONS}
            />
            <Select
              label="Impacto *"
              value={factorForm.impacto}
              onChange={(e) =>
                setFactorForm({ ...factorForm, impacto: e.target.value as NivelImpacto })
              }
              options={IMPACTO_OPTIONS}
            />
            <Select
              label="Probabilidad *"
              value={factorForm.probabilidad}
              onChange={(e) =>
                setFactorForm({ ...factorForm, probabilidad: e.target.value as NivelImpacto })
              }
              options={IMPACTO_OPTIONS}
            />
          </div>

          <Textarea
            label="Implicaciones"
            value={factorForm.implicaciones}
            onChange={(e) => setFactorForm({ ...factorForm, implicaciones: e.target.value })}
            placeholder="Implicaciones para la organizacion..."
            rows={2}
          />

          <Input
            label="Fuentes"
            value={factorForm.fuentes}
            onChange={(e) => setFactorForm({ ...factorForm, fuentes: e.target.value })}
            placeholder="Fuentes de informacion..."
          />

          <div className="flex gap-2">
            {editingFactorId ? (
              <>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleUpdateFactor}
                  disabled={!factorForm.descripcion.trim() || updateFactorMutation.isPending}
                  isLoading={updateFactorMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddFactor}
                disabled={!factorForm.descripcion.trim() || createFactorMutation.isPending}
                isLoading={createFactorMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Factor
              </Button>
            )}
          </div>
        </div>
      )}

      {analisis?.estado !== 'borrador' && (
        <Alert
          variant="warning"
          message="Los factores solo pueden modificarse mientras el análisis está en estado Borrador."
        />
      )}
    </div>
  );

  // Renderizar contenido segun tab activo
  const renderContent = () => {
    switch (activeTab) {
      case 'datos':
        return renderDatosTab();
      case 'factores':
        return renderFactoresTab();
      default:
        return null;
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Análisis PESTEL' : 'Nuevo Análisis PESTEL'}
      subtitle="Político, Económico, Social, Tecnológico, Ecológico y Legal"
      size="3xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit}>
        {isEditing && renderTabs()}
        {renderContent()}
      </form>
    </BaseModal>
  );
};

export default AnalisisPestelFormModal;
