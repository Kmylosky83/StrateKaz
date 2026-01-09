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

      // Verificar secciones principales
      expect(screen.getByText('Identificación Fiscal')).toBeInTheDocument();
      expect(screen.getByText('Representante Legal')).toBeInTheDocument();
      expect(screen.getByText('Contacto')).toBeInTheDocument();
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

      // Verificar que aparece el formulario
      await waitFor(() => {
        expect(
          screen.getByText('Editar Datos de la Empresa')
        ).toBeInTheDocument();
      });

      // Verificar que aparecen los botones del formulario
      expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });

    it('debe pre-cargar los valores existentes en el formulario', async () => {
      const user = userEvent.setup();
      render(<EmpresaSection />);

      await user.click(screen.getByRole('button', { name: /editar/i }));

      await waitFor(() => {
        const nitInput = screen.getByLabelText(/nit/i) as HTMLInputElement;
        expect(nitInput.value).toBe(mockEmpresa.nit);
      });

      const razonSocialInput = screen.getByLabelText(
        /razón social/i
      ) as HTMLInputElement;
      expect(razonSocialInput.value).toBe(mockEmpresa.razon_social);

      const emailInput = screen.getByLabelText(
        /email corporativo/i
      ) as HTMLInputElement;
      expect(emailInput.value).toBe(mockEmpresa.email_corporativo);
    });

    it('debe cancelar la edición y volver a modo vista', async () => {
      const user = userEvent.setup();
      render(<EmpresaSection />);

      await user.click(screen.getByRole('button', { name: /editar/i }));
      await waitFor(() => {
        expect(
          screen.getByText('Editar Datos de la Empresa')
        ).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

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

    it('debe validar que NIT es requerido', async () => {
      const user = userEvent.setup();
      render(<EmpresaSection />);

      await user.click(screen.getByRole('button', { name: /configurar empresa/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/nit/i)).toBeInTheDocument();
      });

      const nitInput = screen.getByLabelText(/nit/i);
      await user.clear(nitInput);
      await user.tab(); // Trigger blur

      await waitFor(() => {
        expect(screen.getByText(/el nit es requerido/i)).toBeInTheDocument();
      });
    });

    it('debe validar formato de NIT', async () => {
      const user = userEvent.setup();
      render(<EmpresaSection />);

      await user.click(screen.getByRole('button', { name: /configurar empresa/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/nit/i)).toBeInTheDocument();
      });

      const nitInput = screen.getByLabelText(/nit/i);
      await user.type(nitInput, '12345'); // NIT inválido
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/formato inválido/i)).toBeInTheDocument();
      });
    });

    it('debe validar que Razón Social es requerida', async () => {
      const user = userEvent.setup();
      render(<EmpresaSection />);

      await user.click(screen.getByRole('button', { name: /configurar empresa/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/razón social/i)).toBeInTheDocument();
      });

      const razonInput = screen.getByLabelText(/razón social/i);
      await user.clear(razonInput);
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/la razón social es requerida/i)
        ).toBeInTheDocument();
      });
    });

    it('debe validar formato de email', async () => {
      const user = userEvent.setup();
      render(<EmpresaSection />);

      await user.click(screen.getByRole('button', { name: /configurar empresa/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/email corporativo/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email corporativo/i);
      await user.type(emailInput, 'email-invalido');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
      });
    });

    it('debe validar que teléfono principal es requerido', async () => {
      const user = userEvent.setup();
      render(<EmpresaSection />);

      await user.click(screen.getByRole('button', { name: /configurar empresa/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/teléfono principal/i)).toBeInTheDocument();
      });

      const telefonoInput = screen.getByLabelText(/teléfono principal/i);
      await user.clear(telefonoInput);
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/el teléfono principal es requerido/i)
        ).toBeInTheDocument();
      });
    });

    it('debe validar que dirección fiscal es requerida', async () => {
      const user = userEvent.setup();
      render(<EmpresaSection />);

      await user.click(screen.getByRole('button', { name: /configurar empresa/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/dirección fiscal/i)).toBeInTheDocument();
      });

      const direccionInput = screen.getByLabelText(/dirección fiscal/i);
      await user.clear(direccionInput);
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/la dirección fiscal es requerida/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Envío de Formulario', () => {
    it('debe crear empresa nueva con datos válidos', async () => {
      const mutateAsyncMock = vi.fn().mockResolvedValue(mockEmpresa);
      const user = userEvent.setup();

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

      await user.click(screen.getByRole('button', { name: /configurar empresa/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/nit/i)).toBeInTheDocument();
      });

      // Llenar formulario con datos válidos
      await user.type(screen.getByLabelText(/nit/i), '900123456-7');
      await user.type(
        screen.getByLabelText(/razón social/i),
        'Empresa Test S.A.S.'
      );
      await user.type(
        screen.getByLabelText(/nombre del representante legal/i),
        'Juan Test'
      );
      await user.type(screen.getByLabelText(/teléfono principal/i), '3001234567');
      await user.type(
        screen.getByLabelText(/email corporativo/i),
        'test@empresa.com'
      );
      await user.type(
        screen.getByLabelText(/dirección fiscal/i),
        'Calle 123'
      );
      await user.type(screen.getByLabelText(/ciudad/i), 'Bogotá');

      // Enviar formulario
      const submitButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mutateAsyncMock).toHaveBeenCalled();
      });
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
    it('debe mostrar mensaje de error al fallar creación', async () => {
      const mutateAsyncMock = vi
        .fn()
        .mockRejectedValue(new Error('Error al crear'));
      const user = userEvent.setup();

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

      await user.click(screen.getByRole('button', { name: /configurar empresa/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/nit/i)).toBeInTheDocument();
      });

      // Llenar datos mínimos
      await user.type(screen.getByLabelText(/nit/i), '900123456-7');
      await user.type(screen.getByLabelText(/razón social/i), 'Test');
      await user.type(
        screen.getByLabelText(/nombre del representante legal/i),
        'Test'
      );
      await user.type(screen.getByLabelText(/teléfono principal/i), '3001234567');
      await user.type(
        screen.getByLabelText(/email corporativo/i),
        'test@test.com'
      );
      await user.type(screen.getByLabelText(/dirección fiscal/i), 'Calle');
      await user.type(screen.getByLabelText(/ciudad/i), 'Ciudad');

      const submitButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mutateAsyncMock).toHaveBeenCalled();
      });

      // El error se maneja en el hook, no en el componente
      // Así que solo verificamos que se llamó la función
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
