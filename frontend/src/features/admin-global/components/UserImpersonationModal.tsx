/**
 * UserImpersonationModal - Modal para seleccionar un usuario a impersonar
 *
 * Se abre cuando el superadmin selecciona "Ver como usuario" en un tenant.
 * Muestra los usuarios del tenant actual y permite seleccionar uno para
 * ver la aplicación desde su perspectiva (permisos, sidebar, portals).
 *
 * Si el superadmin tiene 2FA habilitado, requiere verificación antes de
 * permitir la impersonación (S1 — seguridad pre-impersonación).
 */
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Eye,
  Search,
  User as UserIcon,
  Briefcase,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common';
import { Input } from '@/components/forms/Input';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/api/auth.api';
import type { User } from '@/types/auth.types';
import { usersAPI } from '@/api/users.api';
import { cn } from '@/utils/cn';

interface UserImpersonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Vista interna: selección de usuario o verificación 2FA */
type ModalView = 'user-list' | '2fa-verify';

/** Datos del usuario seleccionado para impersonar */
interface SelectedTarget {
  userId: number;
  userItem: unknown;
  fullName: string;
}

export const UserImpersonationModal = ({ isOpen, onClose }: UserImpersonationModalProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Estado del modal
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState<number | null>(null);
  const [view, setView] = useState<ModalView>('user-list');
  const [selectedTarget, setSelectedTarget] = useState<SelectedTarget | null>(null);

  // Estado 2FA
  const [twoFaCode, setTwoFaCode] = useState('');
  const [twoFaError, setTwoFaError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Auth store
  const startUserImpersonation = useAuthStore((state) => state.startUserImpersonation);
  const currentTenant = useAuthStore((state) => state.currentTenant);
  const originalUser = useAuthStore((state) => state.originalUser);
  const currentUser = useAuthStore((state) => state.user);
  const superadminId = originalUser?.id ?? currentUser?.id;
  const has2faEnabled = currentUser?.has_2fa_enabled ?? false;

  // Obtener usuarios del tenant actual
  const { data, isLoading } = useQuery({
    queryKey: ['impersonation-users', currentTenant?.id],
    queryFn: () => usersAPI.getUsers({ page_size: 100, is_active: true }),
    enabled: isOpen && !!currentTenant,
  });

  // Filtrar por búsqueda y excluir al superadmin
  const users = useMemo(() => {
    const results = Array.isArray(data) ? data : (data?.results ?? []);
    const filtered = results.filter((u) => u.id !== superadminId);
    if (!search.trim()) return filtered;
    const term = search.toLowerCase();
    return filtered.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.first_name?.toLowerCase().includes(term) ||
        u.last_name?.toLowerCase().includes(term) ||
        u.cargo?.name?.toLowerCase().includes(term)
    );
  }, [data, search, superadminId]);

  // Reset al cerrar modal
  const handleClose = useCallback(() => {
    setView('user-list');
    setSelectedTarget(null);
    setTwoFaCode('');
    setTwoFaError('');
    setVerifying(false);
    setLoading(null);
    onClose();
  }, [onClose]);

  // Focus en input de código cuando se muestra la vista 2FA
  useEffect(() => {
    if (view === '2fa-verify' && codeInputRef.current) {
      // Pequeño delay para que el DOM se actualice
      const timer = setTimeout(() => codeInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [view]);

  /**
   * Ejecuta la impersonación con token opcional.
   */
  const executeImpersonation = async (
    userId: number,
    userItem: unknown,
    impersonationToken?: string
  ) => {
    await startUserImpersonation(userId, impersonationToken);
    queryClient.removeQueries({ queryKey: ['modules'] });

    handleClose();
    navigate('/dashboard');
  };

  /**
   * Click en "Ver como" de un usuario.
   * Si el superadmin tiene 2FA, muestra paso de verificación.
   * Si no tiene 2FA, impersona directamente.
   */
  const handleImpersonate = async (userId: number, userItem: unknown) => {
    if (has2faEnabled) {
      // Mostrar paso de verificación 2FA
      const fullName =
        (userItem as { full_name?: string; first_name?: string; last_name?: string })?.full_name ||
        `${(userItem as { first_name?: string })?.first_name ?? ''} ${(userItem as { last_name?: string })?.last_name ?? ''}`.trim();

      setSelectedTarget({ userId, userItem, fullName });
      setTwoFaCode('');
      setTwoFaError('');
      setView('2fa-verify');
      return;
    }

    // Sin 2FA: impersonar directamente (flujo legacy)
    try {
      setLoading(userId);
      await executeImpersonation(userId, userItem);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || 'No se pudo ver como este usuario');
    } finally {
      setLoading(null);
    }
  };

  /**
   * Verificar código 2FA y proceder con impersonación.
   */
  const handleVerify2FA = async () => {
    if (!selectedTarget) return;

    const code = twoFaCode.trim();
    if (!code) {
      setTwoFaError('Ingresa el código de verificación');
      return;
    }

    try {
      setVerifying(true);
      setTwoFaError('');

      // Verificar código y obtener token temporal
      const result = await authAPI.verifyImpersonation(selectedTarget.userId, code);

      // Si usó backup code, notificar códigos restantes
      if (result.backup_codes_remaining !== undefined) {
        toast.info(
          `Código de respaldo usado. Te quedan ${result.backup_codes_remaining} códigos de respaldo.`
        );
      }

      // Impersonar con el token verificado
      await executeImpersonation(
        selectedTarget.userId,
        selectedTarget.userItem,
        result.impersonation_token
      );
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { error?: string } } };
      const errorMsg = err?.response?.data?.error || 'No se pudo verificar el código';

      if (err?.response?.status === 401) {
        setTwoFaError('Código incorrecto. Inténtalo de nuevo.');
      } else {
        setTwoFaError(errorMsg);
      }
      setTwoFaCode('');
      codeInputRef.current?.focus();
    } finally {
      setVerifying(false);
    }
  };

  /**
   * Manejar Enter en el input de código 2FA.
   */
  const handleCodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && twoFaCode.trim()) {
      handleVerify2FA();
    }
  };

  /**
   * Volver a la lista de usuarios desde la vista 2FA.
   */
  const handleBackToList = () => {
    setView('user-list');
    setSelectedTarget(null);
    setTwoFaCode('');
    setTwoFaError('');
  };

  // ─── Render: Vista de verificación 2FA ────────────────────────────────
  if (view === '2fa-verify' && selectedTarget) {
    return (
      <BaseModal isOpen={isOpen} onClose={handleClose} title="Verificación de seguridad" size="md">
        <div className="space-y-5">
          {/* Header con ícono */}
          <div className="flex flex-col items-center gap-3 pt-2">
            <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Ingresa tu código de verificación para impersonar a
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                {selectedTarget.fullName}
              </p>
            </div>
          </div>

          {/* Input de código */}
          <div className="space-y-2">
            <Input
              ref={codeInputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Código de 6 dígitos"
              value={twoFaCode}
              onChange={(e) => {
                // Solo permitir dígitos, máximo 6
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setTwoFaCode(val);
                if (twoFaError) setTwoFaError('');
              }}
              onKeyDown={handleCodeKeyDown}
              className={cn(
                'text-center text-lg tracking-[0.5em] font-mono',
                twoFaError && 'border-red-500 focus:ring-red-500'
              )}
            />
            {twoFaError && (
              <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{twoFaError}</span>
              </div>
            )}
          </div>

          {/* Hint */}
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            Ingresa el código de tu aplicación de autenticación o un código de respaldo.
          </p>

          {/* Botones */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleBackToList}
              disabled={verifying}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              className="flex-1"
            >
              Volver
            </Button>
            <Button
              onClick={handleVerify2FA}
              disabled={!twoFaCode.trim() || verifying}
              isLoading={verifying}
              leftIcon={!verifying ? <ShieldCheck className="w-4 h-4" /> : undefined}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              Verificar e impersonar
            </Button>
          </div>
        </div>
      </BaseModal>
    );
  }

  // ─── Render: Vista de lista de usuarios (default) ─────────────────────
  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Ver como usuario" size="2xl">
      <div className="space-y-4">
        {/* Info del tenant */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Selecciona un usuario de <strong>{currentTenant?.name}</strong> para ver la aplicación
          desde su perspectiva.
        </p>

        {/* Warning si no tiene 2FA */}
        {currentUser?.is_superuser && !has2faEnabled && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Recomendamos habilitar la autenticación de dos factores (2FA) para mayor seguridad al
              impersonar usuarios.
            </p>
          </div>
        )}

        {/* Buscador */}
        <Input
          type="text"
          placeholder="Buscar por nombre, email o cargo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />

        {/* Lista de usuarios */}
        <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2" />
              Cargando usuarios...
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <UserIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              {search ? 'No se encontraron usuarios' : 'No hay usuarios en este tenant'}
            </div>
          ) : (
            users.map((user) => {
              const isExterno = Boolean(user.proveedor || user.cliente);
              const isItemLoading = loading === user.id;

              return (
                <div
                  key={user.id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3',
                    'hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors'
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                      'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {user.photo_url ? (
                      <img
                        src={user.photo_url}
                        alt={user.full_name || ''}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-semibold">
                        {(user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user.full_name || `${user.first_name} ${user.last_name}`}
                      </p>
                      {isExterno && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                          <ExternalLink className="w-2.5 h-2.5" />
                          Externo
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="truncate">{user.email}</span>
                      {user.cargo && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="flex items-center gap-1 truncate">
                            <Briefcase className="w-3 h-3" />
                            {user.cargo.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Botón Ver como */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleImpersonate(user.id, user)}
                    disabled={isItemLoading}
                    className="flex-shrink-0 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
                    isLoading={isItemLoading}
                    leftIcon={!isItemLoading ? <Eye className="w-3.5 h-3.5" /> : undefined}
                  >
                    Ver como
                  </Button>
                </div>
              );
            })
          )}
        </div>

        {/* Contador */}
        {!isLoading && users.length > 0 && (
          <p className="text-xs text-gray-400 text-right">
            {users.length} usuario{users.length !== 1 ? 's' : ''}
            {search && ' encontrado' + (users.length !== 1 ? 's' : '')}
          </p>
        )}
      </div>
    </BaseModal>
  );
};
