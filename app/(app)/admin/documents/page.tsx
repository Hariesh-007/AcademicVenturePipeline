import { api } from "@/lib/api";
import type { Institution, TechnologyRow } from "@/lib/types";
import { TechnologyTable } from "@/app/(app)/TechnologyTable";
import { Empty, PAGE, PageHeader, Pager, pageOf } from "@/app/(app)/ui";

export default async function DocumentsPage({ searchParams }: PageProps<"/admin/documents">) {
  const { offset, query } = pageOf(await searchParams);
  const [rows, institutions] = await Promise.all([
    api<TechnologyRow[]>(`/technologies?${query}`),
    api<Institution[]>("/institutions"),
  ]);
  return (
    <>
      <PageHeader title="Documents" lede="Every technology uploaded across universities, with processing state." />
      {rows.length ? (
        <>
          <TechnologyTable rows={rows.slice(0, PAGE)} institutions={Object.fromEntries(institutions.map((i) => [i.id, i.name]))} />
          <Pager path="/admin/documents" offset={offset} count={rows.length} />
        </>
      ) : (
        <Empty title="No uploads yet">Maintainers’ uploads appear here as soon as they’re submitted.</Empty>
      )}
    </>
  );
}
