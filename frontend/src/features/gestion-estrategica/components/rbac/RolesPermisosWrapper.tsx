/**
 * RolesPermisosWrapper - Vista de referencia del sistema RBAC
 *
 * Contiene 3 subtabs para consulta y gestión masiva:
 * - Matriz de Accesos: Vista global de accesos a secciones por cargo
 * - Matriz de Permisos: Vista global de permisos de acciones por cargo
 * - Catálogo de Permisos: Referencia de los 68 permisos del sistema
 *
 * NOTA: La configuración individual de accesos y permisos por cargo
 * se realiza desde Configuración > Cargos > Modal de Cargo (tabs 5 y 6)
 *
 * Los Roles Adicionales se gestionan desde Talento Humano > Roles Adicionales
 */
import { useState } from 'react';
import { Shield, List, Layers } from 'lucide-react';
import { Tabs } from '@/components/common/Tabs';
import { MatrizPermisosSection } from '../matriz-permisos';
import { PermisosCargoSubTab } from './PermisosCargoSubTab';
import { TodosPermisosSubTab } from './TodosPermisosSubTab';

type SubTab = 'acceso-secciones' | 'permisos-cargo' | 'todos-permisos';

export const RolesPermisosWrapper = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('acceso-secciones');

  const subTabs = [
    {
      id: 'acceso-secciones' as SubTab,
      label: 'Matriz de Accesos',
      icon: <Layers className="h-4 w-4" />,
    },
    {
      id: 'permisos-cargo' as SubTab,
      label: 'Matriz de Permisos',
      icon: <Shield className="h-4 w-4" />,
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
        {activeSubTab === 'todos-permisos' && <TodosPermisosSubTab />}
      </div>
    </div>
  );
};
