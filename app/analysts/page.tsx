import type { Metadata } from "next";
import Link from "next/link";
import { publicApi } from "@/lib/api";
import type { Category, PublicProfile } from "@/lib/types";
import { Avatar } from "@/app/_profile/Avatar";
import { TierBadge, tierLabel } from "@/app/_profile/Credibility";
import { label, ORG_TYPES } from "@/app/_profile/meta";
import { PublicFrame } from "@/app/_profile/PublicFrame";

export const metadata: Metadata = {
  title: "Analysts · AVP",
  description: "The people assessing university technologies on the Academic Venture Pipeline.",
};

export default async function AnalystsPage({ searchParams }: PageProps<"/analysts">) {
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const [q, category, orgType] = [one("q"), one("category"), one("org_type")];
  const query = new URLSearchParams(Object.entries({ q, category, org_type: orgType }).filter(([, v]) => v));
  const [people, categories] = await Promise.all([
    publicApi<PublicProfile[]>(`/profiles?${query}`),
    publicApi<Category[]>("/categories"),
  ]);

  return (
    <PublicFrame>
      <h1 className="font-serif text-[clamp(32px,5vw,44px)] leading-[1.05] tracking-[-0.01em]">Analysts</h1>
      <p className="mt-2 max-w-[60ch] text-[16px] text-ink-2">
        Industry scouts, investors, tech-transfer staff and researchers who read university inventions and say what they&apos;re worth.
      </p>

      {/* plain GET form: filters live in the URL, work without JavaScript and can be shared */}
      <form className="mt-8 grid gap-3 sm:grid-cols-[1fr_220px_200px_auto]" role="search">
        <label className="sr-only" htmlFor="q">Search analysts</label>
        <input id="q" name="q" defaultValue={q} placeholder="Name, organisation or headline" className="input" />
        <label className="sr-only" htmlFor="category">Expertise</label>
        <select id="category" name="category" defaultValue={category} className="input">
          <option value="">All expertise</option>
          {(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="sr-only" htmlFor="org_type">Organisation type</label>
        <select id="org_type" name="org_type" defaultValue={orgType} className="input">
          <option value="">All organisations</option>
          {ORG_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button className="btn">Filter</button>
      </form>

      {!people?.length ? (
        <div className="mt-10 rounded-[10px] border border-dashed border-rule-strong px-6 py-12 text-center">
          <p className="font-serif text-[20px]">No analysts match those filters</p>
          <p className="mt-2 text-[14px] text-ink-2">
            Try fewer filters, or <Link href="/signup" className="text-blue hover:underline">join as the first</Link>.
          </p>
        </div>
      ) : (
        <ul className="mt-10 grid gap-x-8 gap-y-2 md:grid-cols-2">
          {people.map((p) => (
            <li key={p.handle}>
              <Link href={`/a/${p.handle}`} className="group flex gap-4 rounded-[10px] p-3 -mx-3 hover:bg-surface">
                <Avatar name={p.name} url={p.avatar_url} seed={p.handle} size={56} />
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-serif text-[19px] leading-tight">
                    <span className="group-hover:underline">{p.name}</span>
                    {p.credibility && <TierBadge tier={p.credibility.tier} size={20} label={`${tierLabel(p.credibility.tier)} tier`} />}
                  </p>
                  <p className="mt-0.5 truncate text-[14px] text-ink-2">{p.headline}</p>
                  <p className="mt-1 text-[13px] text-ink-3">
                    {[p.organisation, label(ORG_TYPES, p.org_type)].filter(Boolean).join(", ")}
                    {p.categories.length > 0 && `. ${p.categories.slice(0, 3).map((c) => c.name).join(", ")}`}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PublicFrame>
  );
}
