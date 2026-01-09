/**
 * RolesPermisosWrapper - Wrapper para gestión RBAC híbrido
 *
 * IMPORTANTE: Renombrado de RolesTab → RolesPermisosWrapper para evitar
 * conflicto de nombres con configuracion/RolesTab.tsx (componente legacy).
 *
 * Contiene 4 subtabs:
 * - Acceso a Secciones: Matriz de permisos de visibilidad por cargo (qué módulos/tabs/secciones puede ver)
 * - Permisos por Cargo: Gestión de permisos directos de cargos (68 acciones CRUD)
 * - Roles Adicionales: CRUD de roles adicionales + asignación a usuarios
 * - Todos los Permisos: Vista de referencia de los 68 permisos del sistema
 */
import { useState } from 'react';
import { Shield, Users, List, Layers } from 'lucide-react';
import { Tabs } from '@/components/common/Tabs';
import { MatrizPermisosSection } from '../matriz-permisos';
import { PermisosCargoSubTab } from './PermisosCargoSubTab';
import { RolesAdicionalesSubTab } from './RolesAdicionalesSubTab';
import { TodosPermisosSubTab } from './TodosPermisosSubTab';

type SubTab = 'acceso-secciones' | 'permisos-cargo' | 'roles-adicionales' | 'todos-permisos';

export const RolesPermisosWrapper = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('acceso-secciones');

  const subTabs = [
    {
      id: 'acceso-secciones' as SubTab,
      label: 'Acceso a Secciones',
      icon: <Layers className="h-4 w-4" />,
    },
    {
      id: 'permisos-cargo' as SubTab,
      label: 'Permisos de Acciones',
      icon: <Shield className="h-4 w-4" />,
    },
    {
      id: 'roles-adicionales' as SubTab,
      label: 'Roles Adicionales',
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: 'todos-permisos' as SubTab,
      label: 'Catálogo de Permisos',
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
        {activeSubTab === 'acceso-secciones' && <MatrizPermisosSection />}
        {activeSubTab === 'permisos-cargo' && <PermisosCargoSubTab />}
        {activeSubTab === 'roles-adicionales' && <RolesAdicionalesSubTab />}
        {activeSubTab === 'todos-permisos' && <TodosPermisosSubTab />}
      </div>
    </div>
  );
};
