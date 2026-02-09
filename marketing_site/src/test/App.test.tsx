import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

// Mock Web Vitals
vi.mock('../utils/webVitals', () => ({
  webVitalsMonitor: {
    init: vi.fn(),
    getStoredMetrics: vi.fn(() => []),
    getPerformanceSummary: vi.fn(() => ({})),
    clearStoredMetrics: vi.fn(),
    reportMetric: vi.fn(),
    logMetrics: vi.fn(),
  },
}));

const AppWithRouter = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

describe('App', () => {
  it('renders without crashing', () => {
    render(<AppWithRouter />);

    // Should render the main layout
    expect(document.body).toBeInTheDocument();
  });

  it('initializes Web Vitals monitoring', async () => {
    const { webVitalsMonitor } = await import('../utils/webVitals');

    render(<AppWithRouter />);

    expect(webVitalsMonitor.init).toHaveBeenCalled();
  });
});
