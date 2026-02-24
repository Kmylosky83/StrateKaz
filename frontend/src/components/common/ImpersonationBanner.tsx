import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';

/**
 * Banner persistente que se muestra cuando un superadmin está visitando
 * un tenant desde Admin Global. Incluye botón para volver.
 */
export const ImpersonationBanner = () => {
  const navigate = useNavigate();
  const isImpersonating = useAuthStore((state) => state.isImpersonating);
  const currentTenant = useAuthStore((state) => state.currentTenant);
  const stopImpersonation = useAuthStore((state) => state.stopImpersonation);

  if (!isImpersonating) return null;

  const handleExit = () => {
    stopImpersonation();
    navigate('/admin-global');
  };

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
        <span className="hidden sm:inline">Estas viendo </span>
        <strong>{currentTenant?.name || 'Empresa'}</strong>
        <span className="hidden md:inline"> como administrador</span>
      </span>

      <button
        type="button"
        onClick={handleExit}
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
