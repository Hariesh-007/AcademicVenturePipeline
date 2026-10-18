import type { Tier } from "@/lib/api";
import type { PublicProfile } from "@/lib/types";
import { TIERS } from "@/app/_profile/Credibility";

export type Achievement =
  | { kind: "tier"; tier: Tier; title: string; detail: string }
  | { kind: "badge"; badge: string; title: string; detail: string };

/** "tier-expert" | "badge-ambassador" -> what this analyser actually holds, else null (404).
 *  A tier counts once reached, even if they've since moved past it. */
export function achievement(p: PublicProfile, slug: string): Achievement | null {
  const [kind, ...rest] = slug.split("-");
  const key = rest.join("-");
  const c = p.credibility;
  if (!c) return null;
  if (kind === "tier") {
    const at = TIERS.findIndex((t) => t.tier === c.tier);
    const i = TIERS.findIndex((t) => t.tier === key);
    if (i < 1 || i > at) return null; // Newcomer is where everyone starts: nothing to share
    return { kind, tier: TIERS[i].tier, title: `${p.name} reached ${TIERS[i].label}`,
      detail: `${TIERS[i].floor}+ reputation, earned when other analysers found their reviews helpful.` };
  }
  if (kind === "badge") {
    const b = c.badges.find((x) => x.badge === key);
    return b ? { kind, badge: key, title: `${p.name} earned ${b.label}`, detail: `${b.description}.` } : null;
  }
  return null;
}
