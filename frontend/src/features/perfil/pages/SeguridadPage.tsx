/**
 * SeguridadPage - Vista 6: Panel de Configuración con Acciones
 *
 * Permite al usuario gestionar:
 * - Cambio de contraseña
 * - Sesiones activas
 * - Autenticación de dos factores
 *
 * Estructura:
 * - PageHeader con título y descripción
 * - Action Cards independientes con icono + título + descripción + acción
 *
 * @see docs/desarrollo/CATALOGO_VISTAS_UI.md - Vista 6
 */
import { useEffect, useState } from 'react';
import { Shield, Key, Smartphone, CheckCircle, XCircle } from 'lucide-react';
import { Card, Button } from '@/components/common';
import { PageHeader } from '@/components/layout';
import { useHeaderContext } from '@/contexts/HeaderContext';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { ActiveSessionsCard } from '../components/ActiveSessionsCard';
import { TwoFactorModal } from '../components/TwoFactorModal';
import { Disable2FAModal } from '../components/Disable2FAModal';
import { use2FA } from '../hooks/use2FA';

export const SeguridadPage = () => {
  const { resetHeader } = useHeaderContext();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);

  // Hook de 2FA
  const { status, isLoadingStatus } = use2FA();

  // Limpiar header al montar (no tiene tabs)
  useEffect(() => {
    resetHeader();
  }, [resetHeader]);

  return (
    <div className="space-y-6">
      {/* Page Header - Vista 6 */}
      <PageHeader title="Seguridad" description="Gestiona la seguridad de tu cuenta" />

      {/* Action Card: Cambiar Contraseña */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex-shrink-0">
            <Key className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Cambiar Contraseña
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Actualiza tu contraseña regularmente para mantener tu cuenta segura.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setShowPasswordModal(true)}
            >
              Cambiar Contraseña
            </Button>
          </div>
        </div>
      </Card>

      {/* Action Card: Sesiones Activas */}
      <ActiveSessionsCard />

      {/* Action Card: 2FA */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex-shrink-0">
            <Smartphone className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Autenticación de Dos Factores (2FA)
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Añade una capa extra de seguridad requiriendo un código de tu dispositivo móvil al
              iniciar sesión.
            </p>

            {!isLoadingStatus && status && (
              <>
                {/* Estado de 2FA */}
                <div className="mt-4 flex items-center gap-2">
                  {status.is_enabled ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        Habilitado
                      </span>
                      {status.backup_codes_remaining !== undefined && (
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                          ({status.backup_codes_remaining} códigos de respaldo disponibles)
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Deshabilitado
                      </span>
                    </>
                  )}
                </div>

                {/* Acciones */}
                <div className="mt-4 flex gap-3">
                  {status.is_enabled ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDisable2FAModal(true)}
                    >
                      Deshabilitar 2FA
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setShow2FAModal(true)}>
                      Habilitar 2FA
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Modales */}
      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
      <TwoFactorModal isOpen={show2FAModal} onClose={() => setShow2FAModal(false)} />
      <Disable2FAModal isOpen={showDisable2FAModal} onClose={() => setShowDisable2FAModal(false)} />
    </div>
  );
};

export default SeguridadPage;
