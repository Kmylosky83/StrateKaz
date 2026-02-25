import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Eye, Users } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';

/**
 * Banner persistente que se muestra cuando un superadmin está visitando
 * un tenant desde Admin Global. Tiene dos modos:
 *
 * 1. **Admin** (amber): El superadmin administra la empresa con sus propios permisos.
 *    Botón: "Volver a Admin Global"
 *
 * 2. **Usuario** (purple): El superadmin ve la app como un usuario específico.
 *    Muestra nombre y cargo del usuario impersonado.
 *    Botones: "Cambiar usuario" + "Admin Global"
 */
export const ImpersonationBanner = () => {
  const navigate = useNavigate();
  const isImpersonating = useAuthStore((state) => state.isImpersonating);
  const currentTenant = useAuthStore((state) => state.currentTenant);
  const impersonatedUserId = useAuthStore((state) => state.impersonatedUserId);
  const user = useAuthStore((state) => state.user);
  const stopImpersonation = useAuthStore((state) => state.stopImpersonation);
  const stopUserImpersonation = useAuthStore((state) => state.stopUserImpersonation);

  if (!isImpersonating) return null;

  // Modo usuario: impersonando a un usuario específico
  const isUserMode = !!impersonatedUserId;

  /** Volver a Admin Global (limpia todo) */
  const handleExitToAdmin = () => {
    if (isUserMode) {
      stopUserImpersonation();
    }
    stopImpersonation();
    navigate('/admin-global');
  };

  /** Cambiar usuario: sale de impersonación de usuario pero se queda en el tenant */
  const handleChangeUser = () => {
    stopUserImpersonation();
    navigate('/dashboard');
  };

  // ── Modo Usuario (purple) ──────────────────────────────────────
  if (isUserMode) {
    const userName =
      user?.full_name || `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || 'Usuario';
    const cargoName = user?.cargo?.name;

    return (
      <div
        className={cn(
          'fixed top-0 left-0 right-0 z-[60] h-10',
          'bg-purple-600 text-white',
          'flex items-center justify-center gap-3 px-4',
          'text-sm font-medium shadow-md'
        )}
      >
        <Eye className="w-4 h-4 flex-shrink-0" />

        <span className="truncate">
          <span className="hidden sm:inline">Viendo como </span>
          <strong>{userName}</strong>
          {cargoName && <span className="hidden md:inline text-purple-200"> ({cargoName})</span>}
          <span className="hidden lg:inline text-purple-200">
            {' '}
            en {currentTenant?.name || 'Empresa'}
          </span>
        </span>

        {/* Botón: Cambiar usuario */}
        <button
          type="button"
          onClick={handleChangeUser}
          className={cn(
            'flex items-center gap-1.5 ml-2 px-3 py-1 rounded-md',
            'bg-white/20 hover:bg-white/30 transition-colors',
            'text-xs font-semibold whitespace-nowrap'
          )}
        >
          <Users className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Cambiar usuario</span>
          <span className="sm:hidden">Cambiar</span>
        </button>

        {/* Botón: Admin Global */}
        <button
          type="button"
          onClick={handleExitToAdmin}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1 rounded-md',
            'bg-white/20 hover:bg-white/30 transition-colors',
            'text-xs font-semibold whitespace-nowrap'
          )}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Admin Global</span>
          <span className="md:hidden">Salir</span>
        </button>
      </div>
    );
  }

  // ── Modo Admin (amber) ─────────────────────────────────────────
  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[60] h-10',
        'bg-amber-500 text-white',
        'flex items-center justify-center gap-3 px-4',
        'text-sm font-medium shadow-md'
      )}
    >
      <Shield className="w-4 h-4 flex-shrink-0" />

      <span className="truncate">
        <span className="hidden sm:inline">Administrando </span>
        <strong>{currentTenant?.name || 'Empresa'}</strong>
        <span className="hidden md:inline"> como superadmin</span>
      </span>

      <button
        type="button"
        onClick={handleExitToAdmin}
        className={cn(
          'flex items-center gap-1.5 ml-2 px-3 py-1 rounded-md',
          'bg-white/20 hover:bg-white/30 transition-colors',
          'text-xs font-semibold whitespace-nowrap'
        )}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Volver a Admin Global</span>
        <span className="sm:hidden">Salir</span>
      </button>
    </div>
  );
};
