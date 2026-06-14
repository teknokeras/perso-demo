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
  component: DemoPage,
});

const demoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/landing',
  component: LandingPage,
});

export const routeTree = rootRoute.addChildren([indexRoute, demoRoute]);