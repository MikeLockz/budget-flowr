import '@testing-library/react';
import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

/**
 * Mock window.matchMedia for tests to avoid errors
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

import { vi } from 'vitest';

// Mock echarts for tests to prevent canvas context errors
vi.mock('echarts', () => {
  const mockChart = {
    setOption: vi.fn(),
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
    resize: vi.fn(),
    clear: vi.fn(),
    dispose: vi.fn(),
  };
  return {
    init: vi.fn(() => mockChart),
    getInstanceByDom: vi.fn(() => mockChart),
  };
});
