import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ViewToggle, type ViewToggleOption } from '@/components/common/ViewToggle';

const defaultOptions: ViewToggleOption[] = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'kanban', label: 'Kanban' },
];

describe('ViewToggle Component', () => {
  describe('Rendering', () => {
    it('should render all option labels', () => {
      render(<ViewToggle value="dashboard" onChange={vi.fn()} options={defaultOptions} />);
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Kanban')).toBeInTheDocument();
    });

    it('should render options as buttons', () => {
      render(<ViewToggle value="dashboard" onChange={vi.fn()} options={defaultOptions} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('should render buttons with type="button"', () => {
      render(<ViewToggle value="dashboard" onChange={vi.fn()} options={defaultOptions} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => {
        expect(btn).toHaveAttribute('type', 'button');
      });
    });
  });

  describe('Active state', () => {
    it('should apply active styles to the selected option', () => {
      render(<ViewToggle value="dashboard" onChange={vi.fn()} options={defaultOptions} />);
      const dashboardButton = screen.getByText('Dashboard').closest('button')!;
      // Active button should have shadow and active color
      expect(dashboardButton).toHaveClass('shadow-sm');
    });

    it('should not apply active styles to non-selected option', () => {
      render(<ViewToggle value="dashboard" onChange={vi.fn()} options={defaultOptions} />);
      const kanbanButton = screen.getByText('Kanban').closest('button')!;
      expect(kanbanButton).not.toHaveClass('shadow-sm');
      expect(kanbanButton).toHaveClass('text-gray-600');
    });
  });

  describe('Toggle callback', () => {
    it('should call onChange with selected value when option is clicked', async () => {
      const onChange = vi.fn();
      render(<ViewToggle value="dashboard" onChange={onChange} options={defaultOptions} />);
      await userEvent.click(screen.getByText('Kanban'));
      expect(onChange).toHaveBeenCalledWith('kanban');
    });

    it('should call onChange even when clicking already active option', async () => {
      const onChange = vi.fn();
      render(<ViewToggle value="dashboard" onChange={onChange} options={defaultOptions} />);
      await userEvent.click(screen.getByText('Dashboard'));
      expect(onChange).toHaveBeenCalledWith('dashboard');
    });
  });

  describe('Module colors', () => {
    it('should apply purple color by default', () => {
      render(<ViewToggle value="dashboard" onChange={vi.fn()} options={defaultOptions} />);
      const activeButton = screen.getByText('Dashboard').closest('button')!;
      expect(activeButton.className).toContain('purple');
    });

    it('should apply blue color when moduleColor is blue', () => {
      render(
        <ViewToggle
          value="dashboard"
          onChange={vi.fn()}
          options={defaultOptions}
          moduleColor="blue"
        />
      );
      const activeButton = screen.getByText('Dashboard').closest('button')!;
      expect(activeButton.className).toContain('blue');
    });

    it('should apply green color when moduleColor is green', () => {
      render(
        <ViewToggle
          value="dashboard"
          onChange={vi.fn()}
          options={defaultOptions}
          moduleColor="green"
        />
      );
      const activeButton = screen.getByText('Dashboard').closest('button')!;
      expect(activeButton.className).toContain('emerald');
    });
  });

  describe('Sizes', () => {
    it('should apply sm size by default', () => {
      render(<ViewToggle value="dashboard" onChange={vi.fn()} options={defaultOptions} />);
      const button = screen.getByText('Dashboard').closest('button')!;
      expect(button).toHaveClass('px-3');
    });

    it('should apply md size', () => {
      render(
        <ViewToggle value="dashboard" onChange={vi.fn()} options={defaultOptions} size="md" />
      );
      const button = screen.getByText('Dashboard').closest('button')!;
      expect(button).toHaveClass('px-4');
    });
  });

  describe('Custom className', () => {
    it('should apply custom className to container', () => {
      const { container } = render(
        <ViewToggle
          value="dashboard"
          onChange={vi.fn()}
          options={defaultOptions}
          className="my-toggle"
        />
      );
      expect(container.firstChild).toHaveClass('my-toggle');
    });
  });

  describe('Three or more options', () => {
    it('should render all options for 3+ items', () => {
      const threeOptions: ViewToggleOption[] = [
        { value: 'list', label: 'Lista' },
        { value: 'grid', label: 'Grilla' },
        { value: 'table', label: 'Tabla' },
      ];
      render(<ViewToggle value="list" onChange={vi.fn()} options={threeOptions} />);
      expect(screen.getAllByRole('button')).toHaveLength(3);
    });
  });
});
