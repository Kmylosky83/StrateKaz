/**
 * SeguridadPage - Configuración de seguridad del usuario
 *
 * Permite al usuario gestionar:
 * - Cambio de contraseña
 * - Sesiones activas
 * - Autenticación de dos factores (futuro)
 *
 * Mejoras aplicadas:
 * - MS-003-A: Añadido SectionHeader para consistencia visual.
 * - MS-001-A: Cambio de contraseña funcional con modal.
 */
import { useEffect, useState } from 'react';
import { Shield, Key, Smartphone, Monitor } from 'lucide-react';
import { Card, Button, SectionHeader } from '@/components/common';
import { useHeaderContext } from '@/contexts/HeaderContext';
import { ChangePasswordModal } from '../components/ChangePasswordModal';

export const SeguridadPage = () => {
  const { resetHeader } = useHeaderContext();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Limpiar header al montar (no tiene tabs)
  useEffect(() => {
    resetHeader();
  }, [resetHeader]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* MS-003-A: SectionHeader para consistencia */}
      <SectionHeader
        title="Seguridad"
        description="Gestiona la seguridad de tu cuenta"
        icon={<Shield className="h-6 w-6" />}
        variant="large"
      />

      {/* Cambio de contraseña */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/30">
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

      {/* Sesiones activas */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Monitor className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sesiones Activas
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gestiona los dispositivos donde tienes sesiones iniciadas.
            </p>
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Monitor className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Sesión actual</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {navigator.userAgent.includes('Windows')
                      ? 'Windows'
                      : navigator.userAgent.includes('Mac')
                        ? 'macOS'
                        : navigator.userAgent.includes('Linux')
                          ? 'Linux'
                          : 'Desconocido'}{' '}
                    -{' '}
                    {navigator.userAgent.includes('Chrome')
                      ? 'Chrome'
                      : navigator.userAgent.includes('Firefox')
                        ? 'Firefox'
                        : navigator.userAgent.includes('Safari')
                          ? 'Safari'
                          : navigator.userAgent.includes('Edge')
                            ? 'Edge'
                            : 'Navegador'}
                  </p>
                </div>
                <span className="ml-auto px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                  Activa
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              La gestión de múltiples sesiones estará disponible próximamente.
            </p>
          </div>
        </div>
      </Card>

      {/* 2FA (futuro) */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Smartphone className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Autenticación de Dos Factores
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Añade una capa extra de seguridad a tu cuenta.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Proximamente disponible
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal de cambio de contraseña */}
      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
    </div>
  );
};

export default SeguridadPage;
