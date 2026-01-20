/**
 * PreferenciasPage - MS-003: User Preferences Management
 *
 * Allows users to customize:
 * - Language (Español, English)
 * - Timezone
 * - Date format
 *
 * Structure:
 * - PageHeader with title and description
 * - Form with language, timezone, and date format selectors
 * - Save and Restore buttons
 *
 * @see docs/desarrollo/CATALOGO_VISTAS_UI.md - Vista 6
 */
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Globe, Calendar, Clock, Save, RotateCcw } from 'lucide-react';
import { Card, Button } from '@/components/common';
import { PageHeader } from '@/components/layout';
import { useHeaderContext } from '@/contexts/HeaderContext';
import { usePreferences, useUpdatePreferences } from '../hooks/usePreferences';
import { COMMON_TIMEZONES } from '@/constants/timezones';
import { Language, DateFormat, type UpdatePreferencesDTO } from '../types/preferences.types';

// Language options
const LANGUAGE_OPTIONS = [
  { value: Language.SPANISH, label: 'Español' },
  { value: Language.ENGLISH, label: 'English' },
];

// Date format options with examples
const DATE_FORMAT_OPTIONS = [
  {
    value: DateFormat.DD_MM_YYYY,
    label: 'DD/MM/YYYY',
    example: '31/12/2025',
  },
  {
    value: DateFormat.MM_DD_YYYY,
    label: 'MM/DD/YYYY',
    example: '12/31/2025',
  },
  {
    value: DateFormat.YYYY_MM_DD,
    label: 'YYYY-MM-DD',
    example: '2025-12-31',
  },
];

export const PreferenciasPage = () => {
  const { resetHeader } = useHeaderContext();
  const { data: preferences, isLoading } = usePreferences();
  const updatePreferences = useUpdatePreferences();
  const [hasChanges, setHasChanges] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty },
  } = useForm<UpdatePreferencesDTO>({
    defaultValues: {
      language: Language.SPANISH,
      timezone: 'America/Bogota',
      date_format: DateFormat.DD_MM_YYYY,
    },
  });

  // Reset form when preferences are loaded
  useEffect(() => {
    if (preferences) {
      reset({
        language: preferences.language,
        timezone: preferences.timezone,
        date_format: preferences.date_format,
      });
    }
  }, [preferences, reset]);

  // Track form changes
  useEffect(() => {
    setHasChanges(isDirty);
  }, [isDirty]);

  // Clear header on mount
  useEffect(() => {
    resetHeader();
  }, [resetHeader]);

  // Handle form submission
  const onSubmit = (data: UpdatePreferencesDTO) => {
    updatePreferences.mutate(data);
  };

  // Handle restore to defaults
  const handleRestore = () => {
    if (preferences) {
      reset({
        language: preferences.language,
        timezone: preferences.timezone,
        date_format: preferences.date_format,
      });
    }
  };

  // Watch current values for display
  const currentLanguage = watch('language');
  const currentTimezone = watch('timezone');
  const currentDateFormat = watch('date_format');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Preferencias"
          description="Personaliza tu experiencia en la aplicación"
        />
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader title="Preferencias" description="Personaliza tu experiencia en la aplicación" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Language Card */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 flex-shrink-0">
              <Globe className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Idioma</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1 mb-4">
                Selecciona el idioma de la interfaz.
              </p>

              <Controller
                name="language"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-3">
                    {LANGUAGE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => field.onChange(option.value)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          field.value === option.value
                            ? 'border-green-600 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium'
                            : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>
          </div>
        </Card>

        {/* Timezone Card */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
              <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Zona Horaria</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1 mb-4">
                Define tu zona horaria para mostrar fechas y horas correctamente.
              </p>

              <Controller
                name="timezone"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {COMMON_TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
          </div>
        </Card>

        {/* Date Format Card */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex-shrink-0">
              <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Formato de Fecha
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1 mb-4">
                Elige cómo se mostrarán las fechas en la aplicación.
              </p>

              <Controller
                name="date_format"
                control={control}
                render={({ field }) => (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {DATE_FORMAT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => field.onChange(option.value)}
                        className={`p-4 rounded-lg border-2 transition-all text-center ${
                          field.value === option.value
                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div
                          className={`font-medium ${
                            field.value === option.value
                              ? 'text-purple-700 dark:text-purple-400'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {option.label}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {option.example}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleRestore}
            disabled={!hasChanges || updatePreferences.isPending}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar valores
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!hasChanges || updatePreferences.isPending}
            isLoading={updatePreferences.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar cambios
          </Button>
        </div>
      </form>

      {/* Info note */}
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
        El tema de la interfaz se puede cambiar desde el icono en la barra superior. Las
        preferencias de notificaciones están disponibles en el Centro de Notificaciones.
      </p>
    </div>
  );
};

export default PreferenciasPage;
