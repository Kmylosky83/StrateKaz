/**
 * PreferenciasNotificaciones — Preferencias personales de notificación.
 *
 * Reutilizable: usado en MisNotificacionesPage (perfil).
 */
import { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Settings, Clock } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Alert';
import { Input, Switch } from '@/components/forms';
import { usePreferenciasNotificacion, useUpdatePreferencia } from '../hooks/useNotificaciones';

export function PreferenciasNotificaciones() {
  const { data: preferencias, isLoading, error } = usePreferenciasNotificacion();
  const updatePreferencia = useUpdatePreferencia();

  const [formValues, setFormValues] = useState({
    recibir_app: true,
    recibir_email: true,
    recibir_push: false,
    horario_inicio: '08:00',
    horario_fin: '18:00',
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (preferencias && preferencias.length > 0 && !isSaving) {
      const pref = preferencias[0];
      setFormValues({
        recibir_app: pref.recibir_app ?? true,
        recibir_email: pref.recibir_email ?? true,
        recibir_push: pref.recibir_push ?? false,
        horario_inicio: pref.horario_inicio || '08:00',
        horario_fin: pref.horario_fin || '18:00',
      });
    }
  }, [preferencias, isSaving]);

  const handleToggle = (key: 'recibir_app' | 'recibir_email' | 'recibir_push') => {
    setFormValues((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePreferencias = () => {
    if (preferencias && preferencias.length > 0) {
      const prefId = preferencias[0].id;
      setIsSaving(true);

      updatePreferencia.mutate(
        { id: prefId, data: formValues },
        {
          onSettled: () => {
            setTimeout(() => setIsSaving(false), 500);
          },
        }
      );
    }
  };

  const handleResetDefaults = () => {
    const defaults = {
      recibir_app: true,
      recibir_email: true,
      recibir_push: false,
      horario_inicio: '08:00',
      horario_fin: '18:00',
    };
    setFormValues(defaults);

    if (preferencias && preferencias.length > 0) {
      const prefId = preferencias[0].id;
      setIsSaving(true);

      updatePreferencia.mutate(
        { id: prefId, data: defaults },
        {
          onSettled: () => {
            setTimeout(() => setIsSaving(false), 500);
          },
        }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 animate-pulse-subtle">
          <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 w-10 h-10" />
          <div>
            <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded mt-1" />
          </div>
        </div>
        <Card>
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse-subtle"
              />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return <Alert variant="error" message="Error al cargar las preferencias." />;
  }

  const canales = [
    {
      key: 'recibir_app',
      icon: Bell,
      title: 'Notificaciones en App',
      description: 'Recibir alertas dentro de la aplicación',
    },
    {
      key: 'recibir_email',
      icon: Mail,
      title: 'Notificaciones por Email',
      description: 'Recibir notificaciones en tu correo electrónico',
    },
    {
      key: 'recibir_push',
      icon: MessageSquare,
      title: 'Notificaciones Push',
      description: 'Recibir notificaciones push en tu dispositivo',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
          <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Preferencias de Notificación
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configura cómo quieres recibir notificaciones
          </p>
        </div>
      </div>

      {/* Canales */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Canales de Notificación
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Activa o desactiva los canales por los que deseas recibir notificaciones
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {canales.map((canal) => {
              const Icon = canal.icon;
              const isActive = formValues[canal.key as keyof typeof formValues] as boolean;

              return (
                <div
                  key={canal.key}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{canal.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {canal.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={() =>
                      handleToggle(canal.key as 'recibir_app' | 'recibir_email' | 'recibir_push')
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Horarios */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Horario de Notificaciones
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Define en qué horario deseas recibir notificaciones
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="time"
              label="Hora de inicio"
              value={formValues.horario_inicio}
              onChange={(e) =>
                setFormValues((prev) => ({ ...prev, horario_inicio: e.target.value }))
              }
            />
            <Input
              type="time"
              label="Hora de fin"
              value={formValues.horario_fin}
              onChange={(e) => setFormValues((prev) => ({ ...prev, horario_fin: e.target.value }))}
            />
          </div>

          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Las notificaciones fuera de este horario se acumularán y se entregarán al inicio del
            próximo período.
          </p>
        </div>
      </Card>

      {/* Acciones */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetDefaults}
          disabled={updatePreferencia.isPending}
        >
          Restaurar Predeterminados
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSavePreferencias}
          isLoading={updatePreferencia.isPending}
        >
          Guardar Preferencias
        </Button>
      </div>
    </div>
  );
}
