import { ReactNode, isValidElement } from 'react';
import { Button } from './Button';
import { cn } from '@/utils/cn';

interface EmptyStateActionObject {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
}

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  /** Accepts either an action config object or a ReactNode (e.g. <Button>) */
  action?: EmptyStateActionObject | ReactNode;
  className?: string;
}

export const EmptyState = ({ icon, title, description, action, className }: EmptyStateProps) => {
  const renderAction = () => {
    if (!action) return null;

    // If it's a ReactNode (JSX element), render directly
    if (isValidElement(action)) {
      return action;
    }

    // If it's an action config object
    const actionObj = action as EmptyStateActionObject;
    if (actionObj.label && actionObj.onClick) {
      return (
        <Button variant="primary" onClick={actionObj.onClick} leftIcon={actionObj.icon}>
          {actionObj.label}
        </Button>
      );
    }

    return null;
  };

  return (
    <div
      className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}
    >
      {icon && <div className="mb-4 text-gray-400 dark:text-gray-600">{icon}</div>}
      <h3 className="font-heading text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      {description && (
        <p className="font-body text-sm text-gray-600 dark:text-gray-400 max-w-md mb-6">
          {description}
        </p>
      )}
      {renderAction()}
    </div>
  );
};
