/**
 * Modal para crear/editar Analisis DOFA
 *
 * Formulario completo para gestion de analisis DOFA:
 * - Tab Datos Basicos: nombre, periodo, responsable, observaciones
 * - Tab Factores: lista CRUD de factores (F/O/D/A)
 *
 * Usa Design System dinamico sin colores hardcoded
 */
import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  AlertCircle,
  Shield,
  Target,
  AlertTriangle,
  TrendingUp,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Alert } from '@/components/common/Alert';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import {
  useTiposAnalisisDofa,
  useCreateAnalisisDofa,
  useUpdateAnalisisDofa,
  useAnalisisDofaDetail,
  useFactoresDofa,
  useCreateFactorDofa,
  useUpdateFactorDofa,
  useDeleteFactorDofa,
} from '../../hooks/useContexto';
import { useAreas } from '../../hooks/useAreas';
import { useSelectCargos } from '@/hooks/useSelectLists';
import type {
  AnalisisDOFA,
  FactorDOFA,
  CreateAnalisisDOFADTO,
  UpdateAnalisisDOFADTO,
  CreateFactorDOFADTO,
  UpdateFactorDOFADTO,
  TipoFactorDOFA,
  NivelImpacto,
} from '../../types/contexto.types';
import { TIPO_FACTOR_DOFA_CONFIG, NIVEL_IMPACTO_CONFIG } from '../../types/contexto.types';

// =============================================================================
// INTERFACES
// =============================================================================

interface AnalisisDofaFormModalProps {
  analisis: AnalisisDOFA | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  tipo_analisis: string;
  nombre: string;
  fecha_analisis: string;
  periodo: string;
  responsable: string;
  observaciones: string;
}

interface FactorForm {
  tipo: TipoFactorDOFA;
  descripcion: string;
  area_afectada: string;
  area: string;
  impacto: NivelImpacto;
  evidencias: string;
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
  observaciones: '',
};

const defaultFactorForm: FactorForm = {
  tipo: 'fortaleza',
  descripcion: '',
  area_afectada: '',
  area: '',
  impacto: 'medio',
  evidencias: '',
};

const TIPO_FACTOR_OPTIONS: { value: TipoFactorDOFA; label: string; icon: React.ElementType }[] = [
  { value: 'fortaleza', label: 'Fortaleza', icon: Shield },
  { value: 'oportunidad', label: 'Oportunidad', icon: TrendingUp },
  { value: 'debilidad', label: 'Debilidad', icon: AlertCircle },
  { value: 'amenaza', label: 'Amenaza', icon: AlertTriangle },
];

const IMPACTO_OPTIONS = Object.entries(NIVEL_IMPACTO_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}));

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const AnalisisDofaFormModal = ({
  analisis,
  isOpen,
  onClose,
}: AnalisisDofaFormModalProps) => {
  const isEditing = analisis !== null;

  // Form state
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [activeTab, setActiveTab] = useState<'datos' | 'factores'>('datos');

  // Factor state
  const [factorForm, setFactorForm] = useState<FactorForm>(defaultFactorForm);
  const [editingFactorId, setEditingFactorId] = useState<number | null>(null);
  const [filterTipo, setFilterTipo] = useState<TipoFactorDOFA | ''>('');

  // Queries
  const { data: tiposAnalisisData } = useTiposAnalisisDofa();
  const { data: analisisDetail } = useAnalisisDofaDetail(analisis?.id);
  const { data: factoresData } = useFactoresDofa(
    analisis?.id ? { analisis: analisis.id } : undefined
  );
  const { data: areasData } = useAreas();
  const { data: cargosData } = useSelectCargos();

  // Mutations
  const createMutation = useCreateAnalisisDofa();
  const updateMutation = useUpdateAnalisisDofa();
  const createFactorMutation = useCreateFactorDofa();
  const updateFactorMutation = useUpdateFactorDofa();
  const deleteFactorMutation = useDeleteFactorDofa();

  // Cargar datos al editar
  useEffect(() => {
    if (isEditing && analisisDetail) {
      setFormData({
        tipo_analisis: analisisDetail.tipo_analisis?.toString() || '',
        nombre: analisisDetail.nombre,
        fecha_analisis: analisisDetail.fecha_analisis.split('T')[0],
        periodo: analisisDetail.periodo,
        responsable: analisisDetail.responsable?.toString() || '',
        observaciones: analisisDetail.observaciones || '',
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
      const updateData: UpdateAnalisisDOFADTO = {
        tipo_analisis: formData.tipo_analisis ? parseInt(formData.tipo_analisis) : undefined,
        nombre: formData.nombre,
        fecha_analisis: formData.fecha_analisis,
        periodo: formData.periodo,
        responsable: formData.responsable ? parseInt(formData.responsable) : undefined,
        observaciones: formData.observaciones || undefined,
      };
      await updateMutation.mutateAsync({ id: analisis.id, data: updateData });
    } else {
      const createData: CreateAnalisisDOFADTO = {
        tipo_analisis: formData.tipo_analisis ? parseInt(formData.tipo_analisis) : undefined,
        nombre: formData.nombre,
        fecha_analisis: formData.fecha_analisis,
        periodo: formData.periodo,
        responsable: formData.responsable ? parseInt(formData.responsable) : undefined,
        observaciones: formData.observaciones || undefined,
      };
      await createMutation.mutateAsync(createData);
    }

    onClose();
  };

  const handleAddFactor = async () => {
    if (!analisis?.id || !factorForm.descripcion.trim()) return;

    const data: CreateFactorDOFADTO = {
      analisis: analisis.id,
      tipo: factorForm.tipo,
      descripcion: factorForm.descripcion,
      area_afectada: factorForm.area_afectada || undefined,
      area: factorForm.area ? parseInt(factorForm.area) : undefined,
      impacto: factorForm.impacto,
      evidencias: factorForm.evidencias || undefined,
    };

    await createFactorMutation.mutateAsync(data);
    setFactorForm(defaultFactorForm);
  };

  const handleUpdateFactor = async () => {
    if (!editingFactorId || !factorForm.descripcion.trim()) return;

    const data: UpdateFactorDOFADTO = {
      tipo: factorForm.tipo,
      descripcion: factorForm.descripcion,
      area_afectada: factorForm.area_afectada || undefined,
      area: factorForm.area ? parseInt(factorForm.area) : undefined,
      impacto: factorForm.impacto,
      evidencias: factorForm.evidencias || undefined,
    };

    await updateFactorMutation.mutateAsync({ id: editingFactorId, data });
    setEditingFactorId(null);
    setFactorForm(defaultFactorForm);
  };

  const handleEditFactor = (factor: FactorDOFA) => {
    setEditingFactorId(factor.id);
    setFactorForm({
      tipo: factor.tipo,
      descripcion: factor.descripcion,
      area_afectada: factor.area_afectada || '',
      area: factor.area?.toString() || '',
      impacto: factor.impacto,
      evidencias: factor.evidencias || '',
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

  // Options - Tipos de Análisis DOFA (catálogo global)
  const tipoAnalisisOptions =
    tiposAnalisisData?.results?.map((t) => ({
      value: t.id.toString(),
      label: t.nombre,
    })) || [];

  // Options - Cargos para responsable del análisis (más estable organizacionalmente)
  const cargoOptions =
    cargosData?.map((c) => ({
      value: c.id.toString(),
      label: c.label,
    })) || [];

  // Options - Areas para factores
  const areaOptions =
    areasData?.results?.map((a) => ({
      value: a.id.toString(),
      label: a.name,
    })) || [];

  // Filtrar factores
  const factores = factoresData?.results || [];
  const filteredFactores = filterTipo ? factores.filter((f) => f.tipo === filterTipo) : factores;

  // Agrupar por tipo para estadisticas
  const factoresPorTipo = factores.reduce(
    (acc, f) => {
      acc[f.tipo] = (acc[f.tipo] || 0) + 1;
      return acc;
    },
    {} as Record<TipoFactorDOFA, number>
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
        {isEditing ? 'Guardar Cambios' : 'Crear Analisis'}
      </Button>
    </>
  );

  // Renderizar tabs
  const renderTabs = () => (
    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
      {[
        { key: 'datos', label: 'Datos Basicos', disabled: false },
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
      {/* Seccion: Tipo de Analisis */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
          <Target className="h-4 w-4" />
          Tipo de Analisis
        </h4>

        <Select
          label="Tipo de Analisis"
          value={formData.tipo_analisis}
          onChange={(e) => setFormData({ ...formData, tipo_analisis: e.target.value })}
          options={[{ value: '', label: 'Seleccionar tipo...' }, ...tipoAnalisisOptions]}
          helperText={
            tipoAnalisisOptions.length === 0
              ? 'Ejecute: python manage.py seed_tipos_analisis_dofa'
              : 'Clasificacion del tipo de analisis DOFA'
          }
        />
      </div>

      {/* Seccion: Informacion General */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Informacion General
        </h4>

        <Input
          label="Nombre del Analisis *"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          placeholder="Ej: Analisis DOFA 2026"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            type="date"
            label="Fecha de Analisis *"
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
      </div>

      {/* Seccion: Responsable */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Responsable
        </h4>

        <Select
          label="Cargo Responsable"
          value={formData.responsable}
          onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
          options={[{ value: '', label: 'Sin asignar' }, ...cargoOptions]}
          helperText={
            cargoOptions.length === 0
              ? 'No hay cargos disponibles. Cree cargos en Configuracion > Cargos'
              : 'Cargo encargado de coordinar el analisis DOFA'
          }
        />
      </div>

      {/* Seccion: Observaciones */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Observaciones
        </h4>

        <Textarea
          label="Observaciones"
          value={formData.observaciones}
          onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
          placeholder="Notas o comentarios adicionales sobre el analisis..."
          rows={4}
        />
      </div>
    </div>
  );

  // Tab: Factores
  const renderFactoresTab = () => (
    <div className="space-y-6">
      {/* Estadisticas por tipo */}
      <div className="grid grid-cols-4 gap-3">
        {TIPO_FACTOR_OPTIONS.map(({ value, label, icon: Icon }) => {
          const config = TIPO_FACTOR_DOFA_CONFIG[value];
          const count = factoresPorTipo[value] || 0;
          const isActive = filterTipo === value;

          return (
            <Button
              key={value}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFilterTipo(isActive ? '' : value)}
              className={`p-3 rounded-lg border transition-all !min-h-0 w-full flex-col items-start ${
                isActive
                  ? `${config.bgClass} ${config.borderClass} border-2`
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`p-1.5 rounded ${config.bgClass}`}>
                  <Icon className={`h-4 w-4 ${config.textClass}`} />
                </div>
                <span className={`text-xl font-bold ${config.textClass}`}>{count}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-left">{label}</p>
            </Button>
          );
        })}
      </div>

      {filterTipo && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Mostrando: {TIPO_FACTOR_DOFA_CONFIG[filterTipo].label}
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={() => setFilterTipo('')}>
            Ver todos
          </Button>
        </div>
      )}

      {/* Lista de factores */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filteredFactores.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>
              No hay factores{' '}
              {filterTipo ? `de tipo ${TIPO_FACTOR_DOFA_CONFIG[filterTipo].label}` : ''}
            </p>
          </div>
        ) : (
          filteredFactores.map((factor) => {
            const config = TIPO_FACTOR_DOFA_CONFIG[factor.tipo];
            const impactoConfig = NIVEL_IMPACTO_CONFIG[factor.impacto];

            return (
              <div
                key={factor.id}
                className={`p-3 rounded-lg border-l-4 bg-gray-50 dark:bg-gray-800 ${config.borderClass}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={config.color as 'success' | 'info' | 'warning' | 'danger'}
                        size="sm"
                      >
                        {config.shortLabel}
                      </Badge>
                      <Badge variant={impactoConfig.color} size="sm">
                        {impactoConfig.label}
                      </Badge>
                      {factor.area_nombre && (
                        <span className="text-xs text-gray-500">{factor.area_nombre}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{factor.descripcion}</p>
                    {factor.evidencias && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        Evidencias: {factor.evidencias}
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
          <div className="flex gap-2">
            {TIPO_FACTOR_OPTIONS.map(({ value, label, icon: Icon }) => {
              const config = TIPO_FACTOR_DOFA_CONFIG[value];
              return (
                <Button
                  key={value}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFactorForm({ ...factorForm, tipo: value })}
                  className={`!min-h-0 rounded-lg border transition-colors ${
                    factorForm.tipo === value
                      ? `${config.bgClass} ${config.borderClass} border-2`
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
            placeholder="Describa el factor identificado..."
            rows={2}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Nivel de Impacto *"
              value={factorForm.impacto}
              onChange={(e) =>
                setFactorForm({ ...factorForm, impacto: e.target.value as NivelImpacto })
              }
              options={IMPACTO_OPTIONS}
            />
            <Select
              label="Area Relacionada"
              value={factorForm.area}
              onChange={(e) => setFactorForm({ ...factorForm, area: e.target.value })}
              options={[{ value: '', label: 'General' }, ...areaOptions]}
            />
          </div>

          <Input
            label="Area Afectada"
            value={factorForm.area_afectada}
            onChange={(e) => setFactorForm({ ...factorForm, area_afectada: e.target.value })}
            placeholder="Ej: Produccion, Comercial, TI..."
          />

          <Textarea
            label="Evidencias"
            value={factorForm.evidencias}
            onChange={(e) => setFactorForm({ ...factorForm, evidencias: e.target.value })}
            placeholder="Evidencias o fuentes que sustentan este factor..."
            rows={2}
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
          message="Los factores solo pueden modificarse mientras el analisis esta en estado Borrador."
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
      title={isEditing ? 'Editar Analisis DOFA' : 'Nuevo Analisis DOFA'}
      subtitle="Debilidades, Oportunidades, Fortalezas y Amenazas"
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

export default AnalisisDofaFormModal;
