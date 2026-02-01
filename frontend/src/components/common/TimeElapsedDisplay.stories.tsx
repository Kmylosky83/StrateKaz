/**
 * Storybook Stories - TimeElapsedDisplay
 *
 * Documentación visual del componente TimeElapsedDisplay
 */

import type { Meta, StoryObj } from '@storybook/react';
import { TimeElapsedDisplay } from './TimeElapsedDisplay';
import { Building2, Rocket, Trophy, Zap, Heart, Award } from 'lucide-react';

const meta: Meta<typeof TimeElapsedDisplay> = {
  title: 'Components/Common/TimeElapsedDisplay',
  component: TimeElapsedDisplay,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# TimeElapsedDisplay

Componente reutilizable para mostrar tiempo transcurrido en tiempo real desde una fecha inicial.

## Características

- Actualización automática en tiempo real
- Múltiples formatos: long, short, compact
- Granularidades flexibles: años hasta segundos
- 4 variantes visuales: inline, card, badge, hero
- Soporte completo para dark mode
- Animaciones sutiles con Framer Motion
- TypeScript strict
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['inline', 'card', 'badge', 'hero'],
      description: 'Variante visual del componente',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Tamaño del componente',
    },
    format: {
      control: 'select',
      options: ['long', 'short', 'compact'],
      description: 'Formato de salida del tiempo',
    },
    granularities: {
      control: 'check',
      options: ['years', 'months', 'days', 'hours', 'minutes', 'seconds'],
      description: 'Unidades de tiempo a mostrar',
    },
    startDate: {
      control: 'date',
      description: 'Fecha inicial desde la cual calcular',
    },
    updateInterval: {
      control: { type: 'number', min: 500, max: 60000, step: 500 },
      description: 'Intervalo de actualización en milisegundos',
    },
    label: {
      control: 'text',
      description: 'Etiqueta descriptiva',
    },
    showIcon: {
      control: 'boolean',
      description: 'Mostrar icono',
    },
    animate: {
      control: 'boolean',
      description: 'Activar animaciones',
    },
    showBadge: {
      control: 'boolean',
      description: 'Mostrar badge de estado',
    },
    badgeText: {
      control: 'text',
      description: 'Texto del badge',
    },
    showZeros: {
      control: 'boolean',
      description: 'Mostrar valores en cero',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TimeElapsedDisplay>;

// ============================================
// STORIES - VARIANTES
// ============================================

export const Inline: Story = {
  args: {
    startDate: new Date('2020-01-15'),
    variant: 'inline',
    label: 'Operando desde',
    showIcon: true,
    format: 'long',
    granularities: ['years', 'months', 'days'],
    updateInterval: 60000,
  },
};

export const Card: Story = {
  args: {
    startDate: new Date('2020-01-15'),
    variant: 'card',
    size: 'lg',
    label: 'Sistema Activo',
    showIcon: true,
    showBadge: true,
    badgeText: 'En Línea',
    format: 'long',
    granularities: ['years', 'months', 'days'],
    animate: true,
  },
};

export const Badge: Story = {
  args: {
    startDate: new Date('2024-01-01'),
    variant: 'badge',
    format: 'compact',
    granularities: ['days', 'hours'],
    updateInterval: 60000,
    animate: true,
  },
};

export const Hero: Story = {
  args: {
    startDate: new Date('2020-01-15'),
    variant: 'hero',
    label: 'Transformando la Industria desde',
    showIcon: true,
    showBadge: true,
    badgeText: 'Líderes del Sector',
    format: 'long',
    granularities: ['years', 'months'],
    animate: true,
  },
  parameters: {
    layout: 'centered',
  },
};

// ============================================
// STORIES - TAMAÑOS
// ============================================

export const Sizes: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-2">Small</h3>
        <TimeElapsedDisplay
          startDate={new Date('2020-01-15')}
          variant="inline"
          size="sm"
          label="Fundación"
          showIcon
        />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-2">Medium</h3>
        <TimeElapsedDisplay
          startDate={new Date('2020-01-15')}
          variant="inline"
          size="md"
          label="Fundación"
          showIcon
        />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-2">Large</h3>
        <TimeElapsedDisplay
          startDate={new Date('2020-01-15')}
          variant="inline"
          size="lg"
          label="Fundación"
          showIcon
        />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-2">Extra Large</h3>
        <TimeElapsedDisplay
          startDate={new Date('2020-01-15')}
          variant="inline"
          size="xl"
          label="Fundación"
          showIcon
        />
      </div>
    </div>
  ),
};

// ============================================
// STORIES - FORMATOS
// ============================================

export const Formats: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          Long (Completo)
        </h3>
        <TimeElapsedDisplay
          startDate={new Date('2020-01-15')}
          variant="inline"
          format="long"
          granularities={['years', 'months', 'days']}
        />
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          Short (Abreviado)
        </h3>
        <TimeElapsedDisplay
          startDate={new Date('2020-01-15')}
          variant="inline"
          format="short"
          granularities={['years', 'months', 'days']}
        />
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          Compact (Ultra Compacto)
        </h3>
        <TimeElapsedDisplay
          startDate={new Date('2020-01-15')}
          variant="inline"
          format="compact"
          granularities={['years', 'months', 'days']}
        />
      </div>
    </div>
  ),
};

// ============================================
// STORIES - GRANULARIDADES
// ============================================

export const Granularities: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          Solo Años y Meses
        </h3>
        <TimeElapsedDisplay
          startDate={new Date('2020-01-15')}
          variant="inline"
          format="long"
          granularities={['years', 'months']}
          showIcon
        />
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          Años, Meses y Días
        </h3>
        <TimeElapsedDisplay
          startDate={new Date('2020-01-15')}
          variant="inline"
          format="long"
          granularities={['years', 'months', 'days']}
          showIcon
        />
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          Días, Horas, Minutos (Eventos Recientes)
        </h3>
        <TimeElapsedDisplay
          startDate={new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)}
          variant="inline"
          format="long"
          granularities={['days', 'hours', 'minutes']}
          updateInterval={60000}
          showIcon
        />
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          Uptime (con segundos)
        </h3>
        <TimeElapsedDisplay
          startDate={new Date(Date.now() - 3 * 60 * 60 * 1000)}
          variant="inline"
          format="long"
          granularities={['hours', 'minutes', 'seconds']}
          updateInterval={1000}
          showIcon
          animate
        />
      </div>
    </div>
  ),
};

// ============================================
// STORIES - ICONOS PERSONALIZADOS
// ============================================

export const CustomIcons: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <TimeElapsedDisplay
        startDate={new Date('2020-01-15')}
        variant="card"
        label="Fundación"
        icon={<Building2 className="w-5 h-5" />}
        showIcon
        format="long"
        granularities={['years', 'months']}
      />

      <TimeElapsedDisplay
        startDate={new Date('2021-06-20')}
        variant="card"
        label="Proyecto Activo"
        icon={<Rocket className="w-5 h-5" />}
        showIcon
        showBadge
        badgeText="En Curso"
        format="long"
        granularities={['years', 'months']}
      />

      <TimeElapsedDisplay
        startDate={new Date('2022-03-10')}
        variant="card"
        label="Certificación"
        icon={<Trophy className="w-5 h-5" />}
        showIcon
        showBadge
        badgeText="Certificado"
        format="long"
        granularities={['years', 'months']}
      />

      <TimeElapsedDisplay
        startDate={new Date('2024-01-01')}
        variant="card"
        label="Sistema en Línea"
        icon={<Zap className="w-5 h-5" />}
        showIcon
        showBadge
        badgeText="Activo"
        format="short"
        granularities={['days', 'hours']}
      />
    </div>
  ),
};

// ============================================
// STORIES - DASHBOARD EMPRESARIAL
// ============================================

export const DashboardExample: Story = {
  render: () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard Empresarial</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TimeElapsedDisplay
          startDate={new Date('2020-01-15')}
          variant="card"
          size="lg"
          label="Fundación"
          icon={<Building2 className="w-5 h-5" />}
          showIcon
          format="long"
          granularities={['years', 'months']}
        />

        <TimeElapsedDisplay
          startDate={new Date('2021-06-20')}
          variant="card"
          size="lg"
          label="Certificación ISO"
          icon={<Award className="w-5 h-5" />}
          showIcon
          showBadge
          badgeText="Certificado"
          format="long"
          granularities={['years', 'months']}
        />

        <TimeElapsedDisplay
          startDate={new Date('2024-01-01')}
          variant="card"
          size="lg"
          label="Sistema Activo"
          icon={<Zap className="w-5 h-5" />}
          showIcon
          showBadge
          badgeText="En Línea"
          format="short"
          granularities={['days', 'hours']}
          updateInterval={60000}
          animate
        />
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Información de la Empresa</h3>
        <div className="space-y-3">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Empresa: </span>
            <span className="font-medium">Grasas y Huesos del Norte SAS</span>
          </div>
          <div>
            <TimeElapsedDisplay
              startDate={new Date('2020-01-15')}
              variant="inline"
              size="md"
              label="Operando desde"
              icon={<Heart className="w-4 h-4" />}
              showIcon
              format="long"
              granularities={['years', 'months', 'days']}
            />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};

// ============================================
// STORIES - NAVBAR
// ============================================

export const NavbarExample: Story = {
  render: () => (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b shadow-sm">
      <h1 className="text-xl font-bold">Dashboard</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">Sistema activo:</span>
        <TimeElapsedDisplay
          startDate={new Date('2024-01-01')}
          variant="badge"
          format="compact"
          granularities={['days', 'hours']}
          updateInterval={60000}
          animate
        />
      </div>
    </div>
  ),
};

// ============================================
// STORIES - DARK MODE
// ============================================

export const DarkMode: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Light Mode */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Light Mode</h3>
        <div className="space-y-4">
          <TimeElapsedDisplay
            startDate={new Date('2020-01-15')}
            variant="inline"
            label="Inline"
            showIcon
            format="long"
            granularities={['years', 'months']}
          />
          <TimeElapsedDisplay
            startDate={new Date('2020-01-15')}
            variant="card"
            label="Card"
            showIcon
            showBadge
            badgeText="Activo"
            format="long"
            granularities={['years', 'months']}
          />
          <TimeElapsedDisplay
            startDate={new Date('2024-01-01')}
            variant="badge"
            format="compact"
            granularities={['days', 'hours']}
          />
        </div>
      </div>

      {/* Dark Mode */}
      <div className="p-6 bg-gray-900 rounded-lg shadow dark">
        <h3 className="text-lg font-semibold mb-4 text-white">Dark Mode</h3>
        <div className="space-y-4">
          <TimeElapsedDisplay
            startDate={new Date('2020-01-15')}
            variant="inline"
            label="Inline"
            showIcon
            format="long"
            granularities={['years', 'months']}
          />
          <TimeElapsedDisplay
            startDate={new Date('2020-01-15')}
            variant="card"
            label="Card"
            showIcon
            showBadge
            badgeText="Activo"
            format="long"
            granularities={['years', 'months']}
          />
          <TimeElapsedDisplay
            startDate={new Date('2024-01-01')}
            variant="badge"
            format="compact"
            granularities={['days', 'hours']}
          />
        </div>
      </div>
    </div>
  ),
};

// ============================================
// STORIES - PLAYGROUND
// ============================================

export const Playground: Story = {
  args: {
    startDate: new Date('2020-01-15'),
    variant: 'card',
    size: 'md',
    label: 'Tiempo Transcurrido',
    showIcon: true,
    showBadge: true,
    badgeText: 'Activo',
    format: 'long',
    granularities: ['years', 'months', 'days'],
    updateInterval: 60000,
    animate: true,
    showZeros: false,
  },
};
