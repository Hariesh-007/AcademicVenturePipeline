"use client";

import { useState } from "react";
import { PasswordInput } from "@/app/login/PasswordInput";
import { send } from "@/lib/client";

export function SignupForm({ invitedBy }: { invitedBy?: string }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get("password") !== f.get("confirm")) return setError("The passwords don't match.");
    setBusy(true);
    setError("");
    try {
      await send("/auth/signup", { json: { email: f.get("email"), password: f.get("password"), ref: invitedBy } });
      setSentTo(String(f.get("email")));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setBusy(false);
    }
  }

  if (sentTo) {
    return (
      <div role="status" className="mt-8 rounded-[10px] border border-rule bg-surface p-5">
        <p className="font-serif text-[20px]">Check your inbox</p>
        <p className="mt-2 text-[15px] text-ink-2">
          We sent a confirmation link to <span className="text-ink">{sentTo}</span>. It works for 24 hours.
          Nothing there after a few minutes? Check spam, or sign in and we&apos;ll offer to send it again.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5" noValidate>
      <div>
        <label className="label" htmlFor="email">Work email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" autoFocus />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <PasswordInput id="password" name="password" autoComplete="new-password" required minLength={10} />
        <p className="hint">At least 10 characters.</p>
      </div>
      <div>
        <label className="label" htmlFor="confirm">Repeat password</label>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" required minLength={10} />
      </div>
      <p role="alert" className="min-h-5 text-[14px] text-danger">{error}</p>
      <button type="submit" className="btn btn-primary w-full" disabled={busy}>
        {busy ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
