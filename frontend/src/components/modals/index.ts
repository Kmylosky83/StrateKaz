/**
 * Sistema de Modales Estandarizado - Design System
 *
 * Este módulo exporta todos los componentes de modales del sistema.
 *
 * Tipos de modales disponibles:
 * - BaseModal: Modal base con Framer Motion (usar para casos personalizados)
 * - FormModal: Para formularios con React Hook Form
 * - ConfirmModal: Para confirmaciones de acciones
 * - DetailModal: Para visualización de detalles (solo lectura)
 * - WizardModal: Para flujos multi-paso
 * - AlertModal: Para notificaciones importantes
 *
 * Hooks disponibles:
 * - useModal: Controlar un modal simple
 * - useModals: Controlar múltiples modales
 * - useConfirm: Confirmaciones programáticas
 * - useDeleteConfirm: Confirmaciones de eliminación
 * - useStatusChangeConfirm: Confirmaciones de cambio de estado
 *
 * @example
 * ```tsx
 * import {
 *   BaseModal,
 *   FormModal,
 *   ConfirmModal,
 *   DetailModal,
 *   WizardModal,
 *   AlertModal,
 *   useModal,
 *   useConfirm,
 * } from '@/components/modals';
 * ```
 */

// Modal Components
export { BaseModal } from './BaseModal';
export type { BaseModalProps, ModalSize } from './BaseModal';

export { FormModal } from './FormModal';
export type { FormModalProps } from './FormModal';

export { ConfirmModal } from './ConfirmModal';
export type { ConfirmModalProps, ConfirmVariant } from './ConfirmModal';

export { DetailModal, DetailSection, DetailField, DetailGrid, DetailBadge } from './DetailModal';
export type { DetailModalProps } from './DetailModal';

export { WizardModal } from './WizardModal';
export type { WizardModalProps, WizardStep } from './WizardModal';

export { AlertModal } from './AlertModal';
export type { AlertModalProps, AlertVariant } from './AlertModal';

// Hooks
export { useModal, useModals } from './useModal';
export { useConfirm, useDeleteConfirm, useStatusChangeConfirm } from './useConfirm';
