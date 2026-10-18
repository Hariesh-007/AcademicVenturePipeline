"use client";

// Profile sections, each its own form. Onboarding shows them one per step; the account page
// shows them stacked. Same fields, same validation, one implementation.
import { useEffect, useRef, useState } from "react";
import { send } from "@/lib/client";
import type { Category, MyProfile } from "@/lib/types";
import { Feedback, useAction } from "@/lib/useAction";
import { Avatar } from "./Avatar";
import { COUNTRIES, INTERESTS, ORG_TYPES, SENIORITY, SOCIALS } from "./meta";

type SectionProps = { profile: MyProfile; submitLabel?: string; onSaved?: () => void };

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const orNull = (v: string) => (v === "" ? null : v);
const chip =
  "chip cursor-pointer select-none has-[:checked]:border-[color-mix(in_srgb,var(--blue)_30%,transparent)] has-[:checked]:bg-blue-tint has-[:checked]:text-blue has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue";

function useSave(onSaved?: () => void) {
  const act = useAction();
  return {
    ...act,
    save: async (json: unknown, done = "Saved.") => {
      if (await act.run(() => send("/me/profile", { method: "PUT", json }), done)) onSaved?.();
    },
  };
}

function Actions({ busy, label, error, done }: { busy: boolean; label: string; error: string; done: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-1">
      <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : label}</button>
      <Feedback error={error} done={done} />
    </div>
  );
}

// --- photo -----------------------------------------------------------------------------------

export function PhotoField({ profile, seed }: { profile: Pick<MyProfile, "name" | "avatar_url">; seed: string }) {
  const act = useAction();
  const input = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (file.size > 2 * 1024 * 1024) return act.run(() => Promise.reject(new Error("Choose a photo of 2 MB or less.")));
    const form = new FormData();
    form.append("file", file);
    await act.run(() => send("/me/avatar", { method: "PUT", form }), "Photo updated.");
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar name={profile.name} url={profile.avatar_url} seed={seed} size={72} />
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-2">
          <button type="button" className="btn btn-sm" disabled={act.busy} onClick={() => input.current?.click()}>
            {act.busy ? "Uploading…" : profile.avatar_url ? "Change photo" : "Add a photo"}
          </button>
          {profile.avatar_url && (
            <button type="button" className="btn btn-quiet btn-sm" disabled={act.busy}
              onClick={() => act.run(() => send("/me/avatar", { method: "DELETE" }), "Photo removed.")}>
              Remove
            </button>
          )}
        </div>
        <p className="hint mt-0">JPEG, PNG or WebP, up to 2 MB. We crop it square around your face.</p>
        <Feedback error={act.error} done={act.done} />
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1}
        aria-label="Profile photo"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) upload(f); }} />
    </div>
  );
}

// --- who you are -----------------------------------------------------------------------------

function HandleInput({ initial }: { initial: string | null }) {
  const [value, setValue] = useState(initial ?? "");
  const [remote, setRemote] = useState<{ handle: string; free: boolean } | null>(null);
  const valid = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(value);
  const unchanged = !value || value === initial;
  useEffect(() => {
    if (unchanged || !valid) return;
    const t = setTimeout(async () => {
      const r = await send<{ available: boolean }>(`/profiles/handle-available?h=${encodeURIComponent(value)}`).catch(() => null);
      if (r) setRemote({ handle: value, free: r.available });
    }, 350);
    return () => clearTimeout(t);
  }, [value, unchanged, valid]);
  const state = unchanged ? "idle" : !valid ? "invalid"
    : remote?.handle === value ? (remote.free ? "ok" : "taken") : "idle";
  const msg = {
    idle: "Your public page lives at /a/" + (value || "your-handle"),
    ok: `/a/${value} is free.`,
    taken: "Someone already has that handle.",
    invalid: "3–30 characters: lowercase letters, numbers and hyphens, not at either end.",
  }[state];
  return (
    <div>
      <label className="label" htmlFor="handle">Handle</label>
      <input id="handle" name="handle" required className="input" value={value} autoComplete="off" spellCheck={false}
        onChange={(e) => setValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
        aria-invalid={state === "taken" || state === "invalid"} aria-describedby="handle-hint" />
      <p id="handle-hint" aria-live="polite" className={`hint ${state === "ok" ? "text-ok" : state === "idle" ? "" : "text-danger"}`}>{msg}</p>
    </div>
  );
}

export function BasicsForm({ profile, submitLabel = "Save", onSaved, nameOnly = false }: SectionProps & { nameOnly?: boolean }) {
  const s = useSave(onSaved);
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    s.save(nameOnly ? { name: str(f, "name") } : { name: str(f, "name"), handle: str(f, "handle"), headline: str(f, "headline") });
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <label className="label" htmlFor="name">Full name</label>
        <input id="name" name="name" required defaultValue={profile.name} className="input" autoComplete="name" />
      </div>
      {!nameOnly && (
        <>
          <HandleInput initial={profile.handle} />
          <div>
            <label className="label" htmlFor="headline">Headline</label>
            <input id="headline" name="headline" required maxLength={120} defaultValue={profile.headline} className="input"
              placeholder="Technology scout for medical devices at Northwind Ventures" />
            <p className="hint">One line other analysts see next to your name.</p>
          </div>
        </>
      )}
      <Actions busy={s.busy} label={submitLabel} error={s.error} done={s.done} />
    </form>
  );
}

// --- work + expertise ------------------------------------------------------------------------

export function WorkForm({ profile, categories, submitLabel = "Save", onSaved }: SectionProps & { categories: Category[] }) {
  const s = useSave(onSaved);
  const [bio, setBio] = useState(profile.bio);
  const mine = new Set(profile.categories.map((c) => c.id));

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const cats = f.getAll("categories").map(String);
    if (!cats.length) return s.run(() => Promise.reject(new Error("Pick at least one area of expertise.")));
    const years = str(f, "years_experience");
    s.save({
      organisation: str(f, "organisation"), org_type: str(f, "org_type"), job_title: str(f, "job_title"),
      seniority: orNull(str(f, "seniority")), years_experience: years === "" ? null : Number(years),
      country: orNull(str(f, "country")), bio: bio.trim(), categories: cats, interests: f.getAll("interests").map(String),
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="organisation">Organisation</label>
          <input id="organisation" name="organisation" required maxLength={200} defaultValue={profile.organisation} className="input" autoComplete="organization" />
        </div>
        <div>
          <label className="label" htmlFor="org_type">Organisation type</label>
          <select id="org_type" name="org_type" required defaultValue={profile.org_type ?? ""} className="input">
            <option value="" disabled>Choose one</option>
            {ORG_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="job_title">Job title <span className="font-normal text-ink-2">(optional)</span></label>
          <input id="job_title" name="job_title" maxLength={120} defaultValue={profile.job_title} className="input" autoComplete="organization-title" />
        </div>
        <div>
          <label className="label" htmlFor="seniority">Seniority <span className="font-normal text-ink-2">(optional)</span></label>
          <select id="seniority" name="seniority" defaultValue={profile.seniority ?? ""} className="input">
            <option value="">Prefer not to say</option>
            {SENIORITY.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="years_experience">Years of experience <span className="font-normal text-ink-2">(optional)</span></label>
          <input id="years_experience" name="years_experience" type="number" min={0} max={60} inputMode="numeric"
            defaultValue={profile.years_experience ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="country">Country <span className="font-normal text-ink-2">(optional)</span></label>
          <select id="country" name="country" defaultValue={profile.country ?? ""} className="input" autoComplete="country">
            <option value="">Prefer not to say</option>
            {COUNTRIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className="label">Areas of expertise</legend>
        <p className="hint mb-3 mt-0">Pick up to 10. These decide which technologies we point you to.</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <label key={c.id} className={chip}>
              <input type="checkbox" name="categories" value={c.id} defaultChecked={mine.has(c.id)} className="sr-only" />
              {c.name}
            </label>
          ))}
          {categories.length === 0 && <p className="hint mt-0">No categories yet. An admin adds them.</p>}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">What you look for <span className="font-normal text-ink-2">(optional)</span></legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {INTERESTS.map((i) => (
            <label key={i.value} className={chip}>
              <input type="checkbox" name="interests" value={i.value} defaultChecked={profile.interests.includes(i.value)} className="sr-only" />
              {i.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="label" htmlFor="bio">About you <span className="font-normal text-ink-2">(optional)</span></label>
        <textarea id="bio" name="bio" rows={4} maxLength={500} value={bio} onChange={(e) => setBio(e.target.value)} className="input"
          placeholder="The kinds of technology you've assessed, deals you've worked on, what you bring to a review." />
        <p className="hint text-right">{bio.length}/500</p>
      </div>
      <Actions busy={s.busy} label={submitLabel} error={s.error} done={s.done} />
    </form>
  );
}

// --- socials ---------------------------------------------------------------------------------

export function SocialsForm({ profile, submitLabel = "Save", onSaved }: SectionProps) {
  const s = useSave(onSaved);
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const socials = Object.fromEntries(
      SOCIALS.map(({ key }) => [key, { url: str(f, key), visible: f.get(`${key}-visible`) === "on" }])
        .filter(([, v]) => (v as { url: string }).url),
    );
    s.save({ socials });
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {SOCIALS.map(({ key, label, placeholder }) => {
        const cur = profile.all_socials[key];
        return (
          <div key={key} className="grid items-end gap-x-4 gap-y-1 sm:grid-cols-[1fr_auto]">
            <div>
              <label className="label" htmlFor={key}>{label}</label>
              <input id={key} name={key} type="url" defaultValue={cur?.url ?? ""} placeholder={placeholder} className="input" spellCheck={false} />
            </div>
            <label className="flex min-h-10 items-center gap-2 text-[13px] text-ink-2">
              <input type="checkbox" name={`${key}-visible`} defaultChecked={cur?.visible ?? true} className="size-4 accent-[var(--blue)]" />
              Show on public profile
            </label>
          </div>
        );
      })}
      <Actions busy={s.busy} label={submitLabel} error={s.error} done={s.done} />
    </form>
  );
}

// --- strength --------------------------------------------------------------------------------

/** The app's gap grammar: dashed = still missing, solid blue = filled in. */
export function Strength({ value }: { value: number }) {
  const filled = Math.round(value / 10);
  return (
    <div>
      <div className="flex gap-1" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label="Profile strength">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={`h-2 flex-1 rounded-[2px] ${i < filled ? "bg-blue" : "border border-dashed border-rule-strong"}`} />
        ))}
      </div>
      <p className="hint">Profile {value}% complete{value < 100 ? ". A complete profile helps other analysts weigh your reviews." : "."}</p>
    </div>
  );
}
