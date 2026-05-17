import { AdminUsersPage } from '@/features/admin/components/admin-users-page';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/admin/users')({
  component: AdminUsersPage,
});
