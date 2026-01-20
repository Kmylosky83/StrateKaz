/**
 * PreferenciasPage - Vista 6: Panel de Configuración con Acciones
 *
 * Permite al usuario personalizar:
 * - Idioma (futuro)
 * - Formato de fecha/hora
 *
 * Estructura:
 * - PageHeader con título y descripción
 * - Action Cards independientes con icono + título + descripción + contenido
 *
 * @see docs/desarrollo/CATALOGO_VISTAS_UI.md - Vista 6
 */
import { useEffect } from 'react';
import { Globe, Calendar } from 'lucide-react';
import { Card } from '@/components/common';
import { PageHeader } from '@/components/layout';
import { useHeaderContext } from '@/contexts/HeaderContext';

export const PreferenciasPage = () => {
  const { resetHeader } = useHeaderContext();

  // Limpiar header al montar (no tiene tabs)
  useEffect(() => {
    resetHeader();
  }, [resetHeader]);

  return (
    <div className="space-y-6">
      {/* Page Header - Vista 6 */}
      <PageHeader title="Preferencias" description="Personaliza tu experiencia en la aplicación" />

      {/* Action Card: Idioma */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 flex-shrink-0">
            <Globe className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Idioma</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Selecciona el idioma de la interfaz.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                Español (Colombia)
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Próximamente más idiomas
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Card: Formato de Fecha */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex-shrink-0">
            <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Formato de Fecha y Hora
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Personaliza cómo se muestran las fechas y horas.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Formato de fecha</label>
                <p className="text-gray-900 dark:text-white">DD/MM/YYYY</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Zona horaria</label>
                <p className="text-gray-900 dark:text-white">America/Bogota (UTC-5)</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Nota informativa */}
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
        El tema de la interfaz se puede cambiar desde el icono en la barra superior. Las
        preferencias de notificaciones están disponibles en el Centro de Notificaciones.
      </p>
    </div>
  );
};

export default PreferenciasPage;
