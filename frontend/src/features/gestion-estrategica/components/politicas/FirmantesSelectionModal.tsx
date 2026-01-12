/**
 * Modal de Selección de Firmantes
 * Sistema de Gestión StrateKaz v3.0
 *
 * Permite al usuario seleccionar quién revisa y aprueba una política
 * antes de iniciar el proceso de firma.
 */
import { useState, useMemo } from 'react';
import { X, UserCheck, Users, Search, AlertCircle } from 'lucide-react';

// Design System
import { Button } from '@/components/common/Button';

// Hooks
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { useAuthStore } from '@/store/authStore';

// Types
import type { FirmanteSeleccion } from '../../hooks/usePoliticas';

// ============================================================================
// TYPES
// ============================================================================

interface Usuario {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  cargo?: {
    id: number;
    name: string;
  };
  full_name?: string;
}

interface FirmantesSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (firmantes: FirmanteSeleccion[]) => void;
  isLoading?: boolean;
  usuarios: Usuario[];
  isLoadingUsuarios?: boolean;
}

// ============================================================================
// ROLES DISPONIBLES
// ============================================================================

const ROLES_DISPONIBLES = [
  {
    code: 'REVISO_TECNICO' as const,
    label: 'Revisó (Técnico)',
    description: 'Revisión técnica del contenido',
    orden: 2,
    required: true,
  },
  {
    code: 'APROBO_GERENTE' as const,
    label: 'Aprobó (Gerente)',
    description: 'Aprobación final del gerente',
    orden: 3,
    required: true,
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function FirmantesSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  usuarios,
  isLoadingUsuarios,
}: FirmantesSelectionModalProps) {
  const { primaryColor } = useBrandingConfig();
  const currentUser = useAuthStore((state) => state.user);

  // Estado para la selección
  const [selectedFirmantes, setSelectedFirmantes] = useState<
    Record<string, number | null>
  >({
    REVISO_TECNICO: null,
    APROBO_GERENTE: null,
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar usuarios por búsqueda
  const filteredUsuarios = useMemo(() => {
    if (!searchTerm) return usuarios;
    const term = searchTerm.toLowerCase();
    return usuarios.filter(
      (u) =>
        u.username.toLowerCase().includes(term) ||
        u.first_name?.toLowerCase().includes(term) ||
        u.last_name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.cargo?.name.toLowerCase().includes(term)
    );
  }, [usuarios, searchTerm]);

  // Handlers
  const handleSelectFirmante = (rol: string, usuarioId: number) => {
    setSelectedFirmantes((prev) => ({
      ...prev,
      [rol]: usuarioId,
    }));
  };

  const handleConfirm = () => {
    // Construir array de firmantes (sin incluir ELABORO, que se agrega automáticamente)
    const firmantes: FirmanteSeleccion[] = ROLES_DISPONIBLES
      .filter((rol) => selectedFirmantes[rol.code] !== null)
      .map((rol) => ({
        rol_firmante: rol.code,
        usuario_id: selectedFirmantes[rol.code] as number,
      }));

    onConfirm(firmantes);
  };

  // Validar que todos los roles requeridos estén seleccionados
  const canConfirm = ROLES_DISPONIBLES.every(
    (rol) => !rol.required || selectedFirmantes[rol.code] !== null
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <UserCheck className="w-5 h-5" style={{ color: primaryColor }} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Seleccionar Firmantes
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Elija quién revisará y aprobará la política
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Info del Elaborador */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    Usted será el Elaborador
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Como creador de la política, usted firmará primero como
                    &quot;Elaboró&quot; ({currentUser?.full_name || currentUser?.username})
                  </p>
                </div>
              </div>
            </div>

            {/* Búsqueda de usuarios */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar usuario por nombre, email o cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Selección de roles */}
            {ROLES_DISPONIBLES.map((rol) => (
              <div key={rol.code} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      {rol.label}
                      {rol.required && (
                        <span className="text-xs text-red-500">*Requerido</span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {rol.description}
                    </p>
                  </div>
                  {selectedFirmantes[rol.code] && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setSelectedFirmantes((prev) => ({
                          ...prev,
                          [rol.code]: null,
                        }))
                      }
                      className="text-red-600 hover:text-red-700"
                    >
                      Quitar
                    </Button>
                  )}
                </div>

                {/* Lista de usuarios para este rol */}
                <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-200 dark:divide-gray-700">
                  {isLoadingUsuarios ? (
                    <div className="p-4 text-center text-gray-500">
                      Cargando usuarios...
                    </div>
                  ) : filteredUsuarios.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No se encontraron usuarios
                    </div>
                  ) : (
                    filteredUsuarios.map((usuario) => {
                      const isSelected = selectedFirmantes[rol.code] === usuario.id;
                      const isCurrentUser = usuario.id === currentUser?.id;

                      return (
                        <button
                          key={usuario.id}
                          onClick={() => handleSelectFirmante(rol.code, usuario.id)}
                          disabled={isCurrentUser}
                          className={`w-full p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                            isSelected
                              ? 'bg-primary-50 dark:bg-primary-900/20'
                              : ''
                          } ${isCurrentUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                {usuario.first_name?.[0] || usuario.username[0]}
                              </span>
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {usuario.full_name ||
                                  `${usuario.first_name} ${usuario.last_name}`.trim() ||
                                  usuario.username}
                                {isCurrentUser && (
                                  <span className="ml-2 text-xs text-gray-500">
                                    (Usted)
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {usuario.cargo?.name || 'Sin cargo'} •{' '}
                                {usuario.email}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: primaryColor }}
                            >
                              <UserCheck className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            ))}

            {/* Alerta si no se han seleccionado todos */}
            {!canConfirm && (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">
                  Debe seleccionar un usuario para cada rol requerido
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <Button variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!canConfirm || isLoading}
              style={{ backgroundColor: primaryColor }}
            >
              {isLoading ? 'Iniciando firma...' : 'Iniciar Proceso de Firma'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FirmantesSelectionModal;
