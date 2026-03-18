/**
 * Página: Configuración de Plataforma
 *
 * DEBUG: Versión diagnóstico — renderiza por fases para aislar React #31.
 * Cada fase agrega complejidad. Si una fase crashea, ahí está el bug.
 */
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

// ── Fase 1: Solo hooks básicos ──
export const ConfiguracionAdminPage = () => {
  const location = useLocation();
  const tabCode = location.pathname.split('/').pop() || 'general';
  const [phase, setPhase] = useState(1);

  // Fase 1: HTML puro — si esto crashea, el bug está en el layout/route
  if (phase === 1) {
    return (
      <div style={{ padding: 20, fontFamily: 'monospace' }}>
        <h2 style={{ color: '#333' }}>DIAGNÓSTICO — Configuración Admin</h2>
        <p>
          Tab activo: <strong>{tabCode}</strong>
        </p>
        <p>
          Fase actual: <strong>{phase}</strong>
        </p>
        <hr />
        <p style={{ color: 'green' }}>Fase 1 OK: HTML puro renderiza correctamente</p>
        <br />
        <button
          onClick={() => setPhase(2)}
          style={{
            padding: '8px 16px',
            background: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            marginRight: 8,
          }}
        >
          Fase 2: Probar hooks (usePageSections)
        </button>
        <button
          onClick={() => setPhase(3)}
          style={{
            padding: '8px 16px',
            background: '#10B981',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            marginRight: 8,
          }}
        >
          Fase 3: Probar PageHeader
        </button>
        <button
          onClick={() => setPhase(4)}
          style={{
            padding: '8px 16px',
            background: '#F59E0B',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            marginRight: 8,
          }}
        >
          Fase 4: Probar ConfigAdminTab
        </button>
        <button
          onClick={() => setPhase(5)}
          style={{
            padding: '8px 16px',
            background: '#8B5CF6',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Fase 5: TODO junto
        </button>
      </div>
    );
  }

  // Fases 2-5: imports dinámicos para aislar
  return <PhaseRouter phase={phase} tabCode={tabCode} onBack={() => setPhase(1)} />;
};

// ── Phase Router (lazy imports para aislar crashes) ──
import { PageHeader } from '@/components/layout';
import { useModuleColor } from '@/hooks/useModuleColor';
import { usePageSections } from '@/hooks/usePageSections';
import { ConfigAdminTab } from '../components/ConfigAdminTab';

const MODULE_CODE = 'configuracion_plataforma';

const TAB_TITLES: Record<string, string> = {
  general: 'Configuración General',
  catalogos: 'Catálogos Maestros',
  conexiones: 'Conexiones e Integraciones',
};

const PhaseRouter = ({
  phase,
  tabCode,
  onBack,
}: {
  phase: number;
  tabCode: string;
  onBack: () => void;
}) => {
  const { sections, activeSection, setActiveSection, activeSectionData, isLoading } =
    usePageSections({ moduleCode: MODULE_CODE, tabCode });

  const { color: moduleColor } = useModuleColor('configuracion_plataforma');

  const backBtn = (
    <button
      onClick={onBack}
      style={{
        padding: '4px 12px',
        background: '#EF4444',
        color: 'white',
        border: 'none',
        borderRadius: 4,
        cursor: 'pointer',
        marginBottom: 12,
      }}
    >
      Volver a Fase 1
    </button>
  );

  // Fase 2: Solo hooks — mostrar datos raw
  if (phase === 2) {
    return (
      <div style={{ padding: 20, fontFamily: 'monospace' }}>
        {backBtn}
        <h2>Fase 2: Hooks</h2>
        <p>
          isLoading: <strong>{String(isLoading)}</strong>
        </p>
        <p>
          sections count: <strong>{sections.length}</strong>
        </p>
        <p>
          activeSection: <strong>{activeSection || '(vacío)'}</strong>
        </p>
        <p>
          moduleColor: <strong>{moduleColor}</strong>
        </p>
        <hr />
        <h3>Sections raw data:</h3>
        <pre
          style={{
            background: '#f3f4f6',
            padding: 12,
            borderRadius: 4,
            fontSize: 11,
            maxHeight: 400,
            overflow: 'auto',
          }}
        >
          {JSON.stringify(sections, null, 2)}
        </pre>
        <h3>activeSectionData:</h3>
        <pre style={{ background: '#f3f4f6', padding: 12, borderRadius: 4, fontSize: 11 }}>
          {JSON.stringify(activeSectionData, null, 2)}
        </pre>
        <p style={{ color: 'green', marginTop: 12 }}>Fase 2 OK: Hooks funcionan, datos cargados</p>
      </div>
    );
  }

  // Fase 3: PageHeader
  if (phase === 3) {
    return (
      <div style={{ padding: 20 }}>
        {backBtn}
        <h2 style={{ fontFamily: 'monospace' }}>Fase 3: PageHeader</h2>
        <PageHeader
          title={TAB_TITLES[tabCode] || 'Configuración de Plataforma'}
          description={activeSectionData?.description || 'Ajustes técnicos de la plataforma'}
        />
        <p style={{ color: 'green', marginTop: 12, fontFamily: 'monospace' }}>
          Fase 3 OK: PageHeader renderiza
        </p>
      </div>
    );
  }

  // Fase 4: ConfigAdminTab solo
  if (phase === 4) {
    if (!activeSection) {
      return (
        <div style={{ padding: 20, fontFamily: 'monospace' }}>
          {backBtn}
          <p>Esperando activeSection... (isLoading: {String(isLoading)})</p>
        </div>
      );
    }
    return (
      <div style={{ padding: 20 }}>
        {backBtn}
        <h2 style={{ fontFamily: 'monospace' }}>
          Fase 4: ConfigAdminTab (activeSection="{activeSection}")
        </h2>
        <ConfigAdminTab activeSection={activeSection} />
        <p style={{ color: 'green', marginTop: 12, fontFamily: 'monospace' }}>
          Fase 4 OK: Tab renderiza
        </p>
      </div>
    );
  }

  // Fase 5: Todo junto (versión final)
  if (!activeSection) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse-subtle" />
        <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse-subtle" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {backBtn}
      <PageHeader
        title={TAB_TITLES[tabCode] || 'Configuración de Plataforma'}
        description={activeSectionData?.description || 'Ajustes técnicos de la plataforma'}
      />
      {sections.length > 1 && (
        <div className="flex gap-2 border-b pb-2">
          {sections.map((s) => (
            <button
              key={s.code}
              onClick={() => setActiveSection(s.code)}
              className={`px-3 py-1.5 text-sm rounded ${activeSection === s.code ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
      <ConfigAdminTab activeSection={activeSection} />
    </div>
  );
};

export default ConfiguracionAdminPage;
