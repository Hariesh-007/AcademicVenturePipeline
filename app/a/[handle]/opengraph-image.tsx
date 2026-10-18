import { publicApi } from "@/lib/api";
import type { PublicProfile } from "@/lib/types";
import { tierLabel } from "@/app/_profile/Credibility";
import { shareCard } from "@/app/_share/card";

export { contentType, size } from "@/app/_share/card";
export const alt = "An analyser's profile on the Academic Venture Pipeline";

export default async function Image({ params }: { params: Promise<{ handle: string }> }) {
  const p = await publicApi<PublicProfile>(`/profiles/${encodeURIComponent((await params).handle)}`);
  if (!p) return shareCard({ kicker: "Academic Venture Pipeline", title: "Analysers reviewing university inventions" });
  const tier = p.credibility?.tier;
  return shareCard({
    kicker: tier ? `${tierLabel(tier)} analyser on AVP` : "Analyser on AVP",
    title: p.name,
    detail: [p.headline, p.organisation].filter(Boolean).join(", ") || undefined,
    tier: tier && tier !== "newcomer" ? tier : undefined,
    stats: [[String(p.reviews_submitted), p.reviews_submitted === 1 ? "review" : "reviews"],
      [String(p.credibility?.badges.length ?? 0), (p.credibility?.badges.length ?? 0) === 1 ? "badge" : "badges"]],
  });
}
