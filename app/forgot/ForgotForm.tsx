"use client";

import { useState } from "react";
import { send } from "@/lib/client";

export function ForgotForm() {
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email"));
    setBusy(true);
    setError("");
    try {
      await send("/auth/password/forgot", { json: { email } });
      setSentTo(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the link");
    } finally {
      setBusy(false);
    }
  }

  if (sentTo) {
    return (
      <p role="status" className="mt-8 text-[15px] text-ink-2">
        If <span className="text-ink">{sentTo}</span> has an account, a reset link is on its way. It works once, for one hour.
      </p>
    );
  }
  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="input" autoFocus />
      </div>
      <p role="alert" className="min-h-5 text-[14px] text-danger">{error}</p>
      <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
    </form>
  );
}
