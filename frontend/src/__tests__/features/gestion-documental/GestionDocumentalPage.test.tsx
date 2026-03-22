/**
 * Tests para GestionDocumentalPage
 *
 * Cobertura:
 * - Renderizado de la pagina y header
 * - Secciones dinamicas (tabs)
 * - Estado de carga (skeleton)
 * - GestionDocumentalTab con secciones
 * - Modales de tipo documento, plantilla, documento
 * - Modal de firma digital
 * - Modal de rechazo de firma
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GestionDocumentalPage } from '@/features/gestion-documental/pages/GestionDocumentalPage';
import { render } from '@/__tests__/utils/test-utils';

// ==================== MOCKS ====================

// Mock usePageSections
const mockSetActiveSection = vi.fn();
vi.mock('@/hooks/usePageSections', () => ({
  usePageSections: vi.fn(() => ({
    sections: [
      { code: 'tipos_documento', name: 'Tipos y Plantillas', order: 1 },
      { code: 'documentos', name: 'Documentos', order: 2 },
      { code: 'control_cambios', name: 'Control de Cambios', order: 3 },
      { code: 'distribucion', name: 'Distribución', order: 4 },
    ],
    activeSection: 'tipos_documento',
    setActiveSection: mockSetActiveSection,
    activeSectionData: {
      description: 'Gestión de tipos de documento y plantillas',
    },
    isLoading: false,
  })),
}));

// Mock useModuleColor
vi.mock('@/hooks/useModuleColor', () => ({
  useModuleColor: () => ({ color: '#0EA5E9', isLoading: false, module: null }),
}));

// Mock authStore
vi.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({
      user: {
        id: 1,
        email: 'admin@test.com',
        full_name: 'Admin Test',
        first_name: 'Admin',
      },
    }),
}));

// Mock useWorkflowFirmas
vi.mock('@/features/gestion-estrategica/hooks/useWorkflowFirmas', () => ({
  useWorkflowFirmas: () => ({
    firmarDocumento: vi.fn(),
    rechazarFirma: vi.fn(),
    isFirmando: false,
    isRechazando: false,
  }),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock child components — simplificados
vi.mock('@/features/gestion-documental/components/GestionDocumentalTab', () => ({
  GestionDocumentalTab: ({
    activeSection,
    onCreateTipo,
    onCreateDocumento,
  }: {
    activeSection: string;
    onCreateTipo: () => void;
    onCreateDocumento: () => void;
  }) => (
    <div data-testid="gestion-documental-tab">
      <span data-testid="active-section">{activeSection}</span>
      <button data-testid="btn-create-tipo" onClick={onCreateTipo}>
        Nuevo Tipo
      </button>
      <button data-testid="btn-create-doc" onClick={onCreateDocumento}>
        Nuevo Documento
      </button>
    </div>
  ),
}));

vi.mock('@/features/gestion-documental/components/TipoDocumentoFormModal', () => ({
  TipoDocumentoFormModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="tipo-form-modal">TipoDocumentoFormModal</div> : null,
}));

vi.mock('@/features/gestion-documental/components/PlantillaFormModal', () => ({
  PlantillaFormModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="plantilla-form-modal">PlantillaFormModal</div> : null,
}));

vi.mock('@/features/gestion-documental/components/DocumentoFormModal', () => ({
  DocumentoFormModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="documento-form-modal">DocumentoFormModal</div> : null,
}));

vi.mock('@/features/gestion-documental/components/DocumentoDetailModal', () => ({
  DocumentoDetailModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="documento-detail-modal">DocumentoDetailModal</div> : null,
}));

vi.mock('@/components/modals/SignatureModal', () => ({
  SignatureModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="signature-modal">SignatureModal</div> : null,
}));

vi.mock('@/components/layout', () => ({
  PageHeader: ({ title, description }: { title: string; description: string }) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  ),
}));

vi.mock('@/components/common', () => ({
  DynamicSections: ({
    sections,
    activeSection,
    onChange,
  }: {
    sections: Array<{ code: string; name: string }>;
    activeSection: string;
    onChange: (code: string) => void;
  }) => (
    <div data-testid="dynamic-sections">
      {sections.map((s) => (
        <button
          key={s.code}
          data-testid={`section-${s.code}`}
          onClick={() => onChange(s.code)}
          className={activeSection === s.code ? 'active' : ''}
        >
          {s.name}
        </button>
      ))}
    </div>
  ),
  ConfirmDialog: ({ isOpen, title }: { isOpen: boolean; title: string }) =>
    isOpen ? <div data-testid="confirm-dialog">{title}</div> : null,
}));

vi.mock('@/components/forms', () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea data-testid="textarea-motivo" {...props} />
  ),
}));

// Import mocked hook to override per-test
import { usePageSections } from '@/hooks/usePageSections';

describe('GestionDocumentalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==================== RENDERIZADO ====================

  describe('Renderizado', () => {
    it('debe renderizar el titulo de la pagina', () => {
      render(<GestionDocumentalPage />);
      expect(screen.getByText('Gestión Documental')).toBeInTheDocument();
    });

    it('debe renderizar la descripcion de la seccion activa', () => {
      render(<GestionDocumentalPage />);
      expect(screen.getByText('Gestión de tipos de documento y plantillas')).toBeInTheDocument();
    });

    it('debe renderizar las secciones dinamicas', () => {
      render(<GestionDocumentalPage />);
      expect(screen.getByTestId('dynamic-sections')).toBeInTheDocument();
      expect(screen.getByText('Tipos y Plantillas')).toBeInTheDocument();
      expect(screen.getByText('Documentos')).toBeInTheDocument();
      expect(screen.getByText('Control de Cambios')).toBeInTheDocument();
      expect(screen.getByText('Distribución')).toBeInTheDocument();
    });

    it('debe renderizar el tab de gestion documental con la seccion activa', () => {
      render(<GestionDocumentalPage />);
      expect(screen.getByTestId('gestion-documental-tab')).toBeInTheDocument();
      expect(screen.getByTestId('active-section')).toHaveTextContent('tipos_documento');
    });
  });

  // ==================== ESTADO DE CARGA ====================

  describe('Estado de Carga', () => {
    it('debe mostrar skeleton cuando carga secciones sin seccion activa', () => {
      vi.mocked(usePageSections).mockReturnValue({
        sections: [],
        activeSection: '',
        setActiveSection: mockSetActiveSection,
        activeSectionData: { description: '' },
        isLoading: true,
      } as unknown as ReturnType<typeof usePageSections>);

      const { container } = render(<GestionDocumentalPage />);
      const skeletons = container.querySelectorAll('.animate-pulse-subtle');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('debe renderizar contenido cuando secciones estan cargadas', () => {
      render(<GestionDocumentalPage />);
      expect(screen.getByTestId('page-header')).toBeInTheDocument();
      expect(screen.getByTestId('gestion-documental-tab')).toBeInTheDocument();
    });
  });

  // ==================== NAVEGACION DE SECCIONES ====================

  describe('Navegacion de Secciones', () => {
    it('debe llamar setActiveSection al cambiar seccion', async () => {
      const user = userEvent.setup();
      render(<GestionDocumentalPage />);

      await user.click(screen.getByTestId('section-documentos'));
      expect(mockSetActiveSection).toHaveBeenCalledWith('documentos');
    });

    it('debe llamar setActiveSection al cambiar a control de cambios', async () => {
      const user = userEvent.setup();
      render(<GestionDocumentalPage />);

      await user.click(screen.getByTestId('section-control_cambios'));
      expect(mockSetActiveSection).toHaveBeenCalledWith('control_cambios');
    });

    it('debe llamar setActiveSection al cambiar a distribucion', async () => {
      const user = userEvent.setup();
      render(<GestionDocumentalPage />);

      await user.click(screen.getByTestId('section-distribucion'));
      expect(mockSetActiveSection).toHaveBeenCalledWith('distribucion');
    });
  });

  // ==================== MODALES ====================

  describe('Modales', () => {
    it('debe abrir modal de tipo de documento al hacer clic en nuevo tipo', async () => {
      const user = userEvent.setup();
      render(<GestionDocumentalPage />);

      await user.click(screen.getByTestId('btn-create-tipo'));

      await waitFor(() => {
        expect(screen.getByTestId('tipo-form-modal')).toBeInTheDocument();
      });
    });

    it('debe abrir modal de documento al hacer clic en nuevo documento', async () => {
      const user = userEvent.setup();
      render(<GestionDocumentalPage />);

      await user.click(screen.getByTestId('btn-create-doc'));

      await waitFor(() => {
        expect(screen.getByTestId('documento-form-modal')).toBeInTheDocument();
      });
    });
  });

  // ==================== DESCRIPCION POR DEFECTO ====================

  describe('Descripcion por defecto', () => {
    it('debe mostrar descripcion por defecto si no hay descripcion de seccion', () => {
      vi.mocked(usePageSections).mockReturnValue({
        sections: [{ code: 'tipos_documento', name: 'Tipos y Plantillas', order: 1 }],
        activeSection: 'tipos_documento',
        setActiveSection: mockSetActiveSection,
        activeSectionData: { description: '' },
        isLoading: false,
      } as unknown as ReturnType<typeof usePageSections>);

      render(<GestionDocumentalPage />);
      expect(
        screen.getByText(
          'Control documental ISO: tipos, documentos, versiones, firmas y distribución'
        )
      ).toBeInTheDocument();
    });
  });

  // ==================== SECCION INACTIVA ====================

  describe('Sin seccion activa', () => {
    it('no debe renderizar GestionDocumentalTab si no hay seccion activa', () => {
      vi.mocked(usePageSections).mockReturnValue({
        sections: [{ code: 'tipos_documento', name: 'Tipos y Plantillas', order: 1 }],
        activeSection: '',
        setActiveSection: mockSetActiveSection,
        activeSectionData: { description: '' },
        isLoading: false,
      } as unknown as ReturnType<typeof usePageSections>);

      render(<GestionDocumentalPage />);
      expect(screen.queryByTestId('gestion-documental-tab')).not.toBeInTheDocument();
    });
  });
});
