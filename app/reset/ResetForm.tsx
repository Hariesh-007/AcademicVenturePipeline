"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { send } from "@/lib/client";

export function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get("new_password") !== f.get("confirm")) return setError("The passwords don't match.");
    setBusy(true);
    setError("");
    try {
      await send("/auth/password/reset", { json: { token, new_password: f.get("new_password") } });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't reset the password");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p role="status" className="mt-8 text-[15px] text-ink-2">
        Password changed. <Link href="/login" className="text-blue hover:underline">Sign in</Link> with the new one.
      </p>
    );
  }
  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
      <div>
        <label className="label" htmlFor="new_password">New password</label>
        <input id="new_password" name="new_password" type="password" autoComplete="new-password" required minLength={10} className="input" autoFocus />
        <p className="hint">At least 10 characters.</p>
      </div>
      <div>
        <label className="label" htmlFor="confirm">Repeat new password</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={10} className="input" />
      </div>
      <p role="alert" className="min-h-5 text-[14px] text-danger">
        {error}
        {error && <> <Link href="/forgot" className="text-blue hover:underline">Request a new link</Link>.</>}
      </p>
      <button className="btn btn-primary w-full" disabled={busy || !token}>{busy ? "Saving…" : "Save new password"}</button>
    </form>
  );
}
