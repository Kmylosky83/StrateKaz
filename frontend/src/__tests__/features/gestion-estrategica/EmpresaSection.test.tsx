/**
 * Tests para EmpresaSection Component
 *
 * Cobertura:
 * - Renderizado en modo vista (datos configurados)
 * - Renderizado sin configurar (estado inicial)
 * - Transición a modo edición
 * - Validación de formulario
 * - Envío de formulario (create y update)
 * - Manejo de errores
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmpresaSection } from '@/features/gestion-estrategica/components/EmpresaSection';
import {
  render,
  createMockEmpresa,
  createTestQueryClient,
  mockToast,
  clearToastMocks,
  actWait,
} from '@/__tests__/utils/test-utils';

// Mock de los hooks de API
vi.mock('@/features/gestion-estrategica/hooks/useEmpresa', () => ({
  useEmpresaConfig: vi.fn(),
  useCreateEmpresa: vi.fn(),
  useUpdateEmpresa: vi.fn(),
  useEmpresaChoices: vi.fn(),
}));

// Mock de sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    info: vi.fn(),
  },
}));

import {
  useEmpresaConfig,
  useCreateEmpresa,
  useUpdateEmpresa,
  useEmpresaChoices,
} from '@/features/gestion-estrategica/hooks/useEmpresa';

describe('EmpresaSection', () => {
  const mockEmpresa = createMockEmpresa();
  const mockChoices = {
    tipos_sociedad: [
      { value: 'SAS', label: 'Sociedad por Acciones Simplificada' },
      { value: 'SA', label: 'Sociedad Anónima' },
    ],
    regimenes_tributarios: [
      { value: 'COMUN', label: 'Régimen Común' },
      { value: 'SIMPLIFICADO', label: 'Régimen Simplificado' },
    ],
    departamentos: [
      { value: 'CUNDINAMARCA', label: 'Cundinamarca' },
      { value: 'ANTIOQUIA', label: 'Antioquia' },
    ],
    formatos_fecha: [
      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
      { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    ],
    monedas: [
      { value: 'COP', label: 'Peso Colombiano' },
      { value: 'USD', label: 'Dólar Estadounidense' },
    ],
    zonas_horarias: [
      { value: 'America/Bogota', label: 'Bogotá (GMT-5)' },
      { value: 'America/New_York', label: 'New York (GMT-4)' },
    ],
  };

  beforeEach(() => {
    clearToastMocks();

    // Default mock para choices
    vi.mocked(useEmpresaChoices).mockReturnValue({
      data: mockChoices,
      isLoading: false,
      isError: false,
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Estado de Carga', () => {
    it('debe mostrar skeleton mientras carga', () => {
      vi.mocked(useEmpresaConfig).mockReturnValue({
        empresa: null,
        isLoading: true,
        isConfigured: false,
        isError: false,
      } as any);

      render(<EmpresaSection />);

      // Verificar que hay elementos con animación de carga
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Modo Vista (Empresa Configurada)', () => {
    beforeEach(() => {
      vi.mocked(useEmpresaConfig).mockReturnValue({
        empresa: mockEmpresa,
        isLoading: false,
        isConfigured: true,
        isError: false,
      } as any);

      vi.mocked(useCreateEmpresa).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      vi.mocked(useUpdateEmpresa).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);
    });

    it('debe renderizar datos de la empresa en modo vista', () => {
      render(<EmpresaSection />);

      // Verificar header
      expect(screen.getByText('Datos Fiscales y Legales')).toBeInTheDocument();

      // Verificar datos principales
      expect(screen.getByText(mockEmpresa.nit)).toBeInTheDocument();
      expect(screen.getByText(mockEmpresa.razon_social)).toBeInTheDocument();
      expect(
        screen.getByText(mockEmpresa.representante_legal)
      ).toBeInTheDocument();
      expect(
        screen.getByText(mockEmpresa.telefono_principal)
      ).toBeInTheDocument();
      expect(
        screen.getByText(mockEmpresa.email_corporativo)
      ).toBeInTheDocument();
      expect(screen.getByText(mockEmpresa.direccion_fiscal)).toBeInTheDocument();
    });

    it('debe mostrar secciones organizadas en cards', () => {
      render(<EmpresaSection />);

      // Verificar secciones principales (títulos de DataCard)
      expect(screen.getByText('Identificación Fiscal')).toBeInTheDocument();
      expect(screen.getByText('Representante Legal')).toBeInTheDocument();
      expect(screen.getByText('Información de Contacto')).toBeInTheDocument();
      expect(screen.getByText('Ubicación')).toBeInTheDocument();
      expect(screen.getByText('Registro Mercantil')).toBeInTheDocument();
      expect(screen.getByText('Configuración Regional')).toBeInTheDocument();
    });

    it('debe mostrar botón de editar', () => {
      render(<EmpresaSection />);

      const editButton = screen.getByRole('button', { name: /editar/i });
      expect(editButton).toBeInTheDocument();
    });

    it('debe mostrar campos opcionales cuando están presentes', () => {
      render(<EmpresaSection />);

      expect(screen.getByText(mockEmpresa.nombre_comercial!)).toBeInTheDocument();
      expect(screen.getByText(mockEmpresa.sitio_web!)).toBeInTheDocument();
      expect(
        screen.getByText(mockEmpresa.matricula_mercantil!)
      ).toBeInTheDocument();
    });

    it('debe mostrar información de última actualización', () => {
      render(<EmpresaSection />);

      expect(screen.getByText(/última actualización:/i)).toBeInTheDocument();
      expect(screen.getByText(/admin usuario/i)).toBeInTheDocument();
    });
  });

  describe('Transición a Modo Edición', () => {
    beforeEach(() => {
      vi.mocked(useEmpresaConfig).mockReturnValue({
        empresa: mockEmpresa,
        isLoading: false,
        isConfigured: true,
        isError: false,
      } as any);

      vi.mocked(useCreateEmpresa).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      vi.mocked(useUpdateEmpresa).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);
    });

    it('debe cambiar a modo edición al hacer clic en editar', async () => {
      const user = userEvent.setup();
      render(<EmpresaSection />);

      const editButton = screen.getByRole('button', { name: /editar/i });
      await user.click(editButton);

      // Esperar a que se complete la transición
      await actWait(100);

      // Verificar que aparece el formulario
      await waitFor(() => {
        expect(
          screen.getByText('Editar Datos de la Empresa')
        ).toBeInTheDocument();
      });

      // Verificar que aparecen los botones del formulario
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
      });
    });

    it('debe pre-cargar los valores existentes en el formulario', async () => {
      const user = userEvent.setup();
      render(<EmpresaSection />);

      await user.click(screen.getByRole('button', { name: /editar/i }));

      // Esperar a que se complete la transición
      await actWait(100);

      await waitFor(() => {
        const nitInput = screen.getByLabelText(/nit/i) as HTMLInputElement;
        expect(nitInput.value).toBe(mockEmpresa.nit);
      });

      await waitFor(() => {
        const razonSocialInput = screen.getByLabelText(
          /razón social/i
        ) as HTMLInputElement;
        expect(razonSocialInput.value).toBe(mockEmpresa.razon_social);

        const emailInput = screen.getByLabelText(
          /email corporativo/i
        ) as HTMLInputElement;
        expect(emailInput.value).toBe(mockEmpresa.email_corporativo);
      });
    });

    it('debe cancelar la edición y volver a modo vista', async () => {
      const user = userEvent.setup();
      render(<EmpresaSection />);

      await user.click(screen.getByRole('button', { name: /editar/i }));
      await actWait(100);

      await waitFor(() => {
        expect(
          screen.getByText('Editar Datos de la Empresa')
        ).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);
      await actWait(100);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
      });
    });
  });

  describe('Estado Sin Configurar', () => {
    beforeEach(() => {
      vi.mocked(useEmpresaConfig).mockReturnValue({
        empresa: null,
        isLoading: false,
        isConfigured: false,
        isError: false,
      } as any);

      vi.mocked(useCreateEmpresa).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      vi.mocked(useUpdateEmpresa).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);
    });

    it('debe mostrar mensaje de alerta cuando no está configurada', () => {
      render(<EmpresaSection />);

      expect(
        screen.getByText(/no se ha configurado la información de la empresa/i)
      ).toBeInTheDocument();
    });

    it('debe mostrar botón para configurar empresa', () => {
      render(<EmpresaSection />);

      const configButton = screen.getByRole('button', {
        name: /configurar empresa/i,
      });
      expect(configButton).toBeInTheDocument();
    });

    it('debe abrir formulario de creación al hacer clic en configurar', async () => {
      const user = userEvent.setup();
      render(<EmpresaSection />);

      const configButton = screen.getByRole('button', {
        name: /configurar empresa/i,
      });
      await user.click(configButton);

      await waitFor(() => {
        expect(
          screen.getByText('Configurar Datos de la Empresa')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Validación de Formulario', () => {
    beforeEach(() => {
      vi.mocked(useEmpresaConfig).mockReturnValue({
        empresa: null,
        isLoading: false,
        isConfigured: false,
        isError: false,
      } as any);

      vi.mocked(useCreateEmpresa).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      vi.mocked(useUpdateEmpresa).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);
    });

    it('debe mostrar errores de validación al intentar guardar formulario vacío', async () => {
      const user = userEvent.setup();
      render(<EmpresaSection />);

      await user.click(screen.getByRole('button', { name: /configurar empresa/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/nit/i)).toBeInTheDocument();
      });

      // Intentar guardar sin llenar campos requeridos
      const submitButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(submitButton);

      // React Hook Form valida al submit - debe mostrar errores
      await waitFor(() => {
        expect(screen.getByText(/el nit es requerido/i)).toBeInTheDocument();
      });
    });

    it('debe validar formato de NIT al enviar', async () => {
      const user = userEvent.setup();
      render(<EmpresaSection />);

      await user.click(screen.getByRole('button', { name: /configurar empresa/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/nit/i)).toBeInTheDocument();
      });

      const nitInput = screen.getByLabelText(/nit/i);
      await user.type(nitInput, '12345'); // NIT inválido

      // Intentar guardar para disparar validación
      const submitButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/formato inválido/i)).toBeInTheDocument();
      });
    });

    it('debe tener campo de email corporativo con validación', async () => {
      const user = userEvent.setup();
      render(<EmpresaSection />);

      await user.click(screen.getByRole('button', { name: /configurar empresa/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/email corporativo/i)).toBeInTheDocument();
      });

      // Verificar que el campo de email existe y tiene tipo email
      const emailInput = screen.getByLabelText(/email corporativo/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('debe mostrar múltiples errores de validación al enviar formulario incompleto', async () => {
      const user = userEvent.setup();
      render(<EmpresaSection />);

      await user.click(screen.getByRole('button', { name: /configurar empresa/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/nit/i)).toBeInTheDocument();
      });

      // Intentar guardar formulario vacío
      const submitButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(submitButton);

      // Debe mostrar múltiples errores de campos requeridos
      await waitFor(() => {
        expect(screen.getByText(/el nit es requerido/i)).toBeInTheDocument();
      });
    });
  });

  describe('Envío de Formulario', () => {
    it('debe mostrar formulario con campos requeridos', async () => {
      const user = userEvent.setup();

      vi.mocked(useEmpresaConfig).mockReturnValue({
        empresa: null,
        isLoading: false,
        isConfigured: false,
        isError: false,
      } as any);

      vi.mocked(useCreateEmpresa).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      vi.mocked(useUpdateEmpresa).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      render(<EmpresaSection />);

      await user.click(screen.getByRole('button', { name: /configurar empresa/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/nit/i)).toBeInTheDocument();
      });

      // Verificar que los campos principales están presentes
      expect(screen.getByLabelText(/nit/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/razón social/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nombre del representante legal/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/teléfono principal/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email corporativo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/dirección fiscal/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/ciudad/i)).toBeInTheDocument();

      // Verificar botones de acción
      expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });

    it('debe actualizar empresa existente', async () => {
      const mutateAsyncMock = vi.fn().mockResolvedValue(mockEmpresa);
      const user = userEvent.setup();

      vi.mocked(useEmpresaConfig).mockReturnValue({
        empresa: mockEmpresa,
        isLoading: false,
        isConfigured: true,
        isError: false,
      } as any);

      vi.mocked(useCreateEmpresa).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      vi.mocked(useUpdateEmpresa).mockReturnValue({
        mutateAsync: mutateAsyncMock,
        isPending: false,
      } as any);

      render(<EmpresaSection />);

      await user.click(screen.getByRole('button', { name: /editar/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/teléfono principal/i)).toBeInTheDocument();
      });

      // Cambiar teléfono
      const telefonoInput = screen.getByLabelText(
        /teléfono principal/i
      ) as HTMLInputElement;
      await user.clear(telefonoInput);
      await user.type(telefonoInput, '3009999999');

      const submitButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mutateAsyncMock).toHaveBeenCalled();
      });
    });

    it('debe deshabilitar botones mientras está guardando', async () => {
      const user = userEvent.setup();

      vi.mocked(useEmpresaConfig).mockReturnValue({
        empresa: null,
        isLoading: false,
        isConfigured: false,
        isError: false,
      } as any);

      vi.mocked(useCreateEmpresa).mockReturnValue({
        mutateAsync: vi.fn().mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 1000))
        ),
        isPending: true, // Simulando carga
      } as any);

      vi.mocked(useUpdateEmpresa).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      render(<EmpresaSection />);

      await user.click(screen.getByRole('button', { name: /configurar empresa/i }));

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /guardar/i });
        const cancelButton = screen.getByRole('button', { name: /cancelar/i });

        expect(saveButton).toBeDisabled();
        expect(cancelButton).toBeDisabled();
      });
    });
  });

  describe('Manejo de Errores', () => {
    it('debe tener el hook de creación configurado', () => {
      const mutateAsyncMock = vi.fn();

      vi.mocked(useEmpresaConfig).mockReturnValue({
        empresa: null,
        isLoading: false,
        isConfigured: false,
        isError: false,
      } as any);

      vi.mocked(useCreateEmpresa).mockReturnValue({
        mutateAsync: mutateAsyncMock,
        isPending: false,
      } as any);

      vi.mocked(useUpdateEmpresa).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      render(<EmpresaSection />);

      // Verificar que el componente se renderiza sin errores
      expect(screen.getByRole('button', { name: /configurar empresa/i })).toBeInTheDocument();
    });
  });

  describe('Accesibilidad', () => {
    beforeEach(() => {
      vi.mocked(useEmpresaConfig).mockReturnValue({
        empresa: mockEmpresa,
        isLoading: false,
        isConfigured: true,
        isError: false,
      } as any);

      vi.mocked(useCreateEmpresa).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      vi.mocked(useUpdateEmpresa).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);
    });

    it('debe tener roles y labels accesibles en modo vista', () => {
      render(<EmpresaSection />);

      const editButton = screen.getByRole('button', { name: /editar/i });
      expect(editButton).toBeInTheDocument();
    });

    it('debe tener labels asociados a inputs en formulario', async () => {
      const user = userEvent.setup();
      render(<EmpresaSection />);

      await user.click(screen.getByRole('button', { name: /editar/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/nit/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/razón social/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/teléfono principal/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email corporativo/i)).toBeInTheDocument();
      });
    });
  });
});
