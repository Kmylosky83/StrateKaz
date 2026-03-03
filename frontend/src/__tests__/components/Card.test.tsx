import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card } from '@/components/common/Card';

describe('Card Component', () => {
  describe('Rendering', () => {
    it('should render children correctly', () => {
      render(<Card>Card content here</Card>);
      expect(screen.getByText('Card content here')).toBeInTheDocument();
    });

    it('should render with nested elements', () => {
      render(
        <Card>
          <h2>Title</h2>
          <p>Description</p>
        </Card>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should apply default variant classes', () => {
      const { container } = render(<Card>Default</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('shadow-sm');
      expect(card).toHaveClass('rounded-xl');
    });

    it('should apply bordered variant classes', () => {
      const { container } = render(<Card variant="bordered">Bordered</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border');
      // bordered variant does NOT have shadow-sm or shadow-lg
      expect(card).not.toHaveClass('shadow-sm');
      expect(card).not.toHaveClass('shadow-lg');
    });

    it('should apply elevated variant classes', () => {
      const { container } = render(<Card variant="elevated">Elevated</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('shadow-lg');
    });
  });

  describe('Padding', () => {
    it('should apply default (md) padding', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('p-6');
    });

    it('should apply sm padding', () => {
      const { container } = render(<Card padding="sm">Small padding</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('p-4');
    });

    it('should apply lg padding', () => {
      const { container } = render(<Card padding="lg">Large padding</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('p-8');
    });

    it('should apply no padding', () => {
      const { container } = render(<Card padding="none">No padding</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).not.toHaveClass('p-4');
      expect(card).not.toHaveClass('p-6');
      expect(card).not.toHaveClass('p-8');
    });
  });

  describe('Custom Props', () => {
    it('should apply custom className', () => {
      const { container } = render(<Card className="my-custom-class">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('my-custom-class');
    });

    it('should forward additional HTML attributes', () => {
      const { container } = render(
        <Card data-testid="test-card" id="card-1">
          Content
        </Card>
      );
      expect(screen.getByTestId('test-card')).toBeInTheDocument();
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveAttribute('id', 'card-1');
    });

    it('should handle click events', async () => {
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Clickable</Card>);
      const card = screen.getByText('Clickable').closest('div')!;
      await userEvent.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
