import { publicApi } from "@/lib/api";
import type { PublicProfile } from "@/lib/types";
import { achievement } from "@/app/_share/achievement";
import { shareCard } from "@/app/_share/card";

export { contentType, size } from "@/app/_share/card";
export const alt = "An achievement on the Academic Venture Pipeline";

export default async function Image({ params }: { params: Promise<{ handle: string; achievement: string }> }) {
  const { handle, achievement: slug } = await params;
  const p = await publicApi<PublicProfile>(`/profiles/${encodeURIComponent(handle)}`);
  const a = p && achievement(p, slug);
  if (!a) return shareCard({ kicker: "Academic Venture Pipeline", title: "Analysers reviewing university inventions" });
  return shareCard({
    kicker: a.kind === "tier" ? "New tier on AVP" : "New badge on AVP",
    title: a.title,
    detail: a.detail,
    tier: a.kind === "tier" ? a.tier : p.credibility?.tier !== "newcomer" ? p.credibility?.tier : undefined,
  });
}
