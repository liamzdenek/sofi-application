import { createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { RootLayout } from './layouts/RootLayout';
import { ExperimentsPage } from './pages/ExperimentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SamplePage } from './pages/SamplePage';
import { HomePage } from './pages/HomePage';

// Create the root route
export const rootRoute = createRootRoute({
  component: RootLayout,
});

// Create the home route
export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

// Create the experiments route
export const experimentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/experiments',
  component: ExperimentsPage,
});

// Create the reports route
export const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reports',
  component: ReportsPage,
});

// Create the sample route
export const sampleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sample',
  component: SamplePage,
});

// Create the router
export const routeTree = rootRoute.addChildren([
  homeRoute,
  experimentsRoute,
  reportsRoute,
  sampleRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

// Router component with devtools
export function Router() {
  return (
    <>
      <RouterProvider router={router} />
      {process.env.NODE_ENV === 'development' && <TanStackRouterDevtools router={router} />}
    </>
  );
}

// Type declaration for the router
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}