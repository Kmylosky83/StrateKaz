import { Fragment, ReactNode } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  divider?: boolean;
}

export interface DropdownProps {
  trigger?: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
  disabled?: boolean;
}

export const Dropdown = ({
  trigger,
  items,
  align = 'right',
  className,
  disabled = false,
}: DropdownProps) => {
  return (
    <Menu as="div" className={cn('relative inline-block text-left', className)}>
      <Menu.Button
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent'
        )}
      >
        {trigger || <MoreVertical className="h-5 w-5" />}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={cn(
            'absolute z-50 mt-2 w-56 origin-top-right rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          <div className="py-1">
            {items.map((item, index) => (
              <Fragment key={index}>
                {item.divider && (
                  <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                )}
                <Menu.Item disabled={item.disabled}>
                  {({ active }) => (
                    <button
                      onClick={item.onClick}
                      disabled={item.disabled}
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors',
                        active && !item.disabled && 'bg-gray-100 dark:bg-gray-700',
                        item.variant === 'danger'
                          ? 'text-danger-600 dark:text-danger-400'
                          : 'text-gray-700 dark:text-gray-300',
                        item.disabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {item.icon && (
                        <span className="flex-shrink-0">{item.icon}</span>
                      )}
                      <span>{item.label}</span>
                    </button>
                  )}
                </Menu.Item>
              </Fragment>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};
