"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { PasswordInput } from "./PasswordInput";
import { send, SendError } from "@/lib/client";

export function LoginForm() {
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [unverified, setUnverified] = useState("");  // email awaiting its confirmation link
  const [resent, setResent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    setUnverified("");
    try {
      await send("/auth/login", { json: { email: form.get("email"), password: form.get("password") } });
      const next = params.get("next") ?? "";
      // only same-site paths: never bounce to another origin
      window.location.href = next.startsWith("/") && !next.startsWith("//") ? next : "/app";
    } catch (err) {
      if (err instanceof SendError && err.status === 403) setUnverified(String(form.get("email")));
      setError(err instanceof Error ? err.message : "Sign in failed");
      setBusy(false);
    }
  }

  async function resend() {
    await send("/auth/verify/resend", { json: { email: unverified } }).catch(() => {});
    setResent(true);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5" noValidate>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="input" autoFocus />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <label className="label" htmlFor="password">Password</label>
          <Link href="/forgot" className="text-[13px] text-ink-2 hover:text-ink">Forgot password?</Link>
        </div>
        <PasswordInput id="password" name="password" autoComplete="current-password" required />
      </div>
      <div className="min-h-5">
        <p role="alert" className="text-[14px] text-danger">{error}</p>
        {unverified && (resent
          ? <p role="status" className="mt-1 text-[14px] text-ok">Sent. Check {unverified}.</p>
          : <button type="button" className="mt-1 text-[14px] text-blue hover:underline" onClick={resend}>Send the link again</button>)}
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
