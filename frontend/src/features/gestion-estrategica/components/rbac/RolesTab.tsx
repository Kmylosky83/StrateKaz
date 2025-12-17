/**
 * RolesTab - Tab principal para gestión RBAC híbrido
 *
 * Contiene 3 subtabs:
 * - Permisos por Cargo: Gestión de permisos directos de cargos
 * - Roles Adicionales: CRUD de roles adicionales + asignación a usuarios
 * - Todos los Permisos: Vista de referencia de los 68 permisos del sistema
 */
import { useState } from 'react';
import { Shield, Users, List } from 'lucide-react';
import { Tabs } from '@/components/common/Tabs';
import { PermisosCargoSubTab } from './PermisosCargoSubTab';
import { RolesAdicionalesSubTab } from './RolesAdicionalesSubTab';
import { TodosPermisosSubTab } from './TodosPermisosSubTab';

type SubTab = 'permisos-cargo' | 'roles-adicionales' | 'todos-permisos';

export const RolesTab = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('permisos-cargo');

  const subTabs = [
    {
      id: 'permisos-cargo' as SubTab,
      label: 'Permisos por Cargo',
      icon: <Shield className="h-4 w-4" />,
    },
    {
      id: 'roles-adicionales' as SubTab,
      label: 'Roles Adicionales',
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: 'todos-permisos' as SubTab,
      label: 'Todos los Permisos',
      icon: <List className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <Tabs
        tabs={subTabs}
        activeTab={activeSubTab}
        onChange={(id) => setActiveSubTab(id as SubTab)}
        variant="pills"
      />

      {/* Contenido por subtab */}
      <div className="mt-6">
        {activeSubTab === 'permisos-cargo' && <PermisosCargoSubTab />}
        {activeSubTab === 'roles-adicionales' && <RolesAdicionalesSubTab />}
        {activeSubTab === 'todos-permisos' && <TodosPermisosSubTab />}
      </div>
    </div>
  );
};
