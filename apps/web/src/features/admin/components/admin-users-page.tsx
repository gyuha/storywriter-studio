import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useState } from 'react';
import { useActivateUser, useAdminUsers, useDeactivateUser } from '../hooks/use-admin-users';

const PAGE_SIZE = 20;

export function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useAdminUsers({ page, size: PAGE_SIZE });
  const activateMutation = useActivateUser();
  const deactivateMutation = useDeactivateUser();

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center text-destructive">
        사용자 목록을 불러오지 못했습니다
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">사용자 관리</h1>
        <p className="text-sm text-muted-foreground">전체 사용자 목록을 조회하고 계정을 관리합니다</p>
      </header>

      <section aria-label="사용자 목록" className="rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이메일</TableHead>
              <TableHead>이름</TableHead>
              <TableHead>이메일 인증</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>가입일</TableHead>
              <TableHead className="text-right">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell>{user.display_name ?? '-'}</TableCell>
                <TableCell>
                  <Badge variant={user.is_verified ? 'default' : 'secondary'}>
                    {user.is_verified ? '인증됨' : '미인증'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.is_active ? 'default' : 'destructive'}>
                    {user.is_active ? '활성' : '비활성'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString('ko-KR')}
                </TableCell>
                <TableCell className="text-right">
                  {user.is_active ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deactivateMutation.mutate(user.id)}
                      disabled={deactivateMutation.isPending}
                    >
                      비활성화
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => activateMutation.mutate(user.id)}
                      disabled={activateMutation.isPending}
                    >
                      활성화
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          전체 {data?.total ?? 0}명 / {page} / {totalPages} 페이지
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p - 1)}
            disabled={page <= 1}
          >
            이전
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
          >
            다음
          </Button>
        </div>
      </div>
    </div>
  );
}
