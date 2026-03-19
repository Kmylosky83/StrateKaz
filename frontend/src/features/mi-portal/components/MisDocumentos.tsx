/**
 * MisDocumentos - Tab de documentos / Hoja de Vida del colaborador
 *
 * Permite al colaborador:
 * - Ver su hoja de vida (nivel de estudio, certificaciones, experiencia)
 * - Ver si tiene CV y certificados subidos
 * - Consultar su información académica
 *
 * Conectado al endpoint: GET /mi-equipo/empleados/hojas-vida/por-colaborador/{id}/
 */

import {
  FolderOpen,
  GraduationCap,
  Award,
  Briefcase,
  Languages,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Card, EmptyState } from '@/components/common';
import { useMisDocumentos, useMiPerfil } from '../api/miPortalApi';

export function MisDocumentos() {
  const { data: perfil, isLoading: perfilLoading } = useMiPerfil();
  const colaboradorId = perfil?.id;
  const { data: hojaVida, isLoading, error } = useMisDocumentos(colaboradorId);

  if (perfilLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Cargando documentos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <EmptyState
          icon={<XCircle className="w-12 h-12 text-red-400" />}
          title="Error al cargar documentos"
          description="No se pudieron cargar tus documentos. Intenta recargar la página."
        />
      </Card>
    );
  }

  if (!hojaVida) {
    return (
      <Card className="p-6">
        <EmptyState
          icon={<FolderOpen className="w-12 h-12" />}
          title="Sin hoja de vida"
          description="Tu hoja de vida aún no ha sido creada. Contacta a Recursos Humanos para más información."
        />
      </Card>
    );
  }

  const NIVEL_ESTUDIO_LABELS: Record<string, string> = {
    primaria: 'Primaria',
    bachillerato: 'Bachillerato',
    tecnico: 'Técnico',
    tecnologo: 'Tecnólogo',
    profesional: 'Profesional',
    especializacion: 'Especialización',
    maestria: 'Maestría',
    doctorado: 'Doctorado',
  };

  const certificacionesCount = hojaVida.certificaciones?.length || 0;
  const experienciaCount = hojaVida.experiencia_previa?.length || 0;
  const idiomasCount = hojaVida.idiomas?.length || 0;

  return (
    <div className="space-y-6">
      {/* Resumen en cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Nivel de estudio</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {NIVEL_ESTUDIO_LABELS[hojaVida.nivel_estudio_maximo] || 'Sin registrar'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Certificaciones</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {certificacionesCount}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Briefcase className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Experiencia previa</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {experienciaCount}{' '}
                <span className="text-xs font-normal text-gray-500">registros</span>
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Languages className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Idiomas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{idiomasCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Información académica */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <GraduationCap className="w-4 h-4" />
          Información Académica
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Título académico:</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {hojaVida.titulo_academico || 'Sin registrar'}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Institución:</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {hojaVida.institucion || 'Sin registrar'}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Año de graduación:</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {hojaVida.anio_graduacion || 'Sin registrar'}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Años de experiencia:</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {Number(hojaVida.total_anios_experiencia || 0).toFixed(1)} años
            </p>
          </div>
        </div>
      </Card>

      {/* Documentos subidos */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Documentos
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm text-gray-700 dark:text-gray-300">Hoja de vida (CV)</span>
            {hojaVida.cv_documento ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <a
                  href={hojaVida.cv_documento}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Ver documento
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-400">
                <XCircle className="w-4 h-4" />
                <span className="text-xs">No subido</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Certificados de estudio
            </span>
            {hojaVida.certificados_estudios ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <a
                  href={hojaVida.certificados_estudios}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Ver documento
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-400">
                <XCircle className="w-4 h-4" />
                <span className="text-xs">No subido</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">Formación completa</span>
            {hojaVida.tiene_formacion_completa ? (
              <div className="flex items-center gap-1 text-green-500">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-medium">Completa</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-amber-500">
                <XCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Incompleta</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Idiomas si hay */}
      {hojaVida.idiomas && hojaVida.idiomas.length > 0 && (
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Languages className="w-4 h-4" />
            Idiomas
          </h3>
          <div className="flex flex-wrap gap-2">
            {hojaVida.idiomas.map((idioma, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
              >
                {idioma.idioma} — {idioma.nivel}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Observaciones */}
      {hojaVida.observaciones && (
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Observaciones
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{hojaVida.observaciones}</p>
        </Card>
      )}
    </div>
  );
}
