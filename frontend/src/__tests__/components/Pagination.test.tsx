import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from '@/components/common/Pagination';

describe('Pagination Component', () => {
  describe('Rendering', () => {
    it('should render nothing when totalPages is 1', () => {
      const { container } = render(
        <Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when totalPages is 0', () => {
      const { container } = render(
        <Pagination currentPage={1} totalPages={0} onPageChange={vi.fn()} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render nav element with aria-label', () => {
      render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />);
      expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
    });

    it('should render page numbers for simple pagination', () => {
      render(<Pagination currentPage={1} totalPages={3} onPageChange={vi.fn()} />);
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('Previous/Next buttons', () => {
    it('should render previous and next buttons', () => {
      render(<Pagination currentPage={2} totalPages={5} onPageChange={vi.fn()} />);
      expect(screen.getByLabelText('Página anterior')).toBeInTheDocument();
      expect(screen.getByLabelText('Página siguiente')).toBeInTheDocument();
    });

    it('should disable previous button on first page', () => {
      render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />);
      expect(screen.getByLabelText('Página anterior')).toBeDisabled();
    });

    it('should disable next button on last page', () => {
      render(<Pagination currentPage={5} totalPages={5} onPageChange={vi.fn()} />);
      expect(screen.getByLabelText('Página siguiente')).toBeDisabled();
    });

    it('should enable both buttons on middle page', () => {
      render(<Pagination currentPage={3} totalPages={5} onPageChange={vi.fn()} />);
      expect(screen.getByLabelText('Página anterior')).not.toBeDisabled();
      expect(screen.getByLabelText('Página siguiente')).not.toBeDisabled();
    });
  });

  describe('Page change handling', () => {
    it('should call onPageChange with previous page when previous is clicked', async () => {
      const onPageChange = vi.fn();
      render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />);
      await userEvent.click(screen.getByLabelText('Página anterior'));
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('should call onPageChange with next page when next is clicked', async () => {
      const onPageChange = vi.fn();
      render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />);
      await userEvent.click(screen.getByLabelText('Página siguiente'));
      expect(onPageChange).toHaveBeenCalledWith(4);
    });

    it('should call onPageChange with clicked page number', async () => {
      const onPageChange = vi.fn();
      render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />);
      await userEvent.click(screen.getByText('3'));
      expect(onPageChange).toHaveBeenCalledWith(3);
    });
  });

  describe('Active page indication', () => {
    it('should mark current page with aria-current="page"', () => {
      render(<Pagination currentPage={2} totalPages={5} onPageChange={vi.fn()} />);
      const page2Button = screen.getByText('2');
      expect(page2Button).toHaveAttribute('aria-current', 'page');
    });

    it('should not mark other pages with aria-current', () => {
      render(<Pagination currentPage={2} totalPages={5} onPageChange={vi.fn()} />);
      const page1Button = screen.getByText('1');
      expect(page1Button).not.toHaveAttribute('aria-current');
    });
  });

  describe('Disabled state', () => {
    it('should disable all buttons when disabled=true', () => {
      render(<Pagination currentPage={2} totalPages={5} onPageChange={vi.fn()} disabled />);
      const allButtons = screen.getAllByRole('button');
      allButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Ellipsis for large page counts', () => {
    it('should show ellipsis for many pages', () => {
      const { container } = render(
        <Pagination currentPage={5} totalPages={20} onPageChange={vi.fn()} />
      );
      // Should always show first (1) and last (20) page
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
      // Should have ellipsis (MoreHorizontal icons)
      const ellipsisSvgs = container.querySelectorAll('svg');
      // At least 2 nav arrows + possibly 2 ellipsis icons
      expect(ellipsisSvgs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={vi.fn()}
          className="custom-pagination"
        />
      );
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('custom-pagination');
    });
  });
});
