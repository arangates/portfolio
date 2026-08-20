export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 px-4 sm:flex-row sm:items-start sm:justify-between lg:px-6">
      <div className="min-w-0 space-y-1">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
      </div>
      {action ? (
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {action}
        </div>
      ) : null}
    </div>
  );
}
