import { createFileRoute } from '@tanstack/react-router';
import { WorldPage } from '@/features/world/components/world-page';

export const Route = createFileRoute('/_authenticated/novels/$novelId/world/')({
  component: WorldIndexPage,
});

function WorldIndexPage() {
  const { novelId } = Route.useParams();
  return <WorldPage novelId={novelId} />;
}
