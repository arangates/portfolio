import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@portfolio/ui/components/card";
import { DataTableFrame } from "@/components/data-table/data-table-frame";

export function TableCard({
  title,
  description,
  action,
  children,
  className,
  dataTable = true,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  dataTable?: boolean;
}) {
  return (
    <Card className={`min-w-0 gap-0 overflow-hidden py-0 shadow-xs ${className ?? ""}`}>
      <CardHeader className="border-b px-4 py-4 sm:px-5">
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {action}
      </CardHeader>
      <CardContent className="min-w-0 px-0">
        {dataTable ? <DataTableFrame>{children}</DataTableFrame> : children}
      </CardContent>
    </Card>
  );
}
