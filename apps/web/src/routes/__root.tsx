import { ThemeToggle } from '@/components/theme-toggle';
import Modals from '@/components/ui/modal/modal-manager';
import { Toaster } from '@/components/ui/sonner';
import { useInitAuth } from '@/features/auth/hooks/use-init-auth';
import { AppProviders } from '@/providers/app-providers';
import { isSamplePath } from '@/sample/layout/navigation';
import { Outlet, createRootRoute, useRouterState } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { isInitialized } = useInitAuth();

  if (!isInitialized) {
    return (
      <AppProviders>
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppProviders>
    );
  }

  return (
    <AppProviders>
      {isSamplePath(pathname) ? null : <ThemeToggle className="fixed top-4 right-4 z-50" />}
      <Outlet />
      <Modals />
      <Toaster />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </AppProviders>
  );
}
