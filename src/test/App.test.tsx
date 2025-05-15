import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import App from '../App';
import { useAppStore } from '../store/app-store';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

// Mock useAppStore
vi.mock('../store/app-store', () => ({
  useAppStore: vi.fn(),
}));

// Mock Router to simplify tests
vi.mock('../router', () => ({
  Router: () => <div data-testid="app-router">Router Content</div>,
}));

// Mock Toaster component
vi.mock('../components/ui/toaster', () => ({
  Toaster: () => <div data-testid="toaster">Toaster Component</div>,
}));

// Mock matchMedia API
beforeEach(() => {
  window.matchMedia = vi.fn().mockImplementation(query => ({
    matches: query === '(prefers-color-scheme: dark)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

describe('App component', () => {
  const queryClient = new QueryClient();

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    // Clear document root classes
    document.documentElement.className = '';
  });

  it('renders QueryClientProvider with Router and Toaster', async () => {
    (useAppStore as unknown as Mock).mockReturnValue({ theme: 'light' });

    await act(async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      );
    });

    expect(screen.getByTestId('app-router')).toBeInTheDocument();
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });

  it('applies light theme class to document root', async () => {
    (useAppStore as unknown as Mock).mockReturnValue({ theme: 'light' });

    await act(async () => {
      render(<App />);
    });

    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('applies dark theme class to document root', async () => {
    (useAppStore as unknown as Mock).mockReturnValue({ theme: 'dark' });

    await act(async () => {
      render(<App />);
    });

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('applies system theme class to document root based on prefers-color-scheme', async () => {
    (useAppStore as unknown as Mock).mockReturnValue({ theme: 'system' });

    await act(async () => {
      render(<App />);
    });

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
