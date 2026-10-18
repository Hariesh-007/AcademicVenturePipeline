import type { Metadata } from "next";
import { api } from "@/lib/api";
import type { Band, Category, Rewards } from "@/lib/types";
import { ChallengeForm } from "@/app/_community/ChallengeForm";
import { ActivityGrid, TierLadder, TierShowcase } from "@/app/_profile/Credibility";
import { PageHeader } from "@/app/(app)/ui";

export const metadata: Metadata = { title: "Rewards · AVP" };

const BAND: Record<Band["band"], { label: string; steps: number }> = {
  top10: { label: "Top 10%", steps: 4 },
  top25: { label: "Top 25%", steps: 3 },
  top50: { label: "Top 50%", steps: 2 },
  building: { label: "Building", steps: 1 },
};

/** Four steps, same grammar as the tier ladder: reached = solid, the rest dashed. */
function BandMeter({ band }: { band: Band }) {
  const { label, steps } = BAND[band.band];
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex gap-0.5" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={`h-3 w-2 rounded-[2px] ${i <= steps ? "bg-blue" : "border border-dashed border-rule-strong"}`} />
        ))}
      </span>
      <span className="text-[13.5px] font-medium">{label}</span>
    </span>
  );
}

function Section({ title, lede, children }: { title: string; lede?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 border-t border-rule py-8 lg:grid-cols-[240px_1fr]">
      <div>
        <h2 className="font-serif text-[20px] leading-tight">{title}</h2>
        {lede && <p className="mt-1 text-[14px] text-ink-2">{lede}</p>}
      </div>
      <div className="min-w-0 max-w-[760px]">{children}</div>
    </section>
  );
}

export default async function RewardsPage() {
  const r = await api<Rewards>("/me/rewards");
  const fellow = r.credibility.tier === "fellow";
  const categories = fellow ? await api<Category[]>("/categories") : [];
  const c = r.credibility;
  const s = r.standing;
  const pts = r.rules.points;

  return (
    <>
      <PageHeader
        title="Rewards"
        lede="Where you stand, what you've earned, and what moves you forward. There's no leaderboard: you're compared in broad bands, never by name or position."
      />

      <Section title="Standing">
        <div className="grid gap-8 md:grid-cols-[1.3fr_1fr]">
          <TierLadder reputation={c.reputation} tier={c.tier}
            next={{ tier: c.next_tier, to_next: c.to_next, unlocks: c.next_unlocks }} />
          <div className="flex flex-col gap-4">
            <div>
              <p className="font-serif text-[28px] leading-none">
                {s.band === "building" ? "Building" : BAND[s.band].label}
              </p>
              <p className="mt-2 text-[14px] text-ink-2">
                {s.population < r.rules.min_population
                  ? `Bands appear once at least ${r.rules.min_population} analysts are active.`
                  : s.band === "building"
                    ? `of ${s.population} analysts by reputation. Everyone starts here; the tips below are the quickest way up.`
                    : `of ${s.population} analysts by reputation.`}
              </p>
            </div>
            {r.cohorts.length > 0 && (
              <ul className="flex flex-col gap-2 border-t border-rule pt-3">
                {r.cohorts.map((k) => (
                  <li key={k.category} className="flex items-center justify-between gap-4 text-[14px]">
                    <span className="text-ink-2">Among {k.category} analysts</span>
                    <BandMeter band={k.band} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Section>

      {fellow && (
        <Section title="Propose a challenge" lede="As a Fellow you can suggest a community goal. An admin reviews it before it goes live.">
          <ChallengeForm categories={categories} mode="propose" />
        </Section>
      )}

      <Section title="Tiers" lede="Four badges, one for each stage of the structure rising from the wave in our mark. Each one opens something new.">
        <TierShowcase reputation={c.reputation} tier={c.tier} unlocks={r.rules.unlocks} />
      </Section>

      <Section title="Skills" lede="Reputation is the sum. These are the habits behind it, each banded against other analysts.">
        <ul className="flex flex-col">
          {r.skills.map((k) => (
            <li key={k.key} className="grid gap-1 border-b border-rule py-3 last:border-0 sm:grid-cols-[160px_1fr_auto] sm:items-center sm:gap-6">
              <span className="text-[15px] font-medium">{k.label}</span>
              <span className="text-[14px] text-ink-2">{k.detail}</span>
              <BandMeter band={k.band} />
            </li>
          ))}
        </ul>
      </Section>

      <Section title="How to improve" lede="Ordered by what will move you most right now.">
        <ol className="flex flex-col gap-3">
          {r.tips.map((t, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
              <span className="data mt-0.5 text-ink-3">{i + 1}</span>
              <span className="max-w-[64ch]">{t}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Badges">
        <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {r.badges.map((b) => (
            <li key={b.badge} className={b.earned ? "" : "text-ink-2"}>
              <p className="flex items-baseline justify-between gap-3">
                <span className={`text-[14px] font-medium ${b.earned ? "text-ink" : ""}`}>{b.label}</span>
                <span className="text-[12.5px]">{b.earned ? "Earned" : b.target ? `${b.progress} of ${b.target}` : ""}</span>
              </p>
              <p className="text-[13px] text-ink-2">{b.description}</p>
              {!b.earned && b.target && (
                <span className="mt-1.5 block h-1 rounded-full bg-sunken" aria-hidden>
                  <span className="block h-1 rounded-full bg-blue" style={{ width: `${(100 * (b.progress ?? 0)) / b.target}%` }} />
                </span>
              )}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Activity">
        <ActivityGrid activity={c.activity} streak={c.streak_weeks} />
      </Section>

      <Section title="How it works" lede="The same rules for everyone. They reward judgement other people found useful, not volume.">
        <div className="flex flex-col gap-8">
          <div>
            <h3 className="label">Earning reputation</h3>
            <dl className="mt-1 text-[14px]">
              {[
                ["Submit a review", `+${pts.review_submitted}`],
                ["A peer marks your review helpful", `+${pts.helpful}, ×${r.rules.mark_weight.newcomer} from a Newcomer, ×${r.rules.mark_weight.expert} from an Expert or Fellow`],
                ["Your verdict is confirmed by a final dossier", `+${pts.calibration}`],
                ["Read closely before you review", "+1 for each extra minimum-length read past the first, up to +5 a review and +15 a day, paid when you submit"],
                ["Vote on a technology", "Nothing: votes are quick, so they don't count"],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-wrap justify-between gap-x-6 border-b border-rule py-2.5 last:border-0">
                  <dt className="text-ink-2">{k}</dt>
                  <dd className="text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="text-[14px] leading-relaxed text-ink-2">
            <h3 className="label text-ink">Fair play</h3>
            <p>
              You can only mark reviews of technologies you have reviewed yourself, never your own. Only the first {r.rules.pair_cap.marks} marks
              from one analyst to another in {r.rules.pair_cap.days} days earn reputation, so friends can&apos;t trade it. Removing a mark takes back
              exactly what it gave. Ranks are shown in bands, not positions, because a public league table pushes people to chase rank instead of
              writing careful reviews.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
