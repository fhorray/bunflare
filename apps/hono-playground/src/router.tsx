import { 
  createRootRoute, 
  createRoute, 
  createRouter, 
  Outlet
} from "@tanstack/react-router";
import { App } from "./App";
import { AuthPage } from "./components/Auth";
import { Dashboard } from "./components/Dashboard";

// Root Route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: App,
});

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth",
  component: AuthPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: Dashboard,
});

// Router configuration
const routeTree = rootRoute.addChildren([
  indexRoute, 
  authRoute, 
  dashboardRoute
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
