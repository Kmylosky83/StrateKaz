/**
 * Widget para Vincular Valores Corporativos a Acciones
 * =====================================================
 *
 * Componente reutilizable para conectar valores corporativos
 * a cualquier acción del sistema (proyectos, acciones correctivas, etc.)
 *
 * Uso:
 * ```tsx
 * <ValorVinculadorWidget
 *   contentType="planeacion.proyecto"
 *   objectId={proyecto.id}
 *   categoriaAccion="PROYECTO"
 *   onVinculoCreado={() => refetch()}
 * />
 * ```
 */
import { useState } from 'react';
import {
  Heart,
  Plus,
  X,
  Check,
  AlertCircle,
  Star,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, Badge, Button, Alert } from '@/components/common';
import { Textarea } from '@/components/forms';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { useValues } from '../hooks/useStrategic';
import {
  useValoresPorAccion,
  useVincularValor,
  useVincularMultiplesValores,
  useDeleteValorVivido,
  TIPOS_VINCULO_OPTIONS,
  NIVELES_IMPACTO_OPTIONS,
  type CategoriaAccion,
  type TipoVinculo,
  type NivelImpacto,
  type ValorVivido,
} from '../hooks/useValoresVividos';
import type { CorporateValue } from '../types/strategic.types';

// =============================================================================
// TIPOS
// =============================================================================

interface ValorVinculadorWidgetProps {
  /** Content type del objeto (ej: 'planeacion.proyecto') */
  contentType: string;
  /** ID del objeto a vincular */
  objectId: number;
  /** Categoría de la acción */
  categoriaAccion: CategoriaAccion;
  /** ID de la identidad corporativa (opcional, se obtiene automáticamente) */
  identityId?: number;
  /** Callback cuando se crea un vínculo */
  onVinculoCreado?: () => void;
  /** Callback cuando se elimina un vínculo */
  onVinculoEliminado?: () => void;
  /** Modo compacto (solo badges) */
  compact?: boolean;
  /** Mostrar solo lectura (sin opciones de edición) */
  readOnly?: boolean;
  /** Título personalizado */
  titulo?: string;
}

// =============================================================================
// COMPONENTE DE SELECCIÓN DE VALOR
// =============================================================================

interface ValorSelectorProps {
  valores: CorporateValue[];
  valoresVinculados: number[];
  onSelect: (valorId: number) => void;
  isLoading?: boolean;
}

const ValorSelector = ({ valores, valoresVinculados, onSelect, isLoading }: ValorSelectorProps) => {
  const disponibles = valores.filter((v) => !valoresVinculados.includes(v.id));

  if (disponibles.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
        <Check className="w-6 h-6 mx-auto mb-2 text-green-500" />
        <p className="text-sm">Todos los valores están vinculados</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {disponibles.map((valor) => (
        <Button
          key={valor.id}
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onSelect(valor.id)}
          disabled={isLoading}
          className="!p-3 !min-h-0 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200 flex flex-col items-center gap-2"
        >
          {valor.icon ? (
            <DynamicIcon name={valor.icon} className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          ) : (
            <Heart className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
            {valor.name}
          </span>
        </Button>
      ))}
    </div>
  );
};

// =============================================================================
// FORMULARIO DE VINCULACIÓN
// =============================================================================

interface VinculoFormProps {
  valor: CorporateValue;
  onSubmit: (data: {
    tipo_vinculo: TipoVinculo;
    impacto: NivelImpacto;
    justificacion: string;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const VinculoForm = ({ valor, onSubmit, onCancel, isLoading }: VinculoFormProps) => {
  const [tipoVinculo, setTipoVinculo] = useState<TipoVinculo>('REFLEJA');
  const [impacto, setImpacto] = useState<NivelImpacto>('MEDIO');
  const [justificacion, setJustificacion] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!justificacion.trim()) {
      setError('La justificación es requerida');
      return;
    }
    onSubmit({ tipo_vinculo: tipoVinculo, impacto, justificacion });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        {valor.icon ? (
          <DynamicIcon name={valor.icon} className="w-8 h-8 text-primary-600" />
        ) : (
          <Heart className="w-8 h-8 text-primary-600" />
        )}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">{valor.name}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">{valor.description}</p>
        </div>
      </div>

      {/* Tipo de vínculo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tipo de Vínculo
        </label>
        <div className="grid grid-cols-2 gap-2">
          {TIPOS_VINCULO_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setTipoVinculo(option.value)}
              className={`
                p-2 rounded-lg border text-left transition-all !min-h-0 flex-col items-start h-auto
                ${
                  tipoVinculo === option.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }
              `}
            >
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {option.label}
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">{option.description}</p>
            </Button>
          ))}
        </div>
      </div>

      {/* Nivel de impacto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nivel de Impacto
        </label>
        <div className="flex gap-2">
          {NIVELES_IMPACTO_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setImpacto(option.value)}
              className={`
                flex-1 rounded-lg border text-center transition-all !min-h-0
                ${
                  impacto === option.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }
              `}
            >
              <span className={`text-sm font-medium ${option.color}`}>{option.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Justificación */}
      <div>
        <Textarea
          label="Justificación *"
          value={justificacion}
          onChange={(e) => {
            setJustificacion(e.target.value);
            setError(null);
          }}
          placeholder="Explique cómo esta acción refleja o promueve el valor corporativo..."
          rows={3}
          error={error || undefined}
        />
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" size="sm" onClick={onCancel} type="button">
          Cancelar
        </Button>
        <Button variant="primary" size="sm" type="submit" isLoading={isLoading}>
          <Check className="w-4 h-4 mr-1" />
          Vincular
        </Button>
      </div>
    </form>
  );
};

// =============================================================================
// BADGE DE VALOR VINCULADO
// =============================================================================

interface ValorVinculadoBadgeProps {
  vinculo: ValorVivido;
  onRemove?: () => void;
  readOnly?: boolean;
}

const ValorVinculadoBadge = ({ vinculo, onRemove, readOnly }: ValorVinculadoBadgeProps) => {
  const impactoColor = {
    BAJO: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    MEDIO: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    ALTO: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    MUY_ALTO: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  };

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full
        ${impactoColor[vinculo.impacto]}
        transition-all
      `}
    >
      {vinculo.valor_icon ? (
        <DynamicIcon name={vinculo.valor_icon} className="w-4 h-4" />
      ) : (
        <Heart className="w-4 h-4" />
      )}
      <span className="text-sm font-medium">{vinculo.valor_nombre}</span>
      <span className="text-xs opacity-70">({vinculo.impacto_display})</span>
      {!readOnly && onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="ml-1 !p-0.5 !min-h-0 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
          title="Eliminar vínculo"
        >
          <X className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const ValorVinculadorWidget = ({
  contentType,
  objectId,
  categoriaAccion,
  identityId,
  onVinculoCreado,
  onVinculoEliminado,
  compact = false,
  readOnly = false,
  titulo = 'Valores Corporativos',
}: ValorVinculadorWidgetProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [valorSeleccionado, setValorSeleccionado] = useState<CorporateValue | null>(null);

  // Obtener valores disponibles
  const { data: valoresData } = useValues(identityId || 0);
  const valores = Array.isArray(valoresData) ? valoresData : [];

  // Obtener valores ya vinculados
  const { data: vinculosData, refetch: refetchVinculos } = useValoresPorAccion(
    contentType,
    objectId
  );
  const vinculos = vinculosData?.valores || [];
  const valoresVinculados = vinculos.map((v) => v.valor);

  // Mutations
  const vincularMutation = useVincularValor();
  const eliminarMutation = useDeleteValorVivido();

  const handleVincular = async (data: {
    tipo_vinculo: TipoVinculo;
    impacto: NivelImpacto;
    justificacion: string;
  }) => {
    if (!valorSeleccionado) return;

    try {
      await vincularMutation.mutateAsync({
        valor_id: valorSeleccionado.id,
        content_type: contentType,
        object_id: objectId,
        categoria_accion: categoriaAccion,
        ...data,
      });
      setValorSeleccionado(null);
      refetchVinculos();
      onVinculoCreado?.();
    } catch (error) {
      console.error('Error al vincular valor:', error);
    }
  };

  const handleEliminar = async (vinculoId: number) => {
    if (!window.confirm('¿Está seguro de eliminar este vínculo?')) return;

    try {
      await eliminarMutation.mutateAsync(vinculoId);
      refetchVinculos();
      onVinculoEliminado?.();
    } catch (error) {
      console.error('Error al eliminar vínculo:', error);
    }
  };

  // Modo compacto - solo badges
  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {vinculos.map((vinculo) => (
          <ValorVinculadoBadge
            key={vinculo.id}
            vinculo={vinculo}
            onRemove={readOnly ? undefined : () => handleEliminar(vinculo.id)}
            readOnly={readOnly}
          />
        ))}
        {!readOnly && vinculos.length < valores.length && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="!min-h-0 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-primary-500 hover:text-primary-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Agregar</span>
          </Button>
        )}
      </div>
    );
  }

  // Modo expandido - card completa
  return (
    <Card>
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
            <Heart className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{titulo}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {vinculos.length} valor{vinculos.length !== 1 ? 'es' : ''} vinculado
              {vinculos.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {vinculos.length > 0 && (
            <div className="flex -space-x-2">
              {vinculos.slice(0, 3).map((v) => (
                <div
                  key={v.id}
                  className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center border-2 border-white dark:border-gray-800"
                  title={v.valor_nombre}
                >
                  {v.valor_icon ? (
                    <DynamicIcon name={v.valor_icon} className="w-4 h-4 text-primary-600" />
                  ) : (
                    <Heart className="w-4 h-4 text-primary-600" />
                  )}
                </div>
              ))}
              {vinculos.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-white dark:border-gray-800">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    +{vinculos.length - 3}
                  </span>
                </div>
              )}
            </div>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Contenido expandido */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {/* Valores vinculados */}
          {vinculos.length > 0 && (
            <div className="p-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Valores Vinculados
              </h4>
              <div className="flex flex-wrap gap-2">
                {vinculos.map((vinculo) => (
                  <ValorVinculadoBadge
                    key={vinculo.id}
                    vinculo={vinculo}
                    onRemove={readOnly ? undefined : () => handleEliminar(vinculo.id)}
                    readOnly={readOnly}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Formulario de vinculación */}
          {!readOnly && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              {valorSeleccionado ? (
                <VinculoForm
                  valor={valorSeleccionado}
                  onSubmit={handleVincular}
                  onCancel={() => setValorSeleccionado(null)}
                  isLoading={vincularMutation.isPending}
                />
              ) : (
                <>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Agregar Valor
                  </h4>
                  <ValorSelector
                    valores={valores}
                    valoresVinculados={valoresVinculados}
                    onSelect={(valorId) => {
                      const valor = valores.find((v) => v.id === valorId);
                      if (valor) setValorSeleccionado(valor);
                    }}
                    isLoading={vincularMutation.isPending}
                  />
                </>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default ValorVinculadorWidget;
