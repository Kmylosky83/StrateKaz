/**
 * Hook genérico para manejar el estado de modales de formulario
 *
 * Proporciona un patrón consistente para manejar modales CRUD con dos modos:
 * - create: Modal en modo creación (data = null)
 * - edit: Modal en modo edición (data contiene el item a editar)
 *
 * @example
 * ```tsx
 * const { isOpen, mode, data, openCreate, openEdit, close, isEditing } = useFormModal<Area>();
 *
 * <Button onClick={openCreate}>Nuevo</Button>
 * <Button onClick={() => openEdit(area)}>Editar</Button>
 *
 * <AreaFormModal
 *   isOpen={isOpen}
 *   onClose={close}
 *   area={data}
 * />
 * ```
 *
 * @see REFACTORING-PLAN.md - Fase 1.3 Hooks Genéricos
 */
import { useState, useCallback } from 'react';

interface FormModalState<T> {
  isOpen: boolean;
  mode: 'create' | 'edit';
  data: T | null;
}

interface UseFormModalReturn<T> {
  isOpen: boolean;
  mode: 'create' | 'edit';
  data: T | null;
  openCreate: () => void;
  openEdit: (data: T) => void;
  close: () => void;
  isEditing: boolean;
}

export function useFormModal<T = unknown>(): UseFormModalReturn<T> {
  const [state, setState] = useState<FormModalState<T>>({
    isOpen: false,
    mode: 'create',
    data: null,
  });

  const openCreate = useCallback(() => {
    setState({
      isOpen: true,
      mode: 'create',
      data: null,
    });
  }, []);

  const openEdit = useCallback((data: T) => {
    setState({
      isOpen: true,
      mode: 'edit',
      data,
    });
  }, []);

  const close = useCallback(() => {
    setState({
      isOpen: false,
      mode: 'create',
      data: null,
    });
  }, []);

  return {
    isOpen: state.isOpen,
    mode: state.mode,
    data: state.data,
    openCreate,
    openEdit,
    close,
    isEditing: state.mode === 'edit',
  };
}

/**
 * Hook alternativo con nombres abreviados
 */
export function useModal<T = unknown>() {
  const { openCreate, openEdit, ...rest } = useFormModal<T>();

  return {
    ...rest,
    create: openCreate,
    edit: openEdit,
  };
}
