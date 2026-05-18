import { useAuthStore } from '@/features/auth/store/auth.store';
import { useNovels } from '@/features/novel/hooks/use-novel-queries';
import { createFileRoute, Link } from '@tanstack/react-router';
import { BookOpen, PenLine, Plus } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/')({
  component: HomePage,
});

function HomePage() {
  const { user } = useAuthStore();
  const { data } = useNovels(0, 3);
  const novels = data?.items ?? [];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">StoryWriter Studio</h1>
        <p className="text-sm text-gray-500">환영합니다, {user?.email}</p>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <Link
          to="/novels"
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          내 소설 보기
        </Link>
        <Link
          to="/novels"
          className="flex items-center gap-2 px-5 py-2.5 border rounded-lg text-sm font-semibold hover:bg-muted transition-colors"
        >
          <Plus className="w-4 h-4" />
          새 소설 만들기
        </Link>
      </div>

      {/* Recent novels */}
      {novels.length > 0 && (
        <div className="w-full max-w-xl">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">최근 작업</h2>
          <div className="flex flex-col gap-2">
            {novels.map((novel) => (
              <Link
                key={novel.id}
                to="/novels/$novelId"
                params={{ novelId: novel.id }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border hover:bg-muted transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-lg flex-shrink-0">
                  📚
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{novel.title}</p>
                  {novel.genre && <p className="text-xs text-muted-foreground">{novel.genre}</p>}
                </div>
                <PenLine className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
