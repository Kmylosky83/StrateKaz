/**
 * UserImpersonationModal - Modal para seleccionar un usuario a impersonar
 *
 * Se abre cuando el superadmin selecciona "Ver como usuario" en un tenant.
 * Muestra los usuarios del tenant actual y permite seleccionar uno para
 * ver la aplicación desde su perspectiva (permisos, sidebar, portals).
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Eye, Search, User as UserIcon, Briefcase, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common';
import { Input } from '@/components/forms/Input';
import { useAuthStore } from '@/store/authStore';
import { usersAPI } from '@/api/users.api';
import { cn } from '@/utils/cn';

interface UserImpersonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserImpersonationModal = ({ isOpen, onClose }: UserImpersonationModalProps) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState<number | null>(null);
  const startUserImpersonation = useAuthStore((state) => state.startUserImpersonation);
  const currentTenant = useAuthStore((state) => state.currentTenant);
  const originalUser = useAuthStore((state) => state.originalUser);
  const currentUser = useAuthStore((state) => state.user);
  const superadminId = originalUser?.id ?? currentUser?.id;

  // Obtener usuarios del tenant actual
  const { data, isLoading } = useQuery({
    queryKey: ['impersonation-users', currentTenant?.id],
    queryFn: () => usersAPI.getUsers({ page_size: 100, is_active: true }),
    enabled: isOpen && !!currentTenant,
  });

  // Filtrar por búsqueda y excluir al superadmin
  const users = useMemo(() => {
    const results = Array.isArray(data) ? data : (data?.results ?? []);
    // Excluir al superadmin de la lista (no puede impersonarse a sí mismo)
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

  const handleImpersonate = async (userId: number, hasProveedor: boolean) => {
    try {
      setLoading(userId);
      await startUserImpersonation(userId);
      onClose();
      // Navegar según tipo de usuario
      if (hasProveedor) {
        navigate('/proveedor-portal');
      } else {
        navigate('/dashboard');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || 'No se pudo ver como este usuario');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ver como usuario" size="2xl">
      <div className="space-y-4">
        {/* Info del tenant */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Selecciona un usuario de <strong>{currentTenant?.name}</strong> para ver la aplicación
          desde su perspectiva.
        </p>

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
              const isExterno = (user as { proveedor?: number | null }).proveedor != null;
              const isLoading = loading === user.id;

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
                    onClick={() => handleImpersonate(user.id, isExterno)}
                    disabled={isLoading}
                    className="flex-shrink-0 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
                    isLoading={isLoading}
                    leftIcon={!isLoading ? <Eye className="w-3.5 h-3.5" /> : undefined}
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
    </Modal>
  );
};
