import { cn } from "@portfolio/ui/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "skeleton-shimmer relative isolate overflow-hidden rounded-none bg-muted",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
