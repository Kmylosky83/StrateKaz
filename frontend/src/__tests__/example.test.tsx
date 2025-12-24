import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/common/Button';

describe('Example Test Suite', () => {
  it('should render a simple component', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should perform basic assertions', () => {
    expect(1 + 1).toBe(2);
    expect('hello').toBeTruthy();
    expect([1, 2, 3]).toHaveLength(3);
  });

  it('should work with async operations', async () => {
    const promise = Promise.resolve('success');
    const result = await promise;
    expect(result).toBe('success');
  });
});
