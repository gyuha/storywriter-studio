import { useAuthStore } from '@/features/auth/store/auth.store';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/')({
  component: HomePage,
});

function HomePage() {
  const { user } = useAuthStore();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-2">StoryWriter Studio</h1>
      <p className="text-sm text-gray-500 mb-8">환영합니다, {user?.email}</p>
    </main>
  );
}
