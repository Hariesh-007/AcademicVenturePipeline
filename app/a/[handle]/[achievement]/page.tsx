import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publicApi } from "@/lib/api";
import type { PublicProfile } from "@/lib/types";
import { Avatar } from "@/app/_profile/Avatar";
import { TierBadge, tierLabel } from "@/app/_profile/Credibility";
import { PublicFrame } from "@/app/_profile/PublicFrame";
import { achievement } from "@/app/_share/achievement";

// The page a shared tier or badge lands on: the achievement first, then who earned it and how
// to join. Public, and 404 for anything the analyser doesn't actually hold.
const load = (handle: string) => publicApi<PublicProfile>(`/profiles/${encodeURIComponent(handle)}`);

export async function generateMetadata({ params }: PageProps<"/a/[handle]/[achievement]">): Promise<Metadata> {
  const { handle, achievement: slug } = await params;
  const p = await load(handle);
  const a = p && achievement(p, slug);
  if (!a) return { title: "Not found · AVP" };
  return {
    title: `${a.title} · AVP`,
    description: a.detail,
    openGraph: { title: a.title, description: a.detail, type: "article" },
    twitter: { card: "summary_large_image", title: a.title, description: a.detail },
  };
}

export default async function AchievementPage({ params, searchParams }: PageProps<"/a/[handle]/[achievement]">) {
  const { handle, achievement: slug } = await params;
  const ref = (await searchParams).ref;
  const p = await load(handle);
  const a = p && achievement(p, slug);
  if (!p || !a) notFound();
  const invitedBy = typeof ref === "string" ? ref : p.handle;

  return (
    <PublicFrame invitedBy={invitedBy}>
      <article className="mx-auto flex max-w-[640px] flex-col items-center text-center">
        {a.kind === "tier" ? (
          <TierBadge tier={a.tier} size={176} label={`${tierLabel(a.tier)} tier`} />
        ) : (
          <span className="grid size-[120px] place-items-center rounded-full border border-blue bg-blue-tint">
            <svg width="52" height="52" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="var(--blue)" strokeWidth="1.6" strokeLinejoin="round">
              <path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.4l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8L12 3z" />
            </svg>
          </span>
        )}
        <h1 className="mt-8 font-serif text-[clamp(32px,5vw,48px)] leading-[1.08] tracking-[-0.02em]">{a.title}</h1>
        <p className="mt-3 max-w-[48ch] text-[17px] text-ink-2">{a.detail}</p>

        <Link href={`/a/${p.handle}`} className="panel mt-10 flex w-full items-center gap-4 p-4 text-left hover:border-rule-strong">
          <Avatar name={p.name} url={p.avatar_url} seed={p.handle} size={56} className="rounded-[8px]" />
          <span className="min-w-0">
            <span className="block font-medium">{p.name}</span>
            <span className="block truncate text-[14px] text-ink-2">{[p.headline, p.organisation].filter(Boolean).join(", ")}</span>
          </span>
          <span className="ml-auto shrink-0 text-[14px] text-blue">View profile</span>
        </Link>

        <section className="mt-12 w-full border-t border-rule pt-8">
          <h2 className="font-serif text-[22px]">Review university inventions with {p.name.split(" ")[0]}</h2>
          <p className="mx-auto mt-2 max-w-[52ch] text-[15px] text-ink-2">
            AVP analysers read patents from universities across the network, judge how close each one is to market, and build a public track record as peers rate their reviews.
          </p>
          <Link href={`/signup?ref=${encodeURIComponent(invitedBy)}`} className="btn btn-primary mt-5">Become an analyser</Link>
        </section>
      </article>
    </PublicFrame>
  );
}
