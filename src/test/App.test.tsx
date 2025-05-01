import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import App from '../App';
import { useAppStore } from '../store/app-store';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

// Mock useAppStore
vi.mock('../store/app-store', () => ({
  useAppStore: vi.fn(),
}));

// Mock AppLayout and Dashboard to simplify tests
vi.mock('../components/layout/app-layout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="app-layout">{children}</div>,
}));

vi.mock('../pages/dashboard', () => ({
  default: () => <div data-testid="dashboard">Dashboard</div>,
}));

describe('App component', () => {
  const queryClient = new QueryClient();

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    // Clear document root classes
    document.documentElement.className = '';
  });

  it('renders QueryClientProvider with AppLayout and Dashboard', () => {
    (useAppStore as unknown as Mock).mockReturnValue({ theme: 'light' });

    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );

    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  it('applies light theme class to document root', () => {
    (useAppStore as Mock).mockReturnValue({ theme: 'light' });

    render(<App />);

    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('applies dark theme class to document root', () => {
    (useAppStore as unknown as Mock).mockReturnValue({ theme: 'dark' });

    render(<App />);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('applies system theme class to document root based on prefers-color-scheme', () => {
    (useAppStore as unknown as Mock).mockReturnValue({ theme: 'system' });

    // Mock matchMedia
    const matchMediaMock = vi.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    window.matchMedia = matchMediaMock;

    render(<App />);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
