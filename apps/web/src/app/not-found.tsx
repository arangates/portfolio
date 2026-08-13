import { Button } from "@zerodha-coin/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@zerodha-coin/ui/components/empty";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Page not found</EmptyTitle>
          <EmptyDescription>The requested portfolio page does not exist.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<a href="/dashboard" />} nativeButton={false}>
            Return to dashboard
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
