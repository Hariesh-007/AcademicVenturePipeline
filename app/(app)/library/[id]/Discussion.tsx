"use client";

// Discussion under a technology. Visible once you've submitted your own review (the same
// blind rule as reviews); posting opens at Contributor. One level of replies keeps it readable.
import Link from "next/link";
import { useCallback, useState } from "react";
import { send } from "@/lib/client";
import type { Comment } from "@/lib/types";
import { Avatar } from "@/app/_profile/Avatar";
import { TierBadge, tierLabel } from "@/app/_profile/Credibility";
import { CommentBody, MentionTextarea } from "./MentionTextarea";

const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function Composer({ technologyId, placeholder, submitLabel, initial = "", onSubmit, onCancel }: {
  technologyId: string; placeholder: string; submitLabel: string; initial?: string;
  onSubmit: (body: string) => Promise<void>; onCancel?: () => void;
}) {
  const [body, setBody] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError("");
    try {
      await onSubmit(body);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't post that");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <MentionTextarea technologyId={technologyId} value={body} onChange={setBody} placeholder={placeholder} />
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn btn-primary btn-sm" disabled={busy || !body.trim()}>{busy ? "Posting…" : submitLabel}</button>
        {onCancel && <button type="button" className="btn btn-quiet btn-sm" onClick={onCancel}>Cancel</button>}
        {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
      </div>
    </form>
  );
}

function Item({ c, technologyId, canPost, reload, onReply, isReply }: {
  c: Comment; technologyId: string; canPost: boolean; reload: () => Promise<void>;
  onReply?: (body: string) => Promise<void>; isReply?: boolean;
}) {
  const [mode, setMode] = useState<"view" | "edit" | "reply">("view");
  const name = c.author.handle
    ? <Link href={`/a/${c.author.handle}`} className="font-medium hover:underline">{c.author.name}</Link>
    : <span className="font-medium">{c.author.name}</span>;

  return (
    <article className={isReply ? "border-l-2 border-rule pl-3" : ""}>
      <header className="flex items-center gap-2 text-[13px]">
        <Avatar name={c.author.name} url={c.author.avatar_url} seed={c.author.id} size={22} />
        {name}
        {c.author.tier && <TierBadge tier={c.author.tier} size={16} label={`${tierLabel(c.author.tier)} tier`} />}
        {c.author.tier && c.author.tier !== "newcomer" && c.author.tier !== "contributor" && (
          <span className="text-blue">{tierLabel(c.author.tier)}</span>
        )}
        <time className="text-ink-3" dateTime={c.created_at}>{date.format(new Date(c.created_at))}</time>
        {c.edited_at && <span className="text-ink-3">edited</span>}
      </header>
      {mode === "edit" ? (
        <div className="mt-2">
          <Composer technologyId={technologyId} placeholder="Edit your comment" submitLabel="Save" initial={c.body}
            onSubmit={async (body) => { await send(`/comments/${c.id}`, { method: "PATCH", json: { body } }); setMode("view"); await reload(); }}
            onCancel={() => setMode("view")} />
        </div>
      ) : c.deleted ? (
        <p className="mt-1.5 text-[14px] italic text-ink-3">Comment deleted</p>
      ) : (
        <p className="mt-1.5 whitespace-pre-line text-[14px] leading-relaxed"><CommentBody body={c.body} mentions={c.mentions} /></p>
      )}
      {mode === "view" && !c.deleted && (
        <div className="mt-1 flex gap-1">
          {canPost && onReply && <button className="btn btn-quiet btn-sm" onClick={() => setMode("reply")}>Reply</button>}
          {c.mine && <button className="btn btn-quiet btn-sm" onClick={() => setMode("edit")}>Edit</button>}
          {c.mine && (
            <button className="btn btn-quiet btn-sm btn-danger"
              onClick={async () => { await send(`/comments/${c.id}`, { method: "DELETE" }); await reload(); }}>
              Delete
            </button>
          )}
        </div>
      )}
      {mode === "reply" && (
        <div className="mt-2">
          <Composer technologyId={technologyId} placeholder={`Reply to ${c.author.name}`} submitLabel="Reply"
            onSubmit={async (body) => { await onReply?.(body); setMode("view"); }}
            onCancel={() => setMode("view")} />
        </div>
      )}
      {c.replies.length > 0 && (
        <div className="mt-3 flex flex-col gap-3">
          {c.replies.map((r) => <Item key={r.id} c={r} technologyId={technologyId} canPost={canPost} reload={reload} isReply />)}
        </div>
      )}
    </article>
  );
}

export function Discussion({ technologyId, canSee, canPost, initial }: {
  technologyId: string; canSee: boolean; canPost: boolean; initial: Comment[];
}) {
  // first load comes from the server page; refetch only after this user's own actions
  const [comments, setComments] = useState<Comment[]>(initial);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      setComments(await send<Comment[]>(`/technologies/${technologyId}/comments`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load the discussion");
    }
  }, [technologyId]);

  if (!canSee) {
    return (
      <div className="rounded-[10px] border border-dashed border-rule-strong p-5 text-[14px]">
        <p className="font-serif text-[18px]">Submit your review to join the discussion</p>
        <p className="mt-1 text-ink-2">Like reviews, the conversation stays hidden until you&apos;ve formed your own view.</p>
      </div>
    );
  }

  async function post(body: string, parent_id?: string) {
    await send(`/technologies/${technologyId}/comments`, { json: { body, parent_id } });
    await reload();
  }

  return (
    <div className="flex flex-col gap-5">
      {canPost ? (
        <Composer technologyId={technologyId} placeholder="Add to the discussion. Type @ to mention someone." submitLabel="Post" onSubmit={(b) => post(b)} />
      ) : (
        <p className="rounded-[10px] border border-dashed border-rule-strong p-4 text-[14px] text-ink-2">
          Discussions open at Contributor. You can read along; reviews that peers mark helpful get you there.
        </p>
      )}
      {error && <p role="alert" className="text-[14px] text-danger">{error}</p>}
      {comments.length === 0 && <p className="text-[14px] text-ink-2">No one has started this discussion yet.</p>}
      {comments.map((c) => (
        <Item key={c.id} c={c} technologyId={technologyId} canPost={canPost} reload={reload} onReply={(body) => post(body, c.id)} />
      ))}
    </div>
  );
}
