/**
 * GenericSectionFallback - MM-002
 *
 * Componente fallback para secciones que existen en BD pero no tienen UI implementada.
 * Muestra un mensaje informativo en lugar de redirigir silenciosamente.
 *
 * Uso:
 * - En tabs dinámicos cuando activeSection no tiene componente mapeado
 * - Ayuda a identificar secciones pendientes de implementación
 */
import { Settings2 } from 'lucide-react';
import { Card } from './Card';

export interface GenericSectionFallbackProps {
  /** Código de la sección no implementada */
  sectionCode: string;
  /** Nombre del tab/módulo padre (opcional, para contexto) */
  parentName?: string;
}

export const GenericSectionFallback = ({
  sectionCode,
  parentName,
}: GenericSectionFallbackProps) => {
  return (
    <Card>
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <Settings2 className="h-8 w-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Sección en desarrollo
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          La sección{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">"{sectionCode}"</span>
          {parentName && (
            <span>
              {' '}
              de <span className="font-medium text-gray-700 dark:text-gray-300">{parentName}</span>
            </span>
          )}{' '}
          está habilitada en el sistema pero su interfaz aún no ha sido implementada.
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-4">
          Código de sección:{' '}
          <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{sectionCode}</code>
        </p>
      </div>
    </Card>
  );
};

export default GenericSectionFallback;
