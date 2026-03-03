import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, type Tab } from '@/components/common/Tabs';

const sampleTabs: Tab[] = [
  { id: 'general', label: 'General' },
  { id: 'detalle', label: 'Detalle' },
  { id: 'historial', label: 'Historial' },
];

describe('Tabs Component', () => {
  describe('Rendering', () => {
    it('should render all tab labels', () => {
      const onChange = vi.fn();
      render(<Tabs tabs={sampleTabs} activeTab="general" onChange={onChange} />);

      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Detalle')).toBeInTheDocument();
      expect(screen.getByText('Historial')).toBeInTheDocument();
    });

    it('should render tabs as buttons', () => {
      const onChange = vi.fn();
      render(<Tabs tabs={sampleTabs} activeTab="general" onChange={onChange} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
    });

    it('should render with underline variant by default', () => {
      const onChange = vi.fn();
      const { container } = render(
        <Tabs tabs={sampleTabs} activeTab="general" onChange={onChange} />
      );
      // Underline variant has a nav with aria-label="Tabs"
      const nav = container.querySelector('nav[aria-label="Tabs"]');
      expect(nav).toBeInTheDocument();
    });

    it('should render with pills variant', () => {
      const onChange = vi.fn();
      const { container } = render(
        <Tabs tabs={sampleTabs} activeTab="general" onChange={onChange} variant="pills" />
      );
      // Pills variant does NOT have a nav element
      const nav = container.querySelector('nav[aria-label="Tabs"]');
      expect(nav).not.toBeInTheDocument();
    });
  });

  describe('Active tab indicator', () => {
    it('should apply active styles to the active tab (underline)', () => {
      const onChange = vi.fn();
      render(<Tabs tabs={sampleTabs} activeTab="detalle" onChange={onChange} />);

      const detalleButton = screen.getByText('Detalle').closest('button')!;
      expect(detalleButton).toHaveClass('border-primary-600');
    });

    it('should not apply active styles to inactive tabs', () => {
      const onChange = vi.fn();
      render(<Tabs tabs={sampleTabs} activeTab="general" onChange={onChange} />);

      const detalleButton = screen.getByText('Detalle').closest('button')!;
      expect(detalleButton).toHaveClass('border-transparent');
    });

    it('should apply active styles in pills variant', () => {
      const onChange = vi.fn();
      render(<Tabs tabs={sampleTabs} activeTab="historial" onChange={onChange} variant="pills" />);

      const historialButton = screen.getByText('Historial').closest('button')!;
      expect(historialButton).toHaveClass('bg-white');
    });
  });

  describe('Tab switching', () => {
    it('should call onChange with the tab id when clicked', async () => {
      const onChange = vi.fn();
      render(<Tabs tabs={sampleTabs} activeTab="general" onChange={onChange} />);

      await userEvent.click(screen.getByText('Detalle'));
      expect(onChange).toHaveBeenCalledWith('detalle');
    });

    it('should call onChange for each tab click', async () => {
      const onChange = vi.fn();
      render(<Tabs tabs={sampleTabs} activeTab="general" onChange={onChange} />);

      await userEvent.click(screen.getByText('Detalle'));
      await userEvent.click(screen.getByText('Historial'));
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange).toHaveBeenNthCalledWith(1, 'detalle');
      expect(onChange).toHaveBeenNthCalledWith(2, 'historial');
    });
  });

  describe('Disabled tab', () => {
    it('should render disabled tab with opacity class', () => {
      const onChange = vi.fn();
      const tabsWithDisabled: Tab[] = [
        { id: 'a', label: 'Active' },
        { id: 'b', label: 'Disabled', disabled: true },
      ];
      render(<Tabs tabs={tabsWithDisabled} activeTab="a" onChange={onChange} />);

      const disabledButton = screen.getByText('Disabled').closest('button')!;
      expect(disabledButton).toHaveClass('opacity-50');
      expect(disabledButton).toHaveClass('cursor-not-allowed');
      expect(disabledButton).toBeDisabled();
    });

    it('should not call onChange when disabled tab is clicked', async () => {
      const onChange = vi.fn();
      const tabsWithDisabled: Tab[] = [
        { id: 'a', label: 'Active' },
        { id: 'b', label: 'Disabled', disabled: true },
      ];
      render(<Tabs tabs={tabsWithDisabled} activeTab="a" onChange={onChange} />);

      await userEvent.click(screen.getByText('Disabled'));
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('With icons', () => {
    it('should render tab icons when provided', () => {
      const onChange = vi.fn();
      const tabsWithIcons: Tab[] = [
        { id: 'home', label: 'Inicio', icon: <span data-testid="icon-home">🏠</span> },
        { id: 'config', label: 'Config' },
      ];
      render(<Tabs tabs={tabsWithIcons} activeTab="home" onChange={onChange} />);
      expect(screen.getByTestId('icon-home')).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const onChange = vi.fn();
      const { container } = render(
        <Tabs tabs={sampleTabs} activeTab="general" onChange={onChange} className="my-tabs" />
      );
      expect(container.firstChild).toHaveClass('my-tabs');
    });
  });
});
