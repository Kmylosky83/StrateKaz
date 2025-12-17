/**
 * useModal - Hook para manejar estado de modales
 *
 * Proporciona una forma sencilla de controlar la apertura/cierre
 * de modales y pasar datos al modal.
 */
import { useState, useCallback } from 'react';

interface UseModalReturn<T = undefined> {
  /** Si el modal está abierto */
  isOpen: boolean;
  /** Datos pasados al modal */
  data: T | undefined;
  /** Abrir el modal (opcionalmente con datos) */
  open: (data?: T) => void;
  /** Cerrar el modal */
  close: () => void;
  /** Toggle del modal */
  toggle: () => void;
  /** Actualizar datos sin cambiar estado */
  setData: (data: T) => void;
}

/**
 * Hook para controlar el estado de un modal
 *
 * @example
 * // Modal simple sin datos
 * const modal = useModal();
 * <Button onClick={modal.open}>Abrir</Button>
 * <Modal isOpen={modal.isOpen} onClose={modal.close} />
 *
 * @example
 * // Modal con datos tipados
 * const editModal = useModal<User>();
 * <Button onClick={() => editModal.open(user)}>Editar</Button>
 * <EditModal
 *   isOpen={editModal.isOpen}
 *   onClose={editModal.close}
 *   user={editModal.data}
 * />
 */
export function useModal<T = undefined>(): UseModalReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | undefined>(undefined);

  const open = useCallback((newData?: T) => {
    setData(newData);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Limpiar datos después de la animación de salida
    setTimeout(() => {
      setData(undefined);
    }, 200);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
    setData,
  };
}

/**
 * Hook para manejar múltiples modales
 *
 * @example
 * const modals = useModals(['create', 'edit', 'delete'] as const);
 *
 * modals.open('create');
 * modals.open('edit', userData);
 *
 * <CreateModal isOpen={modals.isOpen('create')} onClose={modals.close} />
 * <EditModal isOpen={modals.isOpen('edit')} onClose={modals.close} data={modals.data} />
 */
export function useModals<K extends string, T = unknown>(
  keys: readonly K[]
): {
  /** Modal actualmente abierto */
  activeModal: K | null;
  /** Datos del modal activo */
  data: T | undefined;
  /** Verificar si un modal específico está abierto */
  isOpen: (key: K) => boolean;
  /** Abrir un modal específico */
  open: (key: K, data?: T) => void;
  /** Cerrar el modal activo */
  close: () => void;
  /** Cerrar todos los modales */
  closeAll: () => void;
} {
  const [activeModal, setActiveModal] = useState<K | null>(null);
  const [data, setData] = useState<T | undefined>(undefined);

  const isOpen = useCallback(
    (key: K) => activeModal === key,
    [activeModal]
  );

  const open = useCallback((key: K, newData?: T) => {
    setData(newData);
    setActiveModal(key);
  }, []);

  const close = useCallback(() => {
    setActiveModal(null);
    setTimeout(() => {
      setData(undefined);
    }, 200);
  }, []);

  const closeAll = useCallback(() => {
    setActiveModal(null);
    setData(undefined);
  }, []);

  return {
    activeModal,
    data,
    isOpen,
    open,
    close,
    closeAll,
  };
}
