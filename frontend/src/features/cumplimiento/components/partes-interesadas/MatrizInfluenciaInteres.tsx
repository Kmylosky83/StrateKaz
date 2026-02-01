/**
 * Matriz de Influencia e Interés (3x3)
 *
 * Visualización matricial de partes interesadas según:
 * - Eje Y: Nivel de Influencia (Alta, Media, Baja)
 * - Eje X: Nivel de Interés (Alto, Medio, Bajo)
 *
 * Estrategias de gestión por cuadrante:
 * - Alta Influencia + Alto Interés: GESTIONAR DE CERCA
 * - Alta Influencia + Bajo Interés: MANTENER SATISFECHO
 * - Baja Influencia + Alto Interés: MANTENER INFORMADO
 * - Baja Influencia + Bajo Interés: MONITOREAR
 */
import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { Alert } from '@/components/common/Alert';
import { EmptyState } from '@/components/common/EmptyState';
import { Grid3x3, TrendingUp, Target, AlertCircle } from 'lucide-react';
import { useMatrizInfluenciaInteres } from '../../hooks/usePartesInteresadas';
import type { ParteInteresada } from '../../types';

interface CuadranteData {
  partes: ParteInteresada[];
  estrategia: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const MatrizInfluenciaInteres = () => {
  const { user } = useAuthStore();
  const empresaId = user?.empresa_id || 0;

  const { data: matrizData, isLoading, error } = useMatrizInfluenciaInteres(empresaId);

  const [selectedParte, setSelectedParte] = useState<ParteInteresada | null>(null);

  // Configuración de cuadrantes
  const getCuadranteConfig = (
    influencia: 'alta' | 'media' | 'baja',
    interes: 'alto' | 'medio' | 'bajo'
  ): Omit<CuadranteData, 'partes'> => {
    const key = `${influencia}_${interes}`;

    const configs: Record<string, Omit<CuadranteData, 'partes'>> = {
      // Fila superior: Alta Influencia
      alta_alto: {
        estrategia: 'GESTIONAR DE CERCA',
        color: 'text-red-700 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-300 dark:border-red-700',
      },
      alta_medio: {
        estrategia: 'MANTENER SATISFECHO',
        color: 'text-orange-700 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-300 dark:border-orange-700',
      },
      alta_bajo: {
        estrategia: 'MANTENER SATISFECHO',
        color: 'text-orange-700 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-300 dark:border-orange-700',
      },

      // Fila media: Media Influencia
      media_alto: {
        estrategia: 'MANTENER INFORMADO',
        color: 'text-yellow-700 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-300 dark:border-yellow-700',
      },
      media_medio: {
        estrategia: 'SEGUIMIENTO REGULAR',
        color: 'text-blue-700 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-300 dark:border-blue-700',
      },
      media_bajo: {
        estrategia: 'MONITOREAR',
        color: 'text-gray-700 dark:text-gray-400',
        bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        borderColor: 'border-gray-300 dark:border-gray-700',
      },

      // Fila inferior: Baja Influencia
      baja_alto: {
        estrategia: 'MANTENER INFORMADO',
        color: 'text-green-700 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-300 dark:border-green-700',
      },
      baja_medio: {
        estrategia: 'MONITOREAR',
        color: 'text-gray-700 dark:text-gray-400',
        bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        borderColor: 'border-gray-300 dark:border-gray-700',
      },
      baja_bajo: {
        estrategia: 'MONITOREAR',
        color: 'text-gray-700 dark:text-gray-400',
        bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        borderColor: 'border-gray-300 dark:border-gray-700',
      },
    };

    return configs[key] || configs.baja_bajo;
  };

  // Renderizar celda de cuadrante
  const renderCuadrante = (
    influencia: 'alta' | 'media' | 'baja',
    interes: 'alto' | 'medio' | 'bajo'
  ) => {
    const key = `${influencia}_${interes}` as keyof typeof matrizData;
    const partes = matrizData?.[key] || [];
    const config = getCuadranteConfig(influencia, interes);

    return (
      <div
        className={`
          p-4 rounded-lg border-2 min-h-[180px]
          ${config.bgColor} ${config.borderColor}
          hover:shadow-md transition-shadow
        `}
      >
        {/* Header */}
        <div className="mb-3">
          <h4 className={`text-xs font-bold uppercase ${config.color}`}>
            {config.estrategia}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="gray" size="sm">
              {partes.length} {partes.length === 1 ? 'parte' : 'partes'}
            </Badge>
          </div>
        </div>

        {/* Lista de partes */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {partes.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Sin partes en este cuadrante</p>
          ) : (
            partes.map((parte) => (
              <button
                key={parte.id}
                onClick={() => setSelectedParte(parte)}
                className="w-full text-left p-2 rounded-md bg-white dark:bg-gray-800
                         hover:bg-gray-50 dark:hover:bg-gray-700
                         border border-gray-200 dark:border-gray-700
                         transition-colors"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {parte.nombre}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {parte.tipo_nombre}
                </p>
              </button>
            ))
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center p-12">
          <Spinner size="lg" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Alert
          variant="danger"
          icon={<AlertCircle className="h-5 w-5" />}
          message="Error al cargar la matriz de influencia/interés"
        />
      </Card>
    );
  }

  if (!matrizData) {
    return (
      <Card>
        <EmptyState
          icon={<Grid3x3 className="h-12 w-12" />}
          title="No hay datos disponibles"
          description="No se encontraron partes interesadas para mostrar en la matriz."
        />
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className="space-y-6">
          {/* Leyenda */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Estrategias de Gestión
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-blue-800 dark:text-blue-200">
              <div className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <div>
                  <span className="font-semibold">Gestionar de Cerca:</span> Comunicación frecuente y participación activa
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <div>
                  <span className="font-semibold">Mantener Satisfecho:</span> Satisfacer necesidades sin exceso de comunicación
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <div>
                  <span className="font-semibold">Mantener Informado:</span> Comunicación regular sobre temas relevantes
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <div>
                  <span className="font-semibold">Monitorear:</span> Seguimiento mínimo, comunicación básica
                </div>
              </div>
            </div>
          </div>

          {/* Matriz 3x3 */}
          <div className="relative">
            {/* Etiquetas de ejes */}
            <div className="absolute -left-24 top-1/2 -translate-y-1/2 -rotate-90">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <TrendingUp className="h-4 w-4" />
                <span>NIVEL DE INFLUENCIA</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <Target className="h-4 w-4" />
              <span>NIVEL DE INTERÉS</span>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 gap-4 ml-8">
              {/* Fila 1: Alta Influencia */}
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center col-span-3 mb-2">
                <span className="w-20 -ml-24">ALTA</span>
              </div>
              {renderCuadrante('alta', 'alto')}
              {renderCuadrante('alta', 'medio')}
              {renderCuadrante('alta', 'bajo')}

              {/* Fila 2: Media Influencia */}
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center col-span-3 mb-2">
                <span className="w-20 -ml-24">MEDIA</span>
              </div>
              {renderCuadrante('media', 'alto')}
              {renderCuadrante('media', 'medio')}
              {renderCuadrante('media', 'bajo')}

              {/* Fila 3: Baja Influencia */}
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center col-span-3 mb-2">
                <span className="w-20 -ml-24">BAJA</span>
              </div>
              {renderCuadrante('baja', 'alto')}
              {renderCuadrante('baja', 'medio')}
              {renderCuadrante('baja', 'bajo')}

              {/* Etiquetas columnas */}
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 text-center mt-2">
                ALTO
              </div>
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 text-center mt-2">
                MEDIO
              </div>
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 text-center mt-2">
                BAJO
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal de detalle de parte interesada (simple) */}
      {selectedParte && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedParte(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {selectedParte.nombre}
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedParte.tipo_nombre}
                </p>
              </div>

              {selectedParte.descripcion && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Descripción:</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {selectedParte.descripcion}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Influencia:</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {selectedParte.nivel_influencia_display}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Interés:</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {selectedParte.nivel_interes_display}
                  </p>
                </div>
              </div>

              {selectedParte.representante && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Representante:</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {selectedParte.representante}
                    {selectedParte.cargo_representante && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {' '}
                        - {selectedParte.cargo_representante}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {(selectedParte.email || selectedParte.telefono) && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Contacto:</span>
                  <div className="space-y-1">
                    {selectedParte.email && (
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {selectedParte.email}
                      </p>
                    )}
                    {selectedParte.telefono && (
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {selectedParte.telefono}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedParte(null)}
              className="mt-6 w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
