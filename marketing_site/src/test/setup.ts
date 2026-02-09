import '@testing-library/jest-dom';
import { vi, beforeAll, afterAll } from 'vitest';

// Mock environment variables
vi.mock('../vite-env.d.ts', () => ({}));

// Mock ResizeObserver (needed for some components)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver (needed for lazy loading and animations)
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia (needed for responsive designs)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock import.meta.env
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        DEV: false,
        PROD: false,
        MODE: 'test',
        VITE_PUBLIC_URL: 'https://stratekaz.com',
        VITE_ENABLE_PWA: 'true',
        VITE_ENABLE_ANALYTICS: 'false',
        VITE_ENABLE_CHAT: 'false',
        VITE_ENV: 'test',
        VITE_APP_NAME: 'StrateKaz',
        VITE_APP_VERSION: '1.0.5',
        VITE_ENVIRONMENT: 'test',
      },
    },
  },
});

// Suppress console errors in tests unless explicitly testing them
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalError;
});
