import "server-only";

import { db } from "@portfolio/db";
import { sql } from "drizzle-orm";

export type SourceDocument = {
  id: string;
  sourceType: string;
  fileName: string;
  createdAt: string;
  importStatus: string | null;
  archiveStatus: string | null;
  archiveId: string | null;
  rowCount: number | null;
  insertedRows: number | null;
  skippedRows: number | null;
};

// Import success and Drive storage are independent: never hide an import because
// archiving was disabled, disconnected or unsuccessful. Join only within this user.
export async function getSourceDocumentHistory(userId: string, page: number) {
  const result = await db.execute<SourceDocument>(sql`
    with imports as (
      select id::text, kind as source_type, file_name, created_at, status,
        row_count, inserted_rows, skipped_rows from import_batch where user_id = ${userId}
      union all
      select id::text, 'salary_payslip', file_name, created_at, status,
        null::integer, null::integer, null::integer from salary_import where user_id = ${userId}
      union all
      select id::text, 'india_income_tax', file_name, created_at, status,
        null::integer, null::integer, null::integer from income_tax_import where user_id = ${userId}
      union all
      select id::text, 'netherlands_income_tax', file_name, created_at, status,
        null::integer, null::integer, null::integer from netherlands_tax_import where user_id = ${userId}
      union all
      select id::text, 'bank_statement', file_name, created_at, status,
        row_count, inserted_rows, skipped_rows from bank_statement_import where user_id = ${userId}
    ), archives as (
      select * from document_archive where user_id = ${userId}
    )
    select coalesce(i.source_type, a.source_type) || ':' || coalesce(i.id, a.source_id) as id,
      coalesce(i.source_type, a.source_type) as "sourceType",
      coalesce(i.file_name, a.file_name) as "fileName",
      coalesce(i.created_at, a.created_at) as "createdAt",
      i.status as "importStatus", a.status as "archiveStatus", a.id as "archiveId",
      i.row_count as "rowCount", i.inserted_rows as "insertedRows", i.skipped_rows as "skippedRows"
    from imports i full join archives a on a.source_id = i.id and a.source_type = i.source_type
    order by coalesce(i.created_at, a.created_at) desc, coalesce(i.id, a.source_id) desc
    limit 51 offset ${(page - 1) * 50}
  `);
  return { documents: result.rows.slice(0, 50), hasNext: result.rows.length > 50 };
}
