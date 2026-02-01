import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

/**
 * Badge component displays status, categories, or labels with different color variants.
 * It supports light and dark modes and comes in three sizes.
 */
const meta = {
  title: 'Components/Common/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'success', 'warning', 'danger', 'info', 'gray'],
      description: 'Color variant of the badge',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the badge',
    },
    children: {
      control: 'text',
      description: 'Badge content',
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Primary variant - uses the primary color from the theme
 */
export const Primary: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    children: 'Primary',
  },
};

/**
 * Success variant - typically used for positive states
 */
export const Success: Story = {
  args: {
    variant: 'success',
    size: 'md',
    children: 'Activo',
  },
};

/**
 * Warning variant - used for cautionary states
 */
export const Warning: Story = {
  args: {
    variant: 'warning',
    size: 'md',
    children: 'Pendiente',
  },
};

/**
 * Danger variant - used for error or critical states
 */
export const Danger: Story = {
  args: {
    variant: 'danger',
    size: 'md',
    children: 'Error',
  },
};

/**
 * Info variant - used for informational states
 */
export const Info: Story = {
  args: {
    variant: 'info',
    size: 'md',
    children: 'Información',
  },
};

/**
 * Gray variant - neutral color option
 */
export const Gray: Story = {
  args: {
    variant: 'gray',
    size: 'md',
    children: 'Inactivo',
  },
};

/**
 * Small size variant
 */
export const Small: Story = {
  args: {
    variant: 'primary',
    size: 'sm',
    children: 'Pequeño',
  },
};

/**
 * Medium size variant (default)
 */
export const Medium: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    children: 'Mediano',
  },
};

/**
 * Large size variant
 */
export const Large: Story = {
  args: {
    variant: 'primary',
    size: 'lg',
    children: 'Grande',
  },
};

/**
 * All variants displayed together
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="primary">Primary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="gray">Gray</Badge>
    </div>
  ),
};

/**
 * All sizes displayed together
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge size="sm" variant="primary">
        Small
      </Badge>
      <Badge size="md" variant="primary">
        Medium
      </Badge>
      <Badge size="lg" variant="primary">
        Large
      </Badge>
    </div>
  ),
};

/**
 * Real-world usage example with status indicators
 */
export const StatusExample: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32">
          Orden #1234:
        </span>
        <Badge variant="success">Completado</Badge>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32">
          Orden #1235:
        </span>
        <Badge variant="warning">En Proceso</Badge>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32">
          Orden #1236:
        </span>
        <Badge variant="danger">Cancelado</Badge>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32">
          Orden #1237:
        </span>
        <Badge variant="info">Pendiente</Badge>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32">
          Orden #1238:
        </span>
        <Badge variant="gray">Archivado</Badge>
      </div>
    </div>
  ),
};

/**
 * Category badges example
 */
export const CategoryExample: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="primary" size="sm">
        HSEQ
      </Badge>
      <Badge variant="info" size="sm">
        SST
      </Badge>
      <Badge variant="success" size="sm">
        ISO 9001
      </Badge>
      <Badge variant="warning" size="sm">
        Riesgos
      </Badge>
      <Badge variant="danger" size="sm">
        Urgente
      </Badge>
      <Badge variant="gray" size="sm">
        Archivo
      </Badge>
    </div>
  ),
};
