import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Pencil, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/common/Button';

interface CustomAction {
    key: string;
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    disabled?: boolean;
}

interface ActionButtonsProps {
    module: string;
    section: string;
    onEdit?: () => void;
    onDelete?: () => void;
    onView?: () => void;
    customActions?: CustomAction[];
    layout?: 'row' | 'dropdown'; // Future support for dropdown layout
    size?: 'sm' | 'md';
}

/**
 * ActionButtons - Componente estandarizado para botones de acción RBAC
 * 
 * Renderiza automáticamente los botones según los permisos del usuario de forma granular.
 * Utiliza el componente Button del Design System.
 * 
 * @example
 * <ActionButtons 
 *   module={Modules.GESTION_ESTRATEGICA} // Usar constantes siempre
 *   section={Sections.POLITICAS}
 *   onEdit={() => handleEdit(item)}
 *   onDelete={() => handleDelete(item)}
 * />
 */
export const ActionButtons: React.FC<ActionButtonsProps> = ({
    module,
    section,
    onEdit,
    onDelete,
    onView,
    customActions = [],
    layout = 'row',
    size = 'md'
}) => {
    const { canDo } = usePermissions();

    const iconSize = size === 'sm' ? 14 : 16;
    // Clases para simular IconButton usando el componente Button base
    // Overrides de padding para hacerlo cuadrado/circular
    const iconBtnClass = "p-0 w-8 h-8 rounded-full flex items-center justify-center";

    return (
        <div className="flex items-center gap-1">
            {onView && canDo(module, section, 'view') && (
                <Button
                    variant="ghost"
                    onClick={onView}
                    className={`${iconBtnClass} text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20`}
                    title="Ver detalle"
                >
                    <Eye size={iconSize} />
                </Button>
            )}

            {onEdit && canDo(module, section, 'edit') && (
                <Button
                    variant="ghost"
                    onClick={onEdit}
                    className={`${iconBtnClass} text-gray-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20`}
                    title="Editar"
                >
                    <Pencil size={iconSize} />
                </Button>
            )}

            {customActions.map(action => (
                <Button
                    key={action.key}
                    variant={action.variant || 'ghost'}
                    onClick={action.onClick}
                    className={`${iconBtnClass} text-gray-500 hover:text-indigo-600`}
                    title={action.label}
                    disabled={action.disabled}
                >
                    {action.icon || <span>{action.label}</span>}
                </Button>
            ))}

            {onDelete && canDo(module, section, 'delete') && (
                <Button
                    variant="ghost"
                    onClick={onDelete}
                    className={`${iconBtnClass} text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20`}
                    title="Eliminar"
                >
                    <Trash2 size={iconSize} />
                </Button>
            )}
        </div>
    );
};
