/**
 * LecturasObligatoriasGuard
 *
 * Componente que verifica si el usuario tiene lecturas obligatorias pendientes
 * (ej: Politica de Habeas Data) y muestra un modal informativo que redirige
 * a Mi Portal > Lecturas Pendientes.
 *
 * NO es bloqueante (el usuario puede cerrar y navegar). Pero se muestra
 * una sola vez por sesion y persiste un recordatorio en la campana.
 *
 * Se renderiza dentro de DashboardLayout para cubrir todas las rutas protegidas.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { useLecturasPendientesCount } from '@/features/gestion-documental/hooks/useAceptacionDocumental';
import { useAuthStore } from '@/store/authStore';

const SESSION_KEY = 'lecturas_obligatorias_dismissed';

export function LecturasObligatoriasGuard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data } = useLecturasPendientesCount();
  const count = data?.count ?? 0;

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (count > 0 && user) {
      // Solo mostrar si no se ha descartado en esta sesion
      const dismissed = sessionStorage.getItem(SESSION_KEY);
      if (!dismissed) {
        // Delay para no competir con la carga inicial
        const timer = setTimeout(() => setShowModal(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [count, user]);

  const handleDismiss = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, 'true');
    setShowModal(false);
  }, []);

  const handleGoToLecturas = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, 'true');
    setShowModal(false);
    navigate('/mi-portal?tab=lecturas');
  }, [navigate]);

  if (!showModal) return null;

  return (
    <BaseModal
      isOpen={showModal}
      onClose={handleDismiss}
      title=""
      size="md"
      footer={
        <div className="flex w-full justify-between">
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            Recordar después
          </Button>
          <Button variant="primary" size="sm" onClick={handleGoToLecturas}>
            <BookOpen className="mr-1.5 h-4 w-4" />
            Ir a Lecturas Pendientes
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="text-center space-y-4 py-2">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Lecturas obligatorias pendientes
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Tiene{' '}
            <span className="font-bold text-amber-600 dark:text-amber-400">
              {count} documento{count !== 1 ? 's' : ''}
            </span>{' '}
            de lectura obligatoria pendiente{count !== 1 ? 's' : ''} de aceptación.
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
            Estos documentos requieren su lectura y aceptación para cumplimiento normativo (Ley
            1581/2012, ISO 7.3).
          </p>
        </div>
      </div>
    </BaseModal>
  );
}
