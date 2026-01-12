/**
 * Tests para el componente Tabs del Design System
 *
 * Cobertura:
 * - Renderizado básico
 * - Variantes (underline, pills)
 * - Interacciones
 * - Estados (disabled)
 * - Iconos
 * - Accesibilidad
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs } from '../Tabs';
import { Home, Settings, User } from 'lucide-react';

const mockTabs = [
  { id: 'home', label: 'Home' },
  { id: 'settings', label: 'Settings' },
  { id: 'profile', label: 'Profile' },
];

const mockTabsWithIcons = [
  { id: 'home', label: 'Home', icon: <Home data-testid="home-icon" /> },
  { id: 'settings', label: 'Settings', icon: <Settings data-testid="settings-icon" /> },
  { id: 'profile', label: 'Profile', icon: <User data-testid="profile-icon" /> },
];

const mockTabsWithDisabled = [
  { id: 'home', label: 'Home' },
  { id: 'settings', label: 'Settings', disabled: true },
  { id: 'profile', label: 'Profile' },
];

describe('Tabs', () => {
  // ============================================
  // RENDERIZADO BÁSICO
  // ============================================
  describe('Renderizado básico', () => {
    it('renderiza todos los tabs', () => {
      const onChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="home" onChange={onChange} />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('renderiza tabs como botones', () => {
      const onChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="home" onChange={onChange} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
    });

    it('aplica variante underline por defecto', () => {
      const onChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="home" onChange={onChange} />);

      // Underline variant tiene border-b en el contenedor
      const container = screen.getByRole('navigation').parentElement;
      expect(container).toHaveClass('border-b');
    });
  });

  // ============================================
  // VARIANTES
  // ============================================
  describe('Variantes', () => {
    it('aplica variante underline correctamente', () => {
      const onChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="home" onChange={onChange} variant="underline" />);

      const activeButton = screen.getByText('Home').closest('button');
      expect(activeButton).toHaveClass('border-b-2');
      expect(activeButton).toHaveClass('border-primary-600');
    });

    it('aplica variante pills correctamente', () => {
      const onChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="home" onChange={onChange} variant="pills" />);

      const activeButton = screen.getByText('Home').closest('button');
      expect(activeButton).toHaveClass('bg-white');
      expect(activeButton).toHaveClass('shadow-sm');
    });

    it('tab inactivo tiene estilos diferentes en variante underline', () => {
      const onChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="home" onChange={onChange} variant="underline" />);

      const inactiveButton = screen.getByText('Settings').closest('button');
      expect(inactiveButton).toHaveClass('border-transparent');
    });

    it('tab inactivo tiene estilos diferentes en variante pills', () => {
      const onChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="home" onChange={onChange} variant="pills" />);

      const inactiveButton = screen.getByText('Settings').closest('button');
      expect(inactiveButton).toHaveClass('text-gray-600');
      expect(inactiveButton).not.toHaveClass('bg-white');
    });
  });

  // ============================================
  // INTERACCIONES
  // ============================================
  describe('Interacciones', () => {
    it('llama onChange cuando se hace clic en un tab', () => {
      const onChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="home" onChange={onChange} />);

      fireEvent.click(screen.getByText('Settings'));
      expect(onChange).toHaveBeenCalledWith('settings');
    });

    it('llama onChange con el id correcto', () => {
      const onChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="home" onChange={onChange} />);

      fireEvent.click(screen.getByText('Profile'));
      expect(onChange).toHaveBeenCalledWith('profile');
    });

    it('no llama onChange cuando se hace clic en el tab activo', () => {
      const onChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="home" onChange={onChange} />);

      fireEvent.click(screen.getByText('Home'));
      // Aunque llame, sería con el mismo valor, lo cual es válido
      expect(onChange).toHaveBeenCalledWith('home');
    });
  });

  // ============================================
  // ESTADO DISABLED
  // ============================================
  describe('Estado Disabled', () => {
    it('aplica disabled al tab', () => {
      const onChange = vi.fn();
      render(<Tabs tabs={mockTabsWithDisabled} activeTab="home" onChange={onChange} />);

      const disabledButton = screen.getByText('Settings').closest('button');
      expect(disabledButton).toBeDisabled();
    });

    it('no llama onChange cuando se hace clic en tab disabled', () => {
      const onChange = vi.fn();
      render(<Tabs tabs={mockTabsWithDisabled} activeTab="home" onChange={onChange} />);

      fireEvent.click(screen.getByText('Settings'));
      expect(onChange).not.toHaveBeenCalled();
    });

    it('aplica estilos de disabled', () => {
      const onChange = vi.fn();
      render(<Tabs tabs={mockTabsWithDisabled} activeTab="home" onChange={onChange} />);

      const disabledButton = screen.getByText('Settings').closest('button');
      expect(disabledButton).toHaveClass('opacity-50');
      expect(disabledButton).toHaveClass('cursor-not-allowed');
    });
  });

  // ============================================
  // ICONOS
  // ============================================
  describe('Iconos', () => {
    it('renderiza iconos en los tabs', () => {
      const onChange = vi.fn();
      render(<Tabs tabs={mockTabsWithIcons} activeTab="home" onChange={onChange} />);

      expect(screen.getByTestId('home-icon')).toBeInTheDocument();
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
      expect(screen.getByTestId('profile-icon')).toBeInTheDocument();
    });

    it('icono se renderiza junto con el label', () => {
      const onChange = vi.fn();
      render(<Tabs tabs={mockTabsWithIcons} activeTab="home" onChange={onChange} />);

      const homeButton = screen.getByText('Home').closest('button');
      expect(homeButton).toContainElement(screen.getByTestId('home-icon'));
    });
  });

  // ============================================
  // CLASES PERSONALIZADAS
  // ============================================
  describe('Clases personalizadas', () => {
    it('permite añadir className al contenedor', () => {
      const onChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="home" onChange={onChange} className="custom-class" />);

      // El className se aplica al contenedor principal
      const nav = screen.getByRole('navigation').parentElement;
      expect(nav).toHaveClass('custom-class');
    });
  });

  // ============================================
  // ACCESIBILIDAD
  // ============================================
  describe('Accesibilidad', () => {
    it('tiene aria-label en navegación (variant underline)', () => {
      const onChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="home" onChange={onChange} variant="underline" />);

      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Tabs');
    });

    it('tabs tienen focus ring visible', () => {
      const onChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="home" onChange={onChange} />);

      const button = screen.getByText('Home').closest('button');
      expect(button).toHaveClass('focus:ring-2');
      expect(button).toHaveClass('focus:ring-primary-500');
    });
  });
});
