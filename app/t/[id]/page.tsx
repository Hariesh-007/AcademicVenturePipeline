import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publicApi } from "@/lib/api";
import { currentSession } from "@/lib/currentSession";
import type { PublicTechnology } from "@/lib/types";
import { TierBadge, tierLabel } from "@/app/_profile/Credibility";
import { PublicFrame } from "@/app/_profile/PublicFrame";

// Public teaser for a shared technology. Only exists when the university opted in and didn't
// hold this one back. Deliberately thin: title, university, categories and counts. The summary,
// documents, claims and reviews stay behind sign-in.
const load = (id: string, ref?: string) =>
  publicApi<PublicTechnology>(`/public/technologies/${encodeURIComponent(id)}${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`);

export async function generateMetadata({ params }: PageProps<"/t/[id]">): Promise<Metadata> {
  const t = await load((await params).id);
  if (!t) return { title: "Technology not found · AVP" };
  const description = `From ${t.institution_name}. ${t.ups} ${t.ups === 1 ? "upvote" : "upvotes"} and ${t.review_count} ${t.review_count === 1 ? "review" : "reviews"} from AVP analysers.`;
  return {
    title: `${t.title} · AVP`,
    description,
    openGraph: { title: t.title, description, type: "article" },
    twitter: { card: "summary_large_image", title: t.title, description },
  };
}

export default async function TechnologyTeaser({ params, searchParams }: PageProps<"/t/[id]">) {
  const { id } = await params;
  const ref = (await searchParams).ref;
  const t = await load(id, typeof ref === "string" ? ref : undefined);
  if (!t) notFound();
  const signedIn = (await currentSession()) !== null;
  const by = t.shared_by;

  return (
    <PublicFrame invitedBy={by?.handle}>
      <article className="mx-auto max-w-[720px]">
        <p className="text-[15px] text-ink-2">{t.institution_name}</p>
        <h1 className="mt-2 font-serif text-[clamp(32px,5vw,52px)] leading-[1.06] tracking-[-0.02em]">{t.title}</h1>
        {t.categories.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2">
            {t.categories.map((c) => <li key={c} className="chip">{c}</li>)}
          </ul>
        )}

        <dl className="mt-8 flex gap-10 border-y border-rule py-5">
          <div>
            <dt className="text-[13px] text-ink-2">Upvoted by</dt>
            <dd className="mt-1"><span className="font-serif text-[34px] leading-none tabular-nums">{t.ups}</span> <span className="text-[14px] text-ink-2">{t.ups === 1 ? "analyser" : "analysers"}</span></dd>
          </div>
          <div>
            <dt className="text-[13px] text-ink-2">Reviewed by</dt>
            <dd className="mt-1"><span className="font-serif text-[34px] leading-none tabular-nums">{t.review_count}</span> <span className="text-[14px] text-ink-2">{t.review_count === 1 ? "analyser" : "analysers"}</span></dd>
          </div>
        </dl>

        {by && (
          <Link href={`/a/${by.handle}`} className="mt-6 flex w-fit items-center gap-2.5 text-[14px] text-ink-2 hover:text-ink">
            <TierBadge tier={by.tier} size={28} />
            <span>Shared by <span className="font-medium text-ink">{by.name}</span>, {tierLabel(by.tier)} analyser</span>
          </Link>
        )}

        <section className="panel mt-10 p-6">
          <h2 className="font-serif text-[22px]">The full record is for AVP analysers</h2>
          <p className="mt-2 max-w-[56ch] text-[15px] text-ink-2">
            Analysers read the patent documents, judge how ready the technology is for market and compare reviews with peers. Join to read this one and add your own view.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {signedIn ? (
              <Link href={`/library/${t.id}`} className="btn btn-primary">Open in the library</Link>
            ) : (
              <>
                <Link href={by ? `/signup?ref=${encodeURIComponent(by.handle)}` : "/signup"} className="btn btn-primary">Become an analyser</Link>
                <Link href={`/login?next=${encodeURIComponent(`/library/${t.id}`)}`} className="btn">Sign in</Link>
              </>
            )}
          </div>
        </section>
      </article>
    </PublicFrame>
  );
}
