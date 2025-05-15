import React, { Suspense } from 'react';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { Outlet, createRootRoute, createRoute } from '@tanstack/react-router';
import { Dashboard } from './pages/dashboard';
import { AppLayout } from './components/layout/app-layout';
import { QueryClient } from '@tanstack/react-query';
import { FilterProvider } from './contexts/FilterContext';

// Import pages we'll create
const Import = React.lazy(() => import('./pages/import'));
const ImportHistory = React.lazy(() => import('./pages/import/import-history'));

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

// Register all routes
const routeTree = rootRoute.addChildren([
  dashboardRoute,
  importIndexRoute,
  importHistoryRoute,
]);

// Create the router instance
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

// Helper functions

// This allows for proper code-splitting with React.lazy
function LazyLoad({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>;
}