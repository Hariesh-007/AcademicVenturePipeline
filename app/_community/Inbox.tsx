"use client";

// The sidebar bell: replies, mentions, tier-ups, badges and challenge decisions. Opening it marks
// what you've seen as read. Native <details>, so it works with the keyboard out of the box.
import Link from "next/link";
import { useEffect, useState } from "react";
import { send } from "@/lib/client";
import type { Tier } from "@/lib/api";
import type { Notification } from "@/lib/types";
import { TierBadge } from "@/app/_profile/Credibility";
import { linkedIn, withRef } from "@/app/_share/links";

const when = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
function ago(iso: string) {
  const mins = Math.round((Date.parse(iso) - Date.now()) / 60000);
  if (mins > -60) return when.format(mins, "minute");
  if (mins > -60 * 24) return when.format(Math.round(mins / 60), "hour");
  return when.format(Math.round(mins / 1440), "day");
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function line(n: Notification) {
  const who = n.actor_name || "Someone";
  if (n.kind === "reply") return `${who} replied to you on ${n.technology_title}`;
  if (n.kind === "mention") return `${who} mentioned you on ${n.technology_title}`;
  if (n.kind === "tier_up") return `You reached ${cap(n.detail)}`;
  if (n.kind === "badge") return `You earned the ${cap(n.detail)} badge`;
  if (n.kind === "feedback") return `The team replied to your feedback “${n.detail}”`;
  if (n.kind === "senior_queue") return `A dossier is waiting for senior review: ${n.technology_title}`;
  if (n.kind === "returned") return `The senior reviewer returned ${n.technology_title}: “${n.detail}”`;
  if (n.kind === "ai_stuck") return `The ${n.detail === "triage" ? "AI screening" : "dossier draft"} for ${n.technology_title} is stuck`;
  return `Your challenge was ${n.detail}`;
}

function href(n: Notification) {
  if (n.technology_id && n.kind === "senior_queue") return `/library/${n.technology_id}?tab=dossier`;
  if (n.technology_id && n.kind === "returned") return `/library/${n.technology_id}?tab=reports`;
  if (n.technology_id && n.kind === "ai_stuck")
    return n.detail === "triage" ? `/uploads/${n.technology_id}` : `/library/${n.technology_id}?tab=dossier`;
  if (n.technology_id) return `/library/${n.technology_id}?tab=discussion`;
  if (n.kind === "feedback") return "/feedback";
  return n.kind === "tier_up" || n.kind === "badge" ? "/account" : "/library";
}

/** handle: yours, so tier-ups and badges can be shared straight from the inbox. */
export function Inbox({ unread: initialUnread, handle }: { unread: number; handle?: string | null }) {
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState<Notification[] | null>(null);
  const [error, setError] = useState("");

  // the shell layout persists across navigations, so refresh the count ourselves: on focus
  // and every minute (cheap: one count query), so a new mention shows without a reload
  useEffect(() => {
    const refresh = () =>
      send<{ unread: number }>("/me/notifications?limit=1").then((r) => setUnread(r.unread), () => {});
    const id = setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(id); window.removeEventListener("focus", refresh); };
  }, []);

  async function open(e: React.SyntheticEvent<HTMLDetailsElement>) {
    if (!e.currentTarget.open) return;
    try {
      const inbox = await send<{ unread: number; items: Notification[] }>("/me/notifications");
      setItems(inbox.items);
      // mark only what was actually shown: anything newer or beyond the list stays unread
      const seen = inbox.items.filter((n) => !n.read).map((n) => n.id);
      if (seen.length) {
        await send("/me/notifications/read", { json: { ids: seen } });
        setUnread(Math.max(0, inbox.unread - seen.length));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load notifications");
    }
  }

  return (
    <details className="group relative" onToggle={open}>
      <summary className="btn btn-quiet btn-sm w-full cursor-pointer list-none justify-between">
        <span>Notifications</span>
        {unread > 0 && (
          <span className="data rounded-full bg-blue px-1.5 py-0.5 text-[11.5px] leading-none text-blue-ink" aria-label={`${unread} unread`}>
            {unread}
          </span>
        )}
      </summary>
      <div className="absolute bottom-full left-0 z-30 mb-2 w-[300px] rounded-[10px] border border-rule bg-surface p-2 lg:bottom-0 lg:left-full lg:mb-0 lg:ml-3">
        {error && <p role="alert" className="p-2 text-[13px] text-danger">{error}</p>}
        {items === null && !error && <p className="p-2 text-[13px] text-ink-2">Loading…</p>}
        {items?.length === 0 && <p className="p-2 text-[13px] text-ink-2">Nothing yet. Replies, mentions and tier-ups show up here.</p>}
        <ul className="flex max-h-[360px] flex-col overflow-y-auto">
          {items?.map((n) => (
            <li key={n.id} className="flex flex-col">
              <Link href={href(n)} className="flex items-center gap-2.5 rounded-md px-2 py-2 hover:bg-sunken">
                {n.kind === "tier_up" && <TierBadge tier={n.detail as Tier} size={28} />}
                <span className="min-w-0">
                  <span className={`block text-[13.5px] ${n.read ? "text-ink-2" : "font-medium text-ink"}`}>{line(n)}</span>
                  <span className="block text-[12px] text-ink-3">{ago(n.created_at)}</span>
                </span>
              </Link>
              {handle && (n.kind === "tier_up" || n.kind === "badge") && (
                <button type="button" className="ml-[46px] mb-1 w-fit text-[12.5px] font-medium text-blue hover:underline"
                  onClick={() => window.open(linkedIn(new URL(withRef(`/a/${handle}/${n.kind === "tier_up" ? "tier" : "badge"}-${n.detail}`, handle), window.location.origin).toString()),
                    "_blank", "noopener,noreferrer,width=600,height=640")}>
                  Share on LinkedIn
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
