// routeTree.tsx
import { createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import LandingPage from './pages/Landing';
import DemoPage from './pages/Demo';

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
});

const demoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/demo',
  component: DemoPage,
});

export const routeTree = rootRoute.addChildren([indexRoute, demoRoute]);