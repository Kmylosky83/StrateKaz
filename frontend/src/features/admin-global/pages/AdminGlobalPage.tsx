/**
 * Admin Global Page - Panel de Superusuarios
 *
 * Dashboard principal para gestión de:
 * - Empresas (Tenants)
 * - Planes de Suscripción
 * - Usuarios Globales
 *
 * NOTA: La sección "Módulos" fue eliminada porque:
 * - Los módulos se asignan por tenant en TenantFormModal (enabled_modules)
 * - La activación granular se hace dentro de cada tenant (ConfiguracionTab)
 *
 * Solo visible para superusuarios (is_superuser=true)
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  CreditCard,
  AlertTriangle,
  Shield,
  Globe,
  type LucideIcon,
} from 'lucide-react';
import { StatsGrid, StatsGridSkeleton } from '@/components/layout';
import { Card, Badge } from '@/components/common';
import { useTenantsStats, useTenantUsersStats, usePlansStats } from '../hooks/useAdminGlobal';
import { TenantsSection } from '../components/TenantsSection';
import { PlansSection } from '../components/PlansSection';
import { UsersGlobalSection } from '../components/UsersGlobalSection';
import type { StatItem } from '@/components/layout';

// Secciones del Admin Global
interface AdminSection {
  code: string;
  name: string;
  description: string;
  icon: LucideIcon;
}

const ADMIN_SECTIONS: AdminSection[] = [
  {
    code: 'empresas',
    name: 'Empresas',
    description: 'Gestión de tenants, subdominios y configuración de empresas',
    icon: Building2,
  },
  {
    code: 'planes',
    name: 'Planes',
    description: 'Planes de suscripción, límites y precios',
    icon: CreditCard,
  },
  {
    code: 'usuarios',
    name: 'Usuarios Globales',
    description: 'Usuarios con acceso multi-tenant y superadministradores',
    icon: Users,
  },
];

// Mapeo de secciones a componentes
const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  empresas: TenantsSection,
  planes: PlansSection,
  usuarios: UsersGlobalSection,
};

export const AdminGlobalPage = () => {
  const [activeSection, setActiveSection] = useState('empresas');

  // Stats queries
  const { data: tenantsStats, isLoading: loadingTenantsStats } = useTenantsStats();
  const { data: usersStats, isLoading: loadingUsersStats } = useTenantUsersStats();
  const { data: plansStats, isLoading: loadingPlansStats } = usePlansStats();

  const isStatsLoading = loadingTenantsStats || loadingUsersStats || loadingPlansStats;

  // Stats para el grid principal
  const statsItems: StatItem[] = [
    {
      label: 'Empresas Activas',
      value: tenantsStats?.active ?? 0,
      icon: Building2,
      iconColor: 'success',
      description: `${tenantsStats?.total ?? 0} total`,
    },
    {
      label: 'Por Vencer',
      value: tenantsStats?.expiring_soon ?? 0,
      icon: AlertTriangle,
      iconColor: 'warning',
      description: 'Próximos 30 días',
    },
    {
      label: 'Usuarios Globales',
      value: usersStats?.active ?? 0,
      icon: Users,
      iconColor: 'info',
      description: `${usersStats?.superadmins ?? 0} superadmins`,
    },
    {
      label: 'Multi-Tenant',
      value: usersStats?.multi_tenant ?? 0,
      icon: Globe,
      iconColor: 'purple',
      description: 'Usuarios en múltiples empresas',
    },
  ];

  // Sección activa data
  const activeSectionData = ADMIN_SECTIONS.find((s) => s.code === activeSection);
  const ActiveComponent = SECTION_COMPONENTS[activeSection];

  return (
    <div className="space-y-6">
      {/* Header con badge de Superadmin */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Administración Global
            </h1>
            <Badge variant="purple" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Superadmin
            </Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Panel de control para gestión de la plataforma multi-tenant
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      {isStatsLoading ? (
        <StatsGridSkeleton count={4} />
      ) : (
        <StatsGrid stats={statsItems} columns={4} moduleColor="purple" />
      )}

      {/* Navigation Tabs */}
      <Card className="p-1">
        <div className="flex gap-1">
          {ADMIN_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.code;

            return (
              <button
                key={section.code}
                onClick={() => setActiveSection(section.code)}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                  text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : ''}`} />
                <span className="hidden sm:inline">{section.name}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Section Header */}
      {activeSectionData && (
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <activeSectionData.icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {activeSectionData.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {activeSectionData.description}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Active Section Content */}
      {ActiveComponent && (
        <motion.div
          key={`content-${activeSection}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <ActiveComponent />
        </motion.div>
      )}
    </div>
  );
};

export default AdminGlobalPage;
