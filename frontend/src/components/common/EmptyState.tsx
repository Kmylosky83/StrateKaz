import { ReactNode } from 'react';
import { Button } from './Button';
import { cn } from '@/utils/cn';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  className?: string;
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-gray-400 dark:text-gray-600">
          {icon}
        </div>
      )}
      <h3 className="font-heading text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      {description && (
        <p className="font-body text-sm text-gray-600 dark:text-gray-400 max-w-md mb-6">
          {description}
        </p>
      )}
      {action && (
        <Button
          variant="primary"
          onClick={action.onClick}
          leftIcon={action.icon}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};
