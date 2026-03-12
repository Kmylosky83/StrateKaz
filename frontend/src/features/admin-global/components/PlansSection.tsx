/**
 * Sección de Planes - Admin Global
 *
 * Gestión de planes de suscripción con precios y límites.
 */
import { useState } from 'react';
import { CreditCard, Plus, Edit, Trash2, Users, HardDrive, Star, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button, ConfirmDialog, BrandedSkeleton } from '@/components/common';
import { usePlans, useDeletePlan } from '../hooks/useAdminGlobal';
import { PlanFormModal } from './PlanFormModal';
import type { Plan } from '../types';

// Colores para los planes
const PLAN_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  basic: {
    bg: 'bg-gray-50 dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    text: 'text-gray-600',
  },
  pro: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-600',
  },
  enterprise: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-600',
  },
};

interface PlanCardProps {
  plan: Plan;
  onEdit: (plan: Plan) => void;
  onDelete: (id: number) => void;
}

const PlanCard = ({ plan, onEdit, onDelete }: PlanCardProps) => {
  const colors = PLAN_COLORS[plan.code] || PLAN_COLORS.basic;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card
        className={`p-6 ${colors.bg} ${colors.border} relative overflow-hidden hover:shadow-md transition-shadow`}
      >
        {/* Default badge */}
        {plan.is_default && (
          <div className="absolute top-4 right-4">
            <Badge variant="warning" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              Por Defecto
            </Badge>
          </div>
        )}

        {/* Header */}
        <div className="mb-4">
          <h3 className={`text-xl font-bold ${colors.text}`}>{plan.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {plan.description || `Plan ${plan.name}`}
          </p>
        </div>

        {/* Pricing */}
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              ${parseFloat(plan.price_monthly).toLocaleString()}
            </span>
            <span className="text-gray-500">/mes</span>
          </div>
          {parseFloat(plan.price_yearly) > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              ${parseFloat(plan.price_yearly).toLocaleString()}/año (ahorra{' '}
              {Math.round(
                (1 - parseFloat(plan.price_yearly) / (parseFloat(plan.price_monthly) * 12)) * 100
              )}
              %)
            </p>
          )}
        </div>

        {/* Features */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {plan.max_users === 0 ? 'Usuarios ilimitados' : `Hasta ${plan.max_users} usuarios`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {plan.max_storage_gb === 0
                ? 'Almacenamiento ilimitado'
                : `${plan.max_storage_gb} GB de almacenamiento`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {plan.tenant_count || 0} empresas con este plan
            </span>
          </div>
        </div>

        {/* Módulos */}
        {plan.features.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Módulos incluidos</p>
            <div className="flex flex-wrap gap-1">
              {plan.features.map((feature) => (
                <Badge key={feature} variant="gray" size="sm">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center justify-between">
          <Badge variant={plan.is_active ? 'success' : 'gray'}>
            {plan.is_active ? 'Activo' : 'Inactivo'}
          </Badge>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(plan)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(plan.id)}
              className="text-danger-500 hover:text-danger-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export const PlansSection = () => {
  const [planToDelete, setPlanToDelete] = useState<number | null>(null);
  const [planToEdit, setPlanToEdit] = useState<Plan | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);

  const { data: plans, isLoading } = usePlans();
  const deletePlan = useDeletePlan();

  const handleOpenNewPlan = () => {
    setPlanToEdit(null);
    setShowFormModal(true);
  };

  const handleEditPlan = (plan: Plan) => {
    setPlanToEdit(plan);
    setShowFormModal(true);
  };

  const handleDelete = () => {
    if (planToDelete) {
      deletePlan.mutate(planToDelete);
      setPlanToDelete(null);
    }
  };

  if (isLoading) {
    return <BrandedSkeleton height="h-96" logoSize="xl" showText />;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {plans?.length || 0} planes configurados
        </p>
        <Button variant="primary" className="flex items-center gap-2" onClick={handleOpenNewPlan}>
          <Plus className="h-4 w-4" />
          Nuevo Plan
        </Button>
      </div>

      {/* Grid de planes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {plans?.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={handleEditPlan}
              onDelete={setPlanToDelete}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {(!plans || plans.length === 0) && (
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No hay planes configurados</p>
          <Button variant="primary" className="mt-4" onClick={handleOpenNewPlan}>
            <Plus className="h-4 w-4 mr-2" />
            Crear primer plan
          </Button>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!planToDelete}
        onClose={() => setPlanToDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar Plan"
        message="¿Estás seguro de que deseas eliminar este plan? Las empresas con este plan deberán ser reasignadas a otro plan."
        confirmText="Eliminar"
        variant="danger"
        isLoading={deletePlan.isPending}
      />

      {/* Plan Form Modal */}
      <PlanFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setPlanToEdit(null);
        }}
        plan={planToEdit}
      />
    </div>
  );
};

export default PlansSection;
