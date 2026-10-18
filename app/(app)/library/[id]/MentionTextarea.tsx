"use client";

// A textarea with an @-picker: type "@" and the people who can see this discussion appear
// (only they would be notified). Arrow keys move, Enter/Tab inserts "@handle ", Escape closes.
// ARIA combobox pattern so screen readers announce the list and the active option.
import Link from "next/link";
import { useId, useRef, useState } from "react";
import { send } from "@/lib/client";
import type { CommentAuthor } from "@/lib/types";
import { Avatar } from "@/app/_profile/Avatar";
import { TierBadge } from "@/app/_profile/Credibility";

// the "@partial" just before the caret, if the caret is inside one
const TRIGGER = /(^|[\s(])@([a-z0-9-]{0,30})$/i;

export function MentionTextarea({ technologyId, value, onChange, placeholder, rows = 3 }: {
  technologyId: string; value: string; onChange: (v: string) => void; placeholder: string; rows?: number;
}) {
  const listId = useId();
  const area = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const cache = useRef(new Map<string, CommentAuthor[]>());
  const [query, setQuery] = useState<{ q: string; start: number } | null>(null);
  const [options, setOptions] = useState<CommentAuthor[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);

  function lookup(text: string, caret: number) {
    const m = TRIGGER.exec(text.slice(0, caret));
    if (!m) return close();
    const q = m[2].toLowerCase();
    setQuery({ q, start: caret - q.length - 1 });
    setActive(0);
    const hit = cache.current.get(q);
    if (hit) return setOptions(hit);
    setLoading(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const people = await send<CommentAuthor[]>(`/technologies/${technologyId}/mentionable?q=${encodeURIComponent(q)}`);
        cache.current.set(q, people);
        setOptions(people);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 150);
  }

  function close() {
    clearTimeout(timer.current);
    setQuery(null);
    setOptions([]);
  }

  function pick(p: CommentAuthor) {
    const el = area.current;
    if (!query || !el || !p.handle) return;
    const caret = el.selectionStart;
    const next = `${value.slice(0, query.start)}@${p.handle} ${value.slice(caret)}`;
    const at = query.start + p.handle.length + 2;
    onChange(next);
    close();
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(at, at); });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!query || !options.length) {
      if (e.key === "Escape" && query) close();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i + (e.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      pick(options[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  const open = query !== null;
  return (
    <div className="relative">
      <textarea ref={area} value={value} rows={rows} maxLength={4000} placeholder={placeholder} aria-label={placeholder}
        className="input text-[14px]"
        role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={listId}
        aria-activedescendant={open && options[active] ? `${listId}-${options[active].id}` : undefined}
        onChange={(e) => { onChange(e.target.value); lookup(e.target.value, e.target.selectionStart); }}
        onClick={(e) => lookup(e.currentTarget.value, e.currentTarget.selectionStart)}
        onKeyDown={onKeyDown}
        onBlur={() => setTimeout(close, 120)} />
      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-[10px] border border-rule bg-surface p-1">
          <ul id={listId} role="listbox" aria-label="People you can mention">
            {options.map((p, i) => (
              <li key={p.id} id={`${listId}-${p.id}`} role="option" aria-selected={i === active}
                onMouseDown={(e) => { e.preventDefault(); pick(p); }} onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 ${i === active ? "bg-blue-tint" : ""}`}>
                <Avatar name={p.name} url={p.avatar_url} seed={p.id} size={24} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium">{p.name}</span>
                  <span className="data block truncate text-[12px] text-ink-2">@{p.handle}</span>
                </span>
                {p.tier && <TierBadge tier={p.tier} size={16} />}
              </li>
            ))}
          </ul>
          {!options.length && (
            <p className="px-2 py-2 text-[13px] text-ink-2">
              {loading ? "Looking…" : query.q
                ? `No one matching "${query.q}" has reviewed this technology.`
                : "No one else has reviewed this technology yet."}
              {" "}You can mention people who have reviewed it, since only they can read this thread.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// same rule as the backend: @handle, any case, not part of an email or URL
const MENTION = /(?<![\w.@/])@([a-z0-9][a-z0-9-]{1,28}[a-z0-9])(?![\w-])/gi;

/** Comment text with real @mentions turned into profile links; unknown handles stay text. */
export function CommentBody({ body, mentions }: { body: string; mentions: { handle: string; name: string }[] }) {
  const known = new Map(mentions.map((m) => [m.handle, m.name]));
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of body.matchAll(MENTION)) {
    const handle = m[1].toLowerCase();
    if (!known.has(handle)) continue;
    parts.push(body.slice(last, m.index));
    parts.push(
      <Link key={m.index} href={`/a/${handle}`} title={known.get(handle)}
        className="rounded-sm bg-blue-tint px-0.5 font-medium text-blue hover:underline">
        @{handle}
      </Link>,
    );
    last = m.index + m[0].length;
  }
  parts.push(body.slice(last));
  return <>{parts}</>;
}
