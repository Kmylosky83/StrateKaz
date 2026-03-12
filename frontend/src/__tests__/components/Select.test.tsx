import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { Select } from '@/components/forms/Select';

const DEFAULT_OPTIONS = [
  { value: 'opt1', label: 'Opción 1' },
  { value: 'opt2', label: 'Opción 2' },
  { value: 'opt3', label: 'Opción 3' },
];

describe('Select Component', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<Select />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<Select label="Tipo de proveedor" id="tipo" />);
      expect(screen.getByText('Tipo de proveedor')).toBeInTheDocument();
    });

    it('should associate label with select via htmlFor and id', () => {
      render(<Select label="Área" id="area-select" />);
      const label = screen.getByText('Área');
      const select = screen.getByRole('combobox');
      expect(label).toHaveAttribute('for', 'area-select');
      expect(select).toHaveAttribute('id', 'area-select');
    });

    it('should render options from options prop', () => {
      render(<Select options={DEFAULT_OPTIONS} />);
      expect(screen.getByText('Opción 1')).toBeInTheDocument();
      expect(screen.getByText('Opción 2')).toBeInTheDocument();
      expect(screen.getByText('Opción 3')).toBeInTheDocument();
    });

    it('should render placeholder as first disabled option', () => {
      render(<Select options={DEFAULT_OPTIONS} placeholder="Selecciona una opción" />);
      const placeholderOption = screen.getByText('Selecciona una opción');
      expect(placeholderOption).toBeInTheDocument();
      expect(placeholderOption).toBeDisabled();
    });

    it('should render children when options prop is absent', () => {
      render(
        <Select>
          <option value="a">Alpha</option>
          <option value="b">Beta</option>
        </Select>
      );
      expect(screen.getByText('Alpha')).toBeInTheDocument();
      expect(screen.getByText('Beta')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message', () => {
      render(<Select error="Selección requerida" />);
      expect(screen.getByText('Selección requerida')).toBeInTheDocument();
    });

    it('should apply error border class when error is set', () => {
      render(<Select error="Error" />);
      expect(screen.getByRole('combobox')).toHaveClass('border-danger-500');
    });

    it('should not show helper text when error is present', () => {
      render(<Select helperText="Texto de ayuda" error="Error presente" />);
      expect(screen.queryByText('Texto de ayuda')).not.toBeInTheDocument();
      expect(screen.getByText('Error presente')).toBeInTheDocument();
    });

    it('should show helper text when there is no error', () => {
      render(<Select helperText="Elige el área correspondiente" />);
      expect(screen.getByText('Elige el área correspondiente')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onChange when option is selected', () => {
      const handleChange = vi.fn();
      render(<Select options={DEFAULT_OPTIONS} onChange={handleChange} />);
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'opt2' } });
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('should reflect selected value', () => {
      render(<Select options={DEFAULT_OPTIONS} defaultValue="opt1" />);
      expect(screen.getByRole('combobox')).toHaveValue('opt1');
    });

    it('should be disabled when disabled prop is true', () => {
      render(<Select disabled />);
      expect(screen.getByRole('combobox')).toBeDisabled();
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to the select element', () => {
      const ref = vi.fn();
      render(<Select ref={ref} />);
      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLSelectElement);
    });
  });

  describe('Custom Props', () => {
    it('should apply custom className', () => {
      render(<Select className="custom-select" />);
      expect(screen.getByRole('combobox')).toHaveClass('custom-select');
    });

    it('should pass through required attribute', () => {
      render(<Select required />);
      expect(screen.getByRole('combobox')).toBeRequired();
    });
  });

  describe('Accessibility', () => {
    it('should be focusable', () => {
      render(<Select />);
      const select = screen.getByRole('combobox');
      select.focus();
      expect(select).toHaveFocus();
    });

    it('should have correct combobox role', () => {
      render(<Select />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });
});
