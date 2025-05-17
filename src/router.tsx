import React from 'react';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { Outlet, createRootRoute, createRoute } from '@tanstack/react-router';
import { Dashboard } from './pages/dashboard';
import { AppLayout } from './components/layout/app-layout';
// Not used in this file
// import { QueryClient } from '@tanstack/react-query';
// Not used in this file
// import { FilterProvider } from './contexts/FilterContext';

// Import pages we'll create
const Import = React.lazy(() => import('./pages/import'));
const ImportHistory = React.lazy(() => import('./pages/import/import-history'));
const SettingsPage = React.lazy(() => import('./pages/settings'));
const TransactionsPage = React.lazy(() => import('./pages/transactions'));

// Create a root route
const rootRoute = createRootRoute({
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});

// Create a dashboard route
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
});

// Create import routes
const importIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/import',
  component: Import,
});

// Create import history route
const importHistoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/import/history',
  component: ImportHistory,
});

// Create settings route
const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
});

// Create transactions route
const transactionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/transactions',
  component: TransactionsPage,
});

// Register all routes
const routeTree = rootRoute.addChildren([
  dashboardRoute,
  importIndexRoute,
  importHistoryRoute,
  settingsRoute,
  transactionsRoute,
]);

// Create the router instance
// eslint-disable-next-line react-refresh/only-export-components
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

// Type the router
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Create a router component
export function Router() {
  return <RouterProvider router={router} />;
}