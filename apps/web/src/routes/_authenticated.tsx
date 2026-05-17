import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw redirect({ to: '/auth/login' });
    }
  },
  component: () => <Outlet />,
});
