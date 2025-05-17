import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Router, router } from '../router';
// Remove RouteTreeNode import as it's not available

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

// Mock React.lazy
vi.mock('react', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('react');
  return {
    ...actual,
    lazy: (_importFn: () => Promise<{ default: React.ComponentType<unknown> }>) => {
      // Instead of returning a component that renders a promise, return a component directly
      return function LazyComponent(_props: Record<string, unknown>) {
        // This is a simplified mock that just renders a placeholder
        return <div data-testid="lazy-component">Lazy Component</div>;
      };
    },
  };
});

// Mock TanStack Router
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@tanstack/react-router');
  return {
    ...actual,
    Outlet: () => <div data-testid="router-outlet">Outlet Content</div>,
    RouterProvider: () => <div data-testid="router-provider">Router Provider</div>
  };
});

describe('Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the RouterProvider with router prop', () => {
    render(<Router />);
    expect(screen.getByTestId('router-provider')).toBeInTheDocument();
  });

  it('contains all expected routes', () => {
    // Get the routes from the router
    const routes = router.routeTree.children;
    
    // Verify we have the expected number of routes
    expect(routes?.length).toBe(5);
    
    // Verify the routes are correctly defined
    const routePaths = routes?.map((route) => route.path as string);
    expect(routePaths).toContain('/');
    expect(routePaths).toContain('import');
    expect(routePaths).toContain('import/history');
    expect(routePaths).toContain('settings');
    expect(routePaths).toContain('transactions');
  });

  it('verifies route definitions exist', () => {
    // Get routes from the router
    const routes = router.routeTree.children;
    
    // Find each route and check it exists
    const dashboardRoute = routes?.find((route) => route.path === '/');
    expect(dashboardRoute).toBeDefined();
    
    const importRoute = routes?.find((route) => (route.path as string) === 'import');
    expect(importRoute).toBeDefined();
    
    const importHistoryRoute = routes?.find((route) => (route.path as string) === 'import/history');
    expect(importHistoryRoute).toBeDefined();
    
    const settingsRoute = routes?.find((route) => (route.path as string) === 'settings');
    expect(settingsRoute).toBeDefined();
    
    const transactionsRoute = routes?.find((route) => (route.path as string) === 'transactions');
    expect(transactionsRoute).toBeDefined();
  });

  it('uses correct default preload option', () => {
    expect(router.options.defaultPreload).toBe('intent');
  });
});