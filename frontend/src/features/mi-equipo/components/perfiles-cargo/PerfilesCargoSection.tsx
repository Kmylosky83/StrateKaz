/**
 * PerfilesCargoSection — Lista de cargos para editar perfil (Requisitos + SST)
 * REORG-B2: Talent Hub gestiona perfiles de cargo (requisitos, competencias, SST).
 * Vista 2B: SectionToolbar + Table
 */
import { useState, useMemo } from 'react';
import { Briefcase, Pencil, Search } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Alert, BrandedSkeleton } from '@/components/common';
import { DataSection } from '@/components/data-display';
import { DataTableCard } from '@/components/layout';
import { ResponsiveTable } from '@/components/common/ResponsiveTable';
import type { ResponsiveTableColumn } from '@/components/common/ResponsiveTable';
import { usePermissions, useModuleColor } from '@/hooks';
import { Modules, Sections } from '@/constants/permissions';
import { getModuleColorClasses } from '@/utils/moduleColors';
import type { ModuleColor } from '@/utils/moduleColors';
import { useCargos } from '@/features/configuracion/hooks/useCargos';
import { CargoLevelBadge } from '../shared/CargoLevelBadge';
import type { CargoList } from '@/features/configuracion/types/rbac.types';
import { CargoPerfilModal } from './CargoPerfilModal';

export const PerfilesCargoSection = () => {
  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor as ModuleColor);

  const [selectedCargo, setSelectedCargo] = useState<CargoList | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // RBAC
  const { canDo } = usePermissions();
  const canEdit = canDo(Modules.TALENT_HUB, Sections.PERFILES_CARGO, 'edit');

  // Data
  const {
    data: cargosData,
    isLoading,
    error,
  } = useCargos({ include_inactive: false, page_size: 200 });
  const items = useMemo(() => {
    const all = cargosData?.results?.filter((c) => !c.is_system) || [];
    if (!searchQuery) return all;
    const lower = searchQuery.toLowerCase();
    return all.filter(
      (c) => c.name.toLowerCase().includes(lower) || c.code?.toLowerCase().includes(lower)
    );
  }, [cargosData, searchQuery]);

  const handleEdit = (cargo: CargoList) => {
    setSelectedCargo(cargo);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCargo(null);
  };

  const columns: ResponsiveTableColumn<CargoList & Record<string, unknown>>[] = [
    {
      key: 'name',
      header: 'Cargo',
      priority: 1,
      render: (row) => {
        const c = row as unknown as CargoList;
        return (
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{c.code}</p>
          </div>
        );
      },
    },
    {
      key: 'nivel',
      header: 'Nivel',
      priority: 2,
      render: (row) => {
        const c = row as unknown as CargoList;
        return <CargoLevelBadge level={c.nivel_jerarquico} />;
      },
    },
    {
      key: 'area',
      header: 'Proceso',
      hideOnTablet: true,
      render: (row) => {
        const c = row as unknown as CargoList;
        return (
          <span className="text-sm text-gray-600 dark:text-gray-400">{c.area_nombre || '—'}</span>
        );
      },
    },
    {
      key: 'usuarios',
      header: 'Usuarios',
      priority: 3,
      render: (row) => {
        const c = row as unknown as CargoList;
        return (
          <Badge variant={c.users_count > 0 ? 'success' : 'secondary'} size="sm">
            {c.users_count}
          </Badge>
        );
      },
    },
    {
      key: 'acciones',
      header: '',
      priority: 1,
      render: (row) => {
        const c = row as unknown as CargoList;
        return (
          <div className="flex justify-end">
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(c)}
                className="p-2 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                title="Editar Perfil"
              >
                <Pencil className="h-4 w-4 text-gray-500 hover:text-violet-600" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return <BrandedSkeleton height="h-80" logoSize="xl" showText />;
  }

  if (error) {
    return (
      <Alert variant="error" message="Error al cargar los cargos. Por favor, intente nuevamente." />
    );
  }

  return (
    <div className="space-y-6">
      <DataSection
        icon={Briefcase}
        iconBgClass={colorClasses.badge}
        iconClass={colorClasses.icon}
        title="Perfiles de Cargo"
        description="Requisitos de formación, competencias, experiencia y SST por cargo"
      />

      {/* Búsqueda */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar cargo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <DataTableCard
        isEmpty={items.length === 0}
        isLoading={false}
        emptyMessage="No hay cargos registrados. Los cargos se crean desde Fundación → Mi Organización → Cargos."
      >
        {items.length > 0 && (
          <ResponsiveTable
            columns={columns}
            data={items as (CargoList & Record<string, unknown>)[]}
            keyExtractor={(item) => item.id as number}
          />
        )}
      </DataTableCard>

      <CargoPerfilModal cargo={selectedCargo} isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
};
