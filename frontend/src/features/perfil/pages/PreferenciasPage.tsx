/**
 * PreferenciasPage - Preferencias del usuario
 *
 * Permite al usuario personalizar:
 * - Idioma (futuro)
 * - Formato de fecha/hora
 *
 * NOTA: Mejoras aplicadas:
 * - MPR-003: Añadido SectionHeader para consistencia visual.
 * - MPR-001: ELIMINADO el toggle de tema (redundante con Header.tsx)
 * - MN-003: ELIMINADA la sección de notificaciones (redundante con NotificacionesPage)
 */
import { useEffect } from 'react';
import { Settings, Globe, Calendar } from 'lucide-react';
import { Card, SectionHeader } from '@/components/common';
import { useHeaderContext } from '@/contexts/HeaderContext';

export const PreferenciasPage = () => {
  const { resetHeader } = useHeaderContext();

  // Limpiar header al montar (no tiene tabs)
  useEffect(() => {
    resetHeader();
  }, [resetHeader]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* MPR-003: SectionHeader para consistencia */}
      <SectionHeader
        title="Preferencias"
        description="Personaliza tu experiencia en la aplicación"
        icon={<Settings className="h-6 w-6" />}
        variant="large"
      />

      {/* Idioma (futuro) */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
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
                Proximamente más idiomas
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Formato de fecha */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
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
      <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
        <p>El tema de la interfaz se puede cambiar desde el icono en la barra superior.</p>
        <p>Las preferencias de notificaciones están disponibles en el Centro de Notificaciones.</p>
      </div>
    </div>
  );
};

export default PreferenciasPage;
