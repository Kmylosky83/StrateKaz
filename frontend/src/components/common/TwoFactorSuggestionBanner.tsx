/**
 * Banner de sugerencia de 2FA para superadmins
 *
 * Muestra un banner amber/warning en el Dashboard cuando:
 * - El usuario es superuser
 * - No tiene 2FA habilitado (has_2fa_enabled === false)
 * - No ha sido descartado en la sesión actual (sessionStorage)
 *
 * Es una sugerencia, no un bloqueo. Se puede descartar con "Más tarde".
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';

const STORAGE_KEY = '2fa_suggestion_dismissed';

export const TwoFactorSuggestionBanner = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(STORAGE_KEY) === 'true');

  // Solo mostrar para superusers sin 2FA
  if (!user?.is_superuser || user?.has_2fa_enabled !== false || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, 'true');
    setDismissed(true);
  };

  const handleConfigure = () => {
    navigate('/perfil/seguridad');
  };

  return (
    <div
      className={cn(
        'rounded-lg border border-amber-200 dark:border-amber-800',
        'bg-amber-50 dark:bg-amber-900/20',
        'p-4'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icono */}
        <div
          className={cn(
            'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
            'bg-amber-100 dark:bg-amber-900/40'
          )}
        >
          <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Tu cuenta de administrador no tiene verificación en dos pasos. Recomendamos habilitarla
            para mayor seguridad.
          </p>

          {/* Acciones */}
          <div className="flex items-center gap-3 mt-3">
            <button
              type="button"
              onClick={handleConfigure}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md',
                'bg-amber-600 hover:bg-amber-700 text-white',
                'text-xs font-semibold transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2',
                'dark:focus:ring-offset-gray-900'
              )}
            >
              <Shield className="w-3.5 h-3.5" />
              Configurar 2FA
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className={cn(
                'text-xs text-amber-600 dark:text-amber-400',
                'hover:text-amber-800 dark:hover:text-amber-200',
                'font-medium transition-colors'
              )}
            >
              Más tarde
            </button>
          </div>
        </div>

        {/* Botón de cerrar */}
        <button
          type="button"
          onClick={handleDismiss}
          className={cn(
            'flex-shrink-0 p-1 rounded-md',
            'text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-200',
            'hover:bg-amber-100 dark:hover:bg-amber-900/40',
            'transition-colors'
          )}
          aria-label="Cerrar sugerencia de 2FA"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
