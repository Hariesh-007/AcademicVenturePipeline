import Link from "next/link";
import { api, getMe } from "@/lib/api";
import type { Institution, TechnologyRow } from "@/lib/types";
import { PreviewSwitch } from "@/app/_share/PreviewSwitch";
import { TechnologyTable } from "@/app/(app)/TechnologyTable";
import { Empty, PAGE, PageHeader, Pager, pageOf } from "@/app/(app)/ui";

export default async function UploadsPage({ searchParams }: PageProps<"/uploads">) {
  const { offset, query } = pageOf(await searchParams);
  const [rows, me, institutions] = await Promise.all([api<TechnologyRow[]>(`/technologies?${query}`), getMe(), api<Institution[]>("/institutions")]);
  const uni = institutions.find((i) => i.id === me.institution_id);
  return (
    <>
      <PageHeader
        title="Uploads"
        lede={`Technologies from ${me.institution_name ?? "your university"}. Once a file is read it goes to analysers; confirm the flagged patent details so they can trust them.`}
        actions={<Link href="/uploads/new" className="btn btn-primary">New upload</Link>}
      />
      {uni && (
        <div className="panel mb-6 max-w-[720px] p-4">
          <PreviewSwitch url={`/institutions/${uni.id}/public-previews`} on={uni.public_previews}
            label="Let analysers share our technologies publicly"
            hint="When on, an analyser can share a technology on LinkedIn as a public preview: its title, categories and how many analysers upvoted and reviewed it. Summaries, documents and reviews stay private. You can still hold back any one technology from its page." />
        </div>
      )}
      {rows.length ? (
        <>
          <TechnologyTable rows={rows.slice(0, PAGE)} />
          <Pager path="/uploads" offset={offset} count={rows.length} />
        </>
      ) : (
        <Empty title="Nothing uploaded yet">
          Add a technology with its patent PDF. <Link href="/uploads/new" className="text-blue underline underline-offset-4">Start an upload</Link>.
        </Empty>
      )}
    </>
  );
}
