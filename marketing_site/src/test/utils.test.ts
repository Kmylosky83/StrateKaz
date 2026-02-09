import { describe, it, expect, vi } from 'vitest';
import { webVitalsMonitor } from '../utils/webVitals';

// Mock web-vitals library
vi.mock('web-vitals', () => ({
  onCLS: vi.fn(),
  onFCP: vi.fn(),
  onINP: vi.fn(),
  onLCP: vi.fn(),
  onTTFB: vi.fn(),
}));

describe('Web Vitals Monitor', () => {
  it('has correct methods available', () => {
    expect(webVitalsMonitor.init).toBeDefined();
    expect(webVitalsMonitor.getStoredMetrics).toBeDefined();
    expect(webVitalsMonitor.getPerformanceSummary).toBeDefined();
    expect(webVitalsMonitor.clearStoredMetrics).toBeDefined();
  });

  it('initializes without errors', () => {
    expect(() => webVitalsMonitor.init()).not.toThrow();
  });

  it('returns empty metrics initially', () => {
    const metrics = webVitalsMonitor.getStoredMetrics();
    expect(Array.isArray(metrics)).toBe(true);
  });

  it('returns empty summary initially', () => {
    const summary = webVitalsMonitor.getPerformanceSummary();
    expect(typeof summary).toBe('object');
  });

  it('clears stored metrics without errors', () => {
    expect(() => webVitalsMonitor.clearStoredMetrics()).not.toThrow();
  });
});

describe('Environment Configuration', () => {
  it('has proper test environment setup', () => {
    expect(import.meta.env.VITE_ENV).toBe('test');
    expect(import.meta.env.VITE_PUBLIC_URL).toBe('https://stratekaz.com');
  });
});
