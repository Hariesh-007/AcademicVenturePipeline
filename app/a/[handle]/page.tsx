import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publicApi } from "@/lib/api";
import type { PublicProfile } from "@/lib/types";
import { Avatar } from "@/app/_profile/Avatar";
import { CredibilitySection, TierBadge, tierLabel } from "@/app/_profile/Credibility";
import { countryName, INTERESTS, label, ORG_TYPES, SENIORITY, SOCIALS } from "@/app/_profile/meta";
import { PublicFrame } from "@/app/_profile/PublicFrame";
import { captions, withRef } from "@/app/_share/links";
import { ShareButton } from "@/app/_share/ShareButton";
import { FollowButton } from "@/app/_community/FollowButton";
import { apiIfSignedIn, type Me } from "@/lib/api";
import { currentSession } from "@/lib/currentSession";
import type { Follows } from "@/lib/types";

// Public by design. The API already strips email, hidden links and anything naming the
// technologies someone reviewed; this page only lays out what it is given.
const load = (handle: string) => publicApi<PublicProfile>(`/profiles/${encodeURIComponent(handle)}`);

export async function generateMetadata({ params }: PageProps<"/a/[handle]">): Promise<Metadata> {
  const p = await load((await params).handle);
  if (!p) return { title: "Analyst not found · AVP" };
  const description = [p.headline, p.organisation].filter(Boolean).join(", ");
  return {
    title: `${p.name} · AVP analyst`,
    description,
    openGraph: { title: p.name, description, type: "profile", images: p.avatar_url ? [p.avatar_url] : [] },
    twitter: { card: "summary", title: p.name, description },
  };
}

function Fact({ term, children }: { term: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="flex justify-between gap-6 border-b border-rule py-3 text-[14px] last:border-0">
      <dt className="text-ink-2">{term}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

export default async function AnalystPage({ params, searchParams }: PageProps<"/a/[handle]">) {
  const p = await load((await params).handle);
  const ref = (await searchParams).ref;
  if (!p) notFound();
  // signed-in visitors can follow; the page itself stays public
  const session = await currentSession();
  // a stale or revoked cookie just means "visitor": a public page never bounces to sign-in
  const [me, follows] = session
    ? await Promise.all([apiIfSignedIn<Me>("/auth/me"), apiIfSignedIn<Follows>("/me/follows")])
    : [null, null];
  const since = new Date(p.member_since).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const role = [p.job_title, p.organisation].filter(Boolean).join(" at ");
  const links = SOCIALS.filter((s) => p.socials[s.key]);

  return (
    <PublicFrame invitedBy={typeof ref === "string" ? ref : undefined}>
      <article>
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end">
          <span className="relative w-fit">
            <Avatar name={p.name} url={p.avatar_url} seed={p.handle} size={128} className="rounded-[10px]" />
            {p.credibility && (
              <span className="absolute -bottom-3 -right-3 rounded-full bg-canvas p-0.5">
                <TierBadge tier={p.credibility.tier} size={52} label={`${tierLabel(p.credibility.tier)} tier`} />
              </span>
            )}
          </span>
          <div className="min-w-0">
            <p className="data text-ink-2">
              @{p.handle}
              {p.credibility && <span className="ml-3 font-sans text-[13px] text-blue">{tierLabel(p.credibility.tier)}</span>}
            </p>
            <h1 className="mt-1 font-serif text-[clamp(36px,6vw,56px)] leading-[1.02] tracking-[-0.02em]">{p.name}</h1>
            <p className="mt-3 max-w-[56ch] text-[17px] text-ink-2">{p.headline}</p>
            {follows && me?.id !== p.id && (
              <div className="mt-4">
                <FollowButton type="analyst" id={p.id} initial={follows.analysts.some((a) => a.id === p.id)} />
              </div>
            )}
            {me?.id === p.id && (
              <div className="mt-4">
                <ShareButton path={withRef(`/a/${p.handle}`, p.handle)} caption={captions.profile()} label="Share my profile" align="left" />
              </div>
            )}
          </div>
        </header>

        {p.credibility && (
          <section className="mt-12 border-t border-rule pt-8" aria-label="Standing">
            <CredibilitySection c={p.credibility} share={me?.id === p.id ? p.handle : undefined} />
          </section>
        )}

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-10">
            {p.bio && (
              <section>
                <h2 className="label">About</h2>
                <p className="max-w-[62ch] whitespace-pre-line font-serif text-[19px] leading-[1.55]">{p.bio}</p>
              </section>
            )}
            <section>
              <h2 className="label">Expertise</h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {p.categories.map((c) => (
                  <li key={c.id}><Link href={`/analysts?category=${c.id}`} className="chip chip-on hover:underline">{c.name}</Link></li>
                ))}
              </ul>
            </section>
            {p.interests.length > 0 && (
              <section>
                <h2 className="label">Looking for</h2>
                <p className="text-[15px]">{p.interests.map((i) => label(INTERESTS, i)).join(", ")}</p>
              </section>
            )}
          </div>

          <aside className="flex flex-col gap-6">
            <dl className="panel px-5 py-1">
              <Fact term="Role">{role}</Fact>
              <Fact term="Organisation type">{label(ORG_TYPES, p.org_type)}</Fact>
              <Fact term="Seniority">{label(SENIORITY, p.seniority)}</Fact>
              <Fact term="Experience">{p.years_experience != null && `${p.years_experience} ${p.years_experience === 1 ? "year" : "years"}`}</Fact>
              <Fact term="Based in">{countryName(p.country)}</Fact>
              <Fact term="Reviews submitted"><span className="data">{p.reviews_submitted}</span></Fact>
              <Fact term="Analyser since">{since}</Fact>
            </dl>
            {links.length > 0 && (
              <ul className="flex flex-col gap-1">
                {links.map((s) => (
                  <li key={s.key}>
                    <a href={p.socials[s.key]} rel="me nofollow noopener noreferrer" target="_blank"
                      className="btn btn-quiet btn-sm w-full justify-between">
                      {s.label}<span className="truncate text-ink-3">{p.socials[s.key]!.replace(/^https:\/\/(www\.)?/, "")}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </article>
    </PublicFrame>
  );
}
