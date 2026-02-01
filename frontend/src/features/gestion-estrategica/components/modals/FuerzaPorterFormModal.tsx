/**
 * Modal para crear/editar Fuerzas de Porter
 *
 * Las 5 fuerzas de Porter:
 * - Rivalidad Competitiva
 * - Amenaza de Nuevos Entrantes
 * - Amenaza de Sustitutos
 * - Poder de Proveedores
 * - Poder de Clientes
 *
 * Usa Design System dinamico sin colores hardcoded
 */
import { useState, useEffect } from 'react';
import {
  Swords,
  UserPlus,
  Repeat,
  Truck,
  Users,
  Plus,
  Trash2,
  FileText,
} from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import {
  useCreateFuerzaPorter,
  useUpdateFuerzaPorter,
  useFuerzaPorterDetail,
} from '../../hooks/useContexto';
import type {
  FuerzaPorter,
  CreateFuerzaPorterDTO,
  UpdateFuerzaPorterDTO,
  TipoFuerzaPorter,
  NivelImpacto,
} from '../../types/contexto.types';
import {
  TIPO_FUERZA_PORTER_CONFIG,
  NIVEL_IMPACTO_CONFIG,
} from '../../types/contexto.types';

// =============================================================================
// INTERFACES
// =============================================================================

interface FuerzaPorterFormModalProps {
  fuerza: FuerzaPorter | null;
  isOpen: boolean;
  onClose: () => void;
  defaultPeriodo?: string;
  tipoPreselected?: TipoFuerzaPorter | null;
}

interface FormData {
  tipo: TipoFuerzaPorter;
  nivel: NivelImpacto;
  descripcion: string;
  factores: string[];
  fecha_analisis: string;
  periodo: string;
  implicaciones_estrategicas: string;
}

// =============================================================================
// CONSTANTES
// =============================================================================

const defaultFormData: FormData = {
  tipo: 'rivalidad',
  nivel: 'medio',
  descripcion: '',
  factores: [],
  fecha_analisis: new Date().toISOString().split('T')[0],
  periodo: new Date().getFullYear().toString(),
  implicaciones_estrategicas: '',
};

const TIPO_FUERZA_OPTIONS: { value: TipoFuerzaPorter; label: string; icon: React.ElementType }[] = [
  { value: 'rivalidad', label: 'Rivalidad', icon: Swords },
  { value: 'nuevos_entrantes', label: 'Entrantes', icon: UserPlus },
  { value: 'sustitutos', label: 'Sustitutos', icon: Repeat },
  { value: 'poder_proveedores', label: 'Proveedores', icon: Truck },
  { value: 'poder_clientes', label: 'Clientes', icon: Users },
];

const NIVEL_OPTIONS = Object.entries(NIVEL_IMPACTO_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}));

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const FuerzaPorterFormModal = ({
  fuerza,
  isOpen,
  onClose,
  defaultPeriodo,
  tipoPreselected,
}: FuerzaPorterFormModalProps) => {
  const isEditing = fuerza !== null;

  // Form state
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [newFactor, setNewFactor] = useState('');

  // Queries
  const { data: fuerzaDetail } = useFuerzaPorterDetail(fuerza?.id);

  // Mutations
  const createMutation = useCreateFuerzaPorter();
  const updateMutation = useUpdateFuerzaPorter();

  // Cargar datos al editar o preseleccionar tipo desde Radar
  useEffect(() => {
    if (isEditing && fuerzaDetail) {
      setFormData({
        tipo: fuerzaDetail.tipo,
        nivel: fuerzaDetail.nivel,
        descripcion: fuerzaDetail.descripcion || '',
        factores: fuerzaDetail.factores || [],
        fecha_analisis: fuerzaDetail.fecha_analisis.split('T')[0],
        periodo: fuerzaDetail.periodo,
        implicaciones_estrategicas: fuerzaDetail.implicaciones_estrategicas || '',
      });
    } else if (!isEditing && isOpen) {
      // Usar valores preseleccionados si vienen del Radar Chart
      setFormData({
        ...defaultFormData,
        tipo: tipoPreselected || defaultFormData.tipo,
        periodo: defaultPeriodo || defaultFormData.periodo,
      });
    }
  }, [fuerzaDetail, isEditing, isOpen, defaultPeriodo, tipoPreselected]);

  // Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && fuerza) {
      const updateData: UpdateFuerzaPorterDTO = {
        tipo: formData.tipo,
        nivel: formData.nivel,
        descripcion: formData.descripcion,
        factores: formData.factores,
        fecha_analisis: formData.fecha_analisis,
        periodo: formData.periodo,
        implicaciones_estrategicas: formData.implicaciones_estrategicas || undefined,
      };
      await updateMutation.mutateAsync({ id: fuerza.id, data: updateData });
    } else {
      const createData: CreateFuerzaPorterDTO = {
        tipo: formData.tipo,
        nivel: formData.nivel,
        descripcion: formData.descripcion,
        factores: formData.factores,
        fecha_analisis: formData.fecha_analisis,
        periodo: formData.periodo,
        implicaciones_estrategicas: formData.implicaciones_estrategicas || undefined,
      };
      await createMutation.mutateAsync(createData);
    }

    onClose();
  };

  const handleAddFactor = () => {
    if (newFactor.trim()) {
      setFormData({
        ...formData,
        factores: [...formData.factores, newFactor.trim()],
      });
      setNewFactor('');
    }
  };

  const handleRemoveFactor = (index: number) => {
    setFormData({
      ...formData,
      factores: formData.factores.filter((_, i) => i !== index),
    });
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const selectedTipoConfig = TIPO_FUERZA_PORTER_CONFIG[formData.tipo];
  const selectedNivelConfig = NIVEL_IMPACTO_CONFIG[formData.nivel];

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
        disabled={isLoading || !formData.descripcion}
        isLoading={isLoading}
      >
        {isEditing ? 'Guardar Cambios' : 'Crear Fuerza'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Fuerza de Porter' : 'Nueva Fuerza de Porter'}
      subtitle={selectedTipoConfig.description}
      size="2xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de Fuerza */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Tipo de Fuerza
          </h4>

          <div className="grid grid-cols-5 gap-2">
            {TIPO_FUERZA_OPTIONS.map(({ value, label, icon: Icon }) => {
              const config = TIPO_FUERZA_PORTER_CONFIG[value];
              const isSelected = formData.tipo === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo: value })}
                  className={`p-3 rounded-lg border transition-all text-center ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-2 ring-purple-500'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg mx-auto w-fit ${isSelected ? 'bg-purple-100 dark:bg-purple-900/40' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500'}`} />
                  </div>
                  <p className={`text-xs mt-2 font-medium ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-400'}`}>
                    {label}
                  </p>
                </button>
              );
            })}
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            {selectedTipoConfig.description}
          </p>
        </div>

        {/* Nivel de la Fuerza */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Nivel de Intensidad
          </h4>

          <div className="flex gap-4">
            {NIVEL_OPTIONS.map(({ value, label }) => {
              const config = NIVEL_IMPACTO_CONFIG[value as NivelImpacto];
              const isSelected = formData.nivel === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, nivel: value as NivelImpacto })}
                  className={`flex-1 p-3 rounded-lg border transition-all ${
                    isSelected
                      ? `${config.bgClass} border-2`
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Badge variant={config.color} size="sm" className="mb-1">
                    {label}
                  </Badge>
                  <p className={`text-xs ${isSelected ? config.textClass : 'text-gray-500'}`}>
                    {value === 'alto' && 'Fuerte presion competitiva'}
                    {value === 'medio' && 'Presion moderada'}
                    {value === 'bajo' && 'Baja presion'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Informacion del Analisis */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Informacion del Analisis
          </h4>

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

          <Textarea
            label="Descripcion *"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            placeholder={`Describa el estado actual de ${selectedTipoConfig.label.toLowerCase()}...`}
            rows={3}
            required
          />
        </div>

        {/* Factores */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Factores Clave ({formData.factores.length})
          </h4>

          {/* Lista de factores */}
          {formData.factores.length > 0 && (
            <div className="space-y-2">
              {formData.factores.map((factor, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {index + 1}. {factor}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFactor(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Agregar nuevo factor */}
          <div className="flex gap-2">
            <Input
              value={newFactor}
              onChange={(e) => setNewFactor(e.target.value)}
              placeholder="Agregar factor clave..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFactor())}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddFactor}
              disabled={!newFactor.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Implicaciones Estrategicas */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Implicaciones Estrategicas
          </h4>

          <Textarea
            label="Implicaciones"
            value={formData.implicaciones_estrategicas}
            onChange={(e) =>
              setFormData({ ...formData, implicaciones_estrategicas: e.target.value })
            }
            placeholder="Que implica este nivel de fuerza para la estrategia de la organizacion..."
            rows={3}
          />
        </div>
      </form>
    </BaseModal>
  );
};

export default FuerzaPorterFormModal;
