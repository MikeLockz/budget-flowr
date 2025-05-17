import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Router, router } from '../router';
// Using the router instance's types instead of importing RouteTreeNode directly

// Mock the components used in routes
vi.mock('../pages/dashboard', () => ({
  Dashboard: () => <div data-testid="dashboard-page">Dashboard Page</div>,
}));

vi.mock('../components/layout/app-layout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-layout">
      <div>App Layout</div>
      {children}
    </div>
  ),
}));

// Mock lazy-loaded components
vi.mock('../pages/import', () => ({
  default: () => <div data-testid="import-page">Import Page</div>,
}));

vi.mock('../pages/import/import-history', () => ({
  default: () => <div data-testid="import-history-page">Import History Page</div>,
}));

vi.mock('../pages/settings', () => ({
  default: () => <div data-testid="settings-page">Settings Page</div>,
}));

vi.mock('../pages/transactions', () => ({
  default: () => <div data-testid="transactions-page">Transactions Page</div>,
}));

// Avoid overriding the actual implementation in @tanstack/react-router
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');
  return {
    ...actual,
  };
});

describe('Router Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('correctly registers the dashboard route', async () => {
    // Find route in router config
    const route = router.routeTree.children?.find((r) => r.path === '/');
    expect(route).toBeDefined();
    expect(route?.path).toBe('/');
  });

  it('correctly registers the import route', async () => {
    // Find route in router config
    const route = router.routeTree.children?.find((r) => (r.path as string) === 'import');
    expect(route).toBeDefined();
    expect(route?.path).toBe('import');
  });

  it('correctly registers the import history route', async () => {
    // Find route in router config
    const route = router.routeTree.children?.find((r) => (r.path as string) === 'import/history');
    expect(route).toBeDefined();
    expect(route?.path).toBe('import/history');
  });

  it('correctly registers the settings route', async () => {
    // Find route in router config
    const route = router.routeTree.children?.find((r) => (r.path as string) === 'settings');
    expect(route).toBeDefined();
    expect(route?.path).toBe('settings');
  });

  it('correctly registers the transactions route', async () => {
    // Find route in router config
    const route = router.routeTree.children?.find((r) => (r.path as string) === 'transactions');
    expect(route).toBeDefined();
    expect(route?.path).toBe('transactions');
  });

  it('verifies the Router component renders', async () => {
    await act(async () => {
      const { container } = render(<Router />);
      expect(container).not.toBeNull();
    });
  });

  it('verifies router has correct preload configuration', () => {
    expect(router.options.defaultPreload).toBe('intent');
  });
});