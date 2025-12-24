import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { Plus, Save, Trash2, Download, ChevronRight } from 'lucide-react';

/**
 * Button component with multiple variants, sizes, and icon support.
 * Includes loading states and full accessibility support.
 */
const meta = {
  title: 'Components/Common/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'ghost', 'outline'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
    },
    isLoading: {
      control: 'boolean',
      description: 'Show loading spinner',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable button interaction',
    },
    children: {
      control: 'text',
      description: 'Button text content',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Primary button - main call-to-action
 */
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

/**
 * Secondary button - less prominent actions
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

/**
 * Danger button - destructive actions
 */
export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Delete',
  },
};

/**
 * Ghost button - minimal styling
 */
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

/**
 * Outline button - bordered style
 */
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};

/**
 * Small size variant
 */
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
};

/**
 * Medium size variant (default)
 */
export const Medium: Story = {
  args: {
    size: 'md',
    children: 'Medium Button',
  },
};

/**
 * Large size variant
 */
export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    isLoading: true,
    children: 'Loading...',
  },
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

/**
 * Button with left icon
 */
export const WithLeftIcon: Story = {
  args: {
    leftIcon: <Plus className="h-5 w-5" />,
    children: 'Crear Nuevo',
  },
};

/**
 * Button with right icon
 */
export const WithRightIcon: Story = {
  args: {
    rightIcon: <ChevronRight className="h-5 w-5" />,
    children: 'Siguiente',
  },
};

/**
 * Icon-only button
 */
export const IconOnly: Story = {
  args: {
    leftIcon: <Download className="h-5 w-5" />,
    children: '',
    size: 'md',
  },
};

/**
 * All variants displayed together
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="outline">Outline</Button>
    </div>
  ),
};

/**
 * All sizes displayed together
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

/**
 * Real-world action buttons example
 */
export const ActionButtons: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Button variant="primary" leftIcon={<Save className="h-5 w-5" />}>
          Guardar
        </Button>
        <Button variant="secondary">Cancelar</Button>
      </div>
      <div className="flex gap-3">
        <Button variant="primary" leftIcon={<Plus className="h-5 w-5" />}>
          Crear Orden
        </Button>
        <Button variant="outline" leftIcon={<Download className="h-5 w-5" />}>
          Exportar
        </Button>
      </div>
      <div className="flex gap-3">
        <Button variant="danger" leftIcon={<Trash2 className="h-5 w-5" />} size="sm">
          Eliminar
        </Button>
        <Button variant="ghost" size="sm">
          Ver Detalles
        </Button>
      </div>
    </div>
  ),
};

/**
 * Loading states demonstration
 */
export const LoadingStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="primary" isLoading>
        Guardando...
      </Button>
      <Button variant="secondary" isLoading>
        Procesando...
      </Button>
      <Button variant="danger" isLoading>
        Eliminando...
      </Button>
    </div>
  ),
};

/**
 * Form actions example
 */
export const FormActions: Story = {
  render: () => (
    <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Crear Nuevo Registro
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            placeholder="Ingrese el nombre"
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost">Cancelar</Button>
          <Button variant="primary" leftIcon={<Save className="h-5 w-5" />}>
            Guardar
          </Button>
        </div>
      </div>
    </div>
  ),
};

/**
 * Button group with mixed variants
 */
export const ButtonGroup: Story = {
  render: () => (
    <div className="inline-flex rounded-lg shadow-sm" role="group">
      <Button
        variant="outline"
        className="rounded-r-none border-r-0"
        leftIcon={<Plus className="h-5 w-5" />}
      >
        Nuevo
      </Button>
      <Button variant="outline" className="rounded-none border-r-0">
        Editar
      </Button>
      <Button
        variant="outline"
        className="rounded-l-none"
        leftIcon={<Trash2 className="h-5 w-5" />}
      >
        Eliminar
      </Button>
    </div>
  ),
};
