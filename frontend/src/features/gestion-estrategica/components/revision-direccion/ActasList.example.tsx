/**
 * EJEMPLO DE INTEGRACIÓN DEL BOTÓN DE EXPORTACIÓN
 *
 * Este archivo muestra cómo integrar el botón de exportación de actas
 * en diferentes contextos (listado y detalle)
 */

import { useState } from 'react';
import { ExportActaButton, ExportActaButtonCompact, ExportActaButtonWithMenu } from './ExportActaButton';
import type { ActaRevisionExpandida } from '../../types/revision-direccion.types';

// =============================================================================
// EJEMPLO 1: Listado de Actas con botón compacto
// =============================================================================

export function ActasListExample() {
  // Supongamos que tenemos un listado de actas desde la API
  const [actas, setActas] = useState<ActaRevisionExpandida[]>([]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">
          Actas de Revisión por la Dirección
        </h2>
      </div>

      {/* Tabla de actas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Número Acta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Período
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {actas.map((acta) => (
              <tr key={acta.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                  {acta.numero_acta}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {new Date(acta.fecha).toLocaleDateString('es-CO')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {acta.programa_periodo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {acta.evaluacion_sistema}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button className="text-blue-600 hover:text-blue-900">Ver</button>
                    <button className="text-slate-600 hover:text-slate-900">Editar</button>

                    {/* Botón compacto para exportar */}
                    <ExportActaButtonCompact
                      acta={acta}
                      onExportSuccess={() => {
                        console.log('Acta exportada exitosamente');
                      }}
                      onExportError={(error) => {
                        console.error('Error al exportar:', error);
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =============================================================================
// EJEMPLO 2: Detalle de Acta con botón completo
// =============================================================================

export function ActaDetailExample() {
  const [acta, setActa] = useState<ActaRevisionExpandida | null>(null);

  if (!acta) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Acta {acta.numero_acta}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {acta.programa_periodo} - {new Date(acta.fecha).toLocaleDateString('es-CO')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Botón estándar con preview */}
            <ExportActaButton
              acta={acta}
              variant="primary"
              size="md"
              showPreview={true}
              onExportSuccess={() => {
                console.log('Acta exportada exitosamente');
              }}
              onExportError={(error) => {
                console.error('Error al exportar:', error);
              }}
            />
          </div>
        </div>
      </div>

      {/* Contenido del acta */}
      <div className="bg-white rounded-lg shadow px-6 py-4">
        <h3 className="text-lg font-semibold mb-4">Información General</h3>
        {/* ... resto del contenido ... */}
      </div>
    </div>
  );
}

// =============================================================================
// EJEMPLO 3: Sección de acciones con menú de exportación
// =============================================================================

export function ActaActionsExample() {
  const [acta, setActa] = useState<ActaRevisionExpandida | null>(null);

  if (!acta) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow px-6 py-4">
      <h3 className="text-lg font-semibold mb-4">Acciones</h3>

      <div className="flex flex-wrap gap-3">
        {/* Botón con menú de opciones */}
        <ExportActaButtonWithMenu
          acta={acta}
          onExportSuccess={() => {
            console.log('PDF generado');
          }}
          onExportError={(error) => {
            console.error('Error:', error);
          }}
        />

        <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
          Enviar por Email
        </button>

        <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
          Duplicar
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// EJEMPLO 4: Integración con Hook personalizado
// =============================================================================

/**
 * Hook personalizado para manejar la carga y exportación de actas
 */
function useActaExport(actaId: number) {
  const [acta, setActa] = useState<ActaRevisionExpandida | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadActa = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Aquí haríamos la llamada a la API para obtener el acta completa
      // con todos los datos expandidos necesarios para el PDF
      const response = await fetch(`/api/gestion-estrategica/revision-direccion/actas/${actaId}/expandida/`);

      if (!response.ok) {
        throw new Error('Error al cargar el acta');
      }

      const data = await response.json();
      setActa(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    acta,
    isLoading,
    error,
    loadActa,
  };
}

export function ActaExportWithHookExample({ actaId }: { actaId: number }) {
  const { acta, isLoading, error, loadActa } = useActaExport(actaId);

  // Cargar acta al montar el componente
  useState(() => {
    loadActa();
  });

  if (isLoading) {
    return <div>Cargando acta...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!acta) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Exportar Acta {acta.numero_acta}</h2>

      {/* Botón de exportación */}
      <ExportActaButton
        acta={acta}
        variant="primary"
        showPreview={true}
        onExportSuccess={() => {
          console.log('Acta exportada con éxito');
          // Aquí podrías registrar la exportación en analytics, etc.
        }}
        onExportError={(error) => {
          console.error('Error al exportar:', error);
          // Aquí podrías registrar el error en un servicio de monitoreo
        }}
      />
    </div>
  );
}

// =============================================================================
// EJEMPLO 5: Personalización avanzada
// =============================================================================

export function ActaCustomExportExample() {
  const [acta, setActa] = useState<ActaRevisionExpandida | null>(null);

  if (!acta) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Exportación completa */}
      <div className="p-4 border border-slate-200 rounded-lg">
        <h4 className="font-semibold mb-2">Acta Completa</h4>
        <p className="text-sm text-slate-600 mb-4">
          Incluye todas las secciones del acta
        </p>
        <ExportActaButton
          acta={acta}
          variant="primary"
          includeParticipants={true}
          includeAnalysis={true}
          includeCommitments={true}
          includeSignatures={true}
        />
      </div>

      {/* Solo compromisos */}
      <div className="p-4 border border-slate-200 rounded-lg">
        <h4 className="font-semibold mb-2">Solo Compromisos</h4>
        <p className="text-sm text-slate-600 mb-4">
          Tabla de compromisos para seguimiento
        </p>
        <ExportActaButton
          acta={acta}
          variant="secondary"
          includeParticipants={false}
          includeAnalysis={false}
          includeCommitments={true}
          includeSignatures={false}
        />
      </div>

      {/* Resumen ejecutivo */}
      <div className="p-4 border border-slate-200 rounded-lg">
        <h4 className="font-semibold mb-2">Resumen Ejecutivo</h4>
        <p className="text-sm text-slate-600 mb-4">
          Sin análisis detallado de temas
        </p>
        <ExportActaButton
          acta={acta}
          variant="outline"
          includeParticipants={true}
          includeAnalysis={false}
          includeCommitments={true}
          includeSignatures={true}
        />
      </div>

      {/* Para firmas */}
      <div className="p-4 border border-slate-200 rounded-lg">
        <h4 className="font-semibold mb-2">Para Firmas</h4>
        <p className="text-sm text-slate-600 mb-4">
          Acta lista para revisión y firma
        </p>
        <ExportActaButton
          acta={acta}
          variant="primary"
          size="lg"
          showPreview={true}
          includeParticipants={true}
          includeAnalysis={true}
          includeCommitments={true}
          includeSignatures={true}
        />
      </div>
    </div>
  );
}
