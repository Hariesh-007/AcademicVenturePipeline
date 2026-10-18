import { publicApi } from "@/lib/api";
import type { PublicTechnology } from "@/lib/types";
import { shareCard } from "@/app/_share/card";

export { contentType, size } from "@/app/_share/card";
export const alt = "A university technology on the Academic Venture Pipeline";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const t = await publicApi<PublicTechnology>(`/public/technologies/${encodeURIComponent((await params).id)}`);
  if (!t) return shareCard({ kicker: "Academic Venture Pipeline", title: "University inventions, reviewed by analysers" });
  return shareCard({
    kicker: t.institution_name,
    title: t.title,
    detail: t.categories.length > 3
      ? `${t.categories.slice(0, 3).join(", ")} and ${t.categories.length - 3} more`
      : t.categories.join(", ") || undefined,
    stats: [[String(t.ups), t.ups === 1 ? "upvote" : "upvotes"], [String(t.review_count), t.review_count === 1 ? "review" : "reviews"]],
  });
}
