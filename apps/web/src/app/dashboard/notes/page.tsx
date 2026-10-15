import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { FinancialNotes } from "@/components/financial-notes";

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ noteId?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const { noteId } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 py-4 px-2 sm:px-4">
      <PageHeader
        title="Financial Notes"
        description="Investment research memos, tax planning strategies, FIRE milestones, and household observation notes in an Apple Notes experience."
      />
      <FinancialNotes initialNoteId={noteId} />
    </div>
  );
}
