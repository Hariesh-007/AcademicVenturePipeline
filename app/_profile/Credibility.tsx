// Reputation made visible: where you stand, what the next tier unlocks, what you've earned,
// and how steadily you work. No leaderboard by design: it compares you with your own past.
import type { Tier } from "@/lib/api";
import type { Badge, PublicCredibility } from "@/lib/types";
import { captions, withRef } from "@/app/_share/links";
import { ShareButton } from "@/app/_share/ShareButton";

export const TIERS: { tier: Tier; label: string; floor: number }[] = [
  { tier: "newcomer", label: "Newcomer", floor: 0 },
  { tier: "contributor", label: "Contributor", floor: 30 },
  { tier: "expert", label: "Expert", floor: 250 },
  { tier: "fellow", label: "Fellow", floor: 1000 },
];
export const tierLabel = (t: Tier | null) => TIERS.find((x) => x.tier === t)?.label ?? "";

type BadgeState = "current" | "earned" | "locked";

/** The tier medallion (docs/design/tier-badges-prompt.md). Locked tiers are desaturated behind
 *  the app's dashed "missing" ring; your current tier gets a solid blue ring. Decorative by
 *  default: put the tier name in text next to it, or pass `label` when it stands alone. */
export function TierBadge({ tier, size = 24, state = "earned", label }: {
  tier: Tier; size?: number; state?: BadgeState; label?: string;
}) {
  const src = `/brand/tiers/${tier}${size <= 48 ? "-sm" : ""}.webp`;
  const ring = state === "current" ? "ring-2 ring-blue ring-offset-2 ring-offset-[var(--surface)]"
    : state === "locked" ? "outline-1 outline-dashed outline-rule-strong outline-offset-2" : "";
  return (
    // eslint-disable-next-line @next/next/no-img-element -- small static badge, pre-sized webp
    <img src={src} width={size} height={size} alt={label ?? ""} aria-hidden={label ? undefined : true}
      title={label ?? `${tierLabel(tier)} tier`}
      className={`inline-block shrink-0 rounded-full ${ring} ${state === "locked" ? "opacity-45 grayscale" : ""}`}
      style={{ width: size, height: size }} />
  );
}

/** The four badges in order: what you hold, what's next and what it opens. */
export function TierLadder({ reputation, tier, next, share }: {
  reputation: number;
  tier: Tier;
  next?: { tier: Tier | null; to_next: number | null; unlocks: string | null };
  share?: string; // your handle: offers to share the tier you've reached (not Newcomer)
}) {
  const at = TIERS.findIndex((t) => t.tier === tier);
  return (
    <div>
      <div className="flex items-center gap-4">
        <TierBadge tier={tier} size={64} state="current" />
        <p>
          <span className="block font-serif text-[28px] leading-none">{tierLabel(tier)}</span>
          <span className="data mt-1.5 block text-ink-2">{reputation} reputation</span>
        </p>
        {share && tier !== "newcomer" && (
          <div className="ml-auto">
            <ShareButton path={withRef(`/a/${share}/tier-${tier}`, share)} caption={captions.tier(tier)} label={`Share ${tierLabel(tier)}`} size="sm" />
          </div>
        )}
      </div>
      <ol className="mt-5 grid grid-cols-4 gap-2" aria-label="Tiers">
        {TIERS.map((t, i) => (
          <li key={t.tier} aria-current={i === at ? "step" : undefined} className="flex flex-col items-center gap-1.5 text-center">
            <TierBadge tier={t.tier} size={40} state={i === at ? "current" : i < at ? "earned" : "locked"} />
            <span className={`text-[12.5px] leading-tight ${i <= at ? "text-ink" : "text-ink-3"}`}>
              {t.label}
              <span className="data block text-[11.5px]">{t.floor}+</span>
            </span>
          </li>
        ))}
      </ol>
      {next?.tier && next.to_next != null && (
        <p className="mt-4 max-w-[60ch] text-[14px] text-ink-2">
          {next.to_next} more reputation to {tierLabel(next.tier)}, which opens {next.unlocks}.
          Reputation comes from other analysts marking your reviews helpful.
        </p>
      )}
    </div>
  );
}

/** All four tiers as a collection: badge, threshold, what it opens, and where you stand. */
export function TierShowcase({ reputation, tier, unlocks }: {
  reputation: number; tier: Tier; unlocks: Record<string, string>;
}) {
  const at = TIERS.findIndex((t) => t.tier === tier);
  return (
    <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="All tiers">
      {TIERS.map((t, i) => {
        const state: BadgeState = i === at ? "current" : i < at ? "earned" : "locked";
        return (
          <li key={t.tier} aria-current={state === "current" ? "step" : undefined}
            className={`flex flex-col items-center gap-3 rounded-[10px] border p-5 text-center ${
              state === "current" ? "border-blue bg-blue-tint" : state === "locked" ? "border-dashed border-rule-strong" : "border-rule"}`}>
            <TierBadge tier={t.tier} size={112} state={state} />
            <div>
              <p className="font-serif text-[20px] leading-tight">{t.label}</p>
              <p className="data mt-0.5 text-[12.5px] text-ink-2">{t.floor}+ reputation</p>
            </div>
            <p className="text-[13.5px] text-ink-2 first-letter:uppercase">
              {t.tier === "newcomer" ? "Summaries, votes and reviews" : unlocks[t.tier]}
            </p>
            <p className={`mt-auto text-[13px] font-medium ${state === "locked" ? "text-ink-3" : "text-blue"}`}>
              {state === "current" ? "Your tier" : state === "earned" ? "Reached" : `${t.floor - reputation} more to go`}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

const month = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });

export function Badges({ badges, share }: { badges: Badge[]; share?: string }) {
  if (!badges.length) return <p className="text-[14px] text-ink-2">No badges yet. A first submitted review earns one.</p>;
  return (
    <ul className="flex flex-col">
      {badges.map((b) => (
        <li key={b.badge} className="flex items-center justify-between gap-4 border-b border-rule py-2.5 last:border-0">
          <span>
            <span className="text-[14px] font-medium">{b.label}</span>
            <span className="block text-[13px] text-ink-2">{b.description}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-[12.5px] text-ink-3">
            {month.format(new Date(b.awarded_at))}
            {share && (
              <ShareButton path={withRef(`/a/${share}/badge-${b.badge}`, share)} caption={captions.badge(b.label, b.description)}
                label="Share" size="sm" />
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

// one hue, light -> dark against the empty-cell surface (sequential = magnitude)
const LEVELS = ["var(--sunken)", ...[35, 60, 80, 100].map((p) => `color-mix(in srgb, var(--blue) ${p}%, var(--sunken))`)];
const level = (n: number) => (n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 6 ? 3 : 4);
const DAY = 86_400_000;
const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const monFmt = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });

/** 53 weeks x 7 days, Monday first, ending with the current week (UTC). */
export function ActivityGrid({ activity, streak }: { activity: Record<string, number>; streak: number }) {
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  const monday = new Date(today.getTime() - ((today.getUTCDay() + 6) % 7) * DAY);
  const start = monday.getTime() - 52 * 7 * DAY;
  const weeks = Array.from({ length: 53 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => new Date(start + (w * 7 + d) * DAY)));
  const active = Object.values(activity).filter((n) => n > 0).length;
  const summary = `${active} active ${active === 1 ? "day" : "days"} in the last year. ${
    streak ? `Active ${streak} ${streak === 1 ? "week" : "weeks"} in a row.` : "No current streak."}`;

  return (
    <figure>
      <div className="overflow-x-auto pb-1">
        <div role="img" aria-label={summary} className="inline-grid grid-flow-col gap-[2px]"
          style={{ gridTemplateRows: "14px repeat(7, 10px)" }}>
          {weeks.map((days, w) => {
            const first = days[0];
            const showMonth = first.getUTCDate() <= 7;
            return [
              <span key={`m${w}`} aria-hidden className="w-[10px] overflow-visible whitespace-nowrap text-[10.5px] leading-none text-ink-3">
                {showMonth ? monFmt.format(first) : ""}
              </span>,
              ...days.map((d) => {
                const key = d.toISOString().slice(0, 10);
                const n = activity[key] ?? 0;
                const future = d > today;
                return (
                  <span key={key} title={future ? undefined : `${n} ${n === 1 ? "action" : "actions"} on ${dayFmt.format(d)}`}
                    className="size-[10px] rounded-[2px]"
                    style={{ background: future ? "transparent" : LEVELS[level(n)] }} />
                );
              }),
            ];
          })}
        </div>
      </div>
      <figcaption className="mt-2 flex flex-wrap items-center justify-between gap-3 text-[13px] text-ink-2">
        <span>{summary}</span>
        <span className="flex items-center gap-1" aria-hidden>
          Less {LEVELS.map((c) => <span key={c} className="size-[10px] rounded-[2px]" style={{ background: c }} />)} More
        </span>
      </figcaption>
    </figure>
  );
}

/** The full block: account page and public profile share it. */
export function CredibilitySection({ c, next, share }: {
  c: PublicCredibility;
  next?: { tier: Tier | null; to_next: number | null; unlocks: string | null };
  share?: string; // the owner's handle, only on their own view: adds share actions
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      <div className="flex flex-col gap-8">
        <TierLadder reputation={c.reputation} tier={c.tier} next={next} share={share} />
        <ActivityGrid activity={c.activity} streak={c.streak_weeks} />
      </div>
      <div>
        <h3 className="label">Badges</h3>
        <Badges badges={c.badges} share={share} />
      </div>
    </div>
  );
}
