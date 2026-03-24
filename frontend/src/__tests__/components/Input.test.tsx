import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/forms/Input';

describe('Input Component', () => {
  describe('Rendering', () => {
    it('should render without label when no label prop provided', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<Input label="Email" id="email" />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('should associate label with input via htmlFor and id', () => {
      render(<Input label="Username" id="username" />);
      const label = screen.getByText('Username');
      const input = screen.getByRole('textbox');
      expect(label).toHaveAttribute('for', 'username');
      expect(input).toHaveAttribute('id', 'username');
    });

    it('should render with left icon', () => {
      const LeftIcon = () => <span data-testid="left-icon">@</span>;
      render(<Input leftIcon={<LeftIcon />} />);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('should render with right icon', () => {
      const RightIcon = () => <span data-testid="right-icon">X</span>;
      render(<Input rightIcon={<RightIcon />} />);
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('should render helper text when no error', () => {
      render(<Input helperText="Ingresa tu correo corporativo" />);
      expect(screen.getByText('Ingresa tu correo corporativo')).toBeInTheDocument();
    });

    it('should not render helper text when error is present', () => {
      render(<Input helperText="Helper text" error="Campo requerido" />);
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
      expect(screen.getByText('Campo requerido')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message', () => {
      render(<Input error="Este campo es requerido" />);
      expect(screen.getByText('Este campo es requerido')).toBeInTheDocument();
    });

    it('should apply error border classes when error prop is set', () => {
      render(<Input error="Error" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-danger-500');
    });

    it('should not show error message when error prop is absent', () => {
      render(<Input placeholder="Normal input" />);
      // No p with error class should exist
      const errorParagraphs = document.querySelectorAll('p.text-danger-600');
      expect(errorParagraphs).toHaveLength(0);
    });
  });

  describe('User Interactions', () => {
    it('should call onChange when user types', async () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'hello');
      expect(handleChange).toHaveBeenCalled();
    });

    it('should update value as user types', async () => {
      render(<Input defaultValue="" />);
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'test');
      expect(input).toHaveValue('test');
    });

    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should not fire onChange when disabled', async () => {
      const handleChange = vi.fn();
      render(<Input disabled onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      // userEvent.type respects the disabled attribute (unlike fireEvent)
      await userEvent.type(input, 'test');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to the input element', () => {
      const ref = vi.fn();
      render(<Input ref={ref} />);
      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('Custom Props', () => {
    it('should pass through type attribute', () => {
      render(<Input type="password" />);
      expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'password');
    });

    it('should pass through placeholder', () => {
      render(<Input placeholder="Buscar..." />);
      expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
    });

    it('should apply custom className to input element', () => {
      render(<Input className="custom-input-class" />);
      expect(screen.getByRole('textbox')).toHaveClass('custom-input-class');
    });
  });

  describe('Accessibility', () => {
    it('should be focusable', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      input.focus();
      expect(input).toHaveFocus();
    });

    it('should have correct role', () => {
      render(<Input type="text" />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });
});
