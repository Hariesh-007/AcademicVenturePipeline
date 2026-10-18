"use client";

import { send } from "@/lib/client";
import { Feedback, useAction } from "@/lib/useAction";

export function PasswordForm() {
  const act = useAction();
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    if (f.get("new_password") !== f.get("confirm")) return act.run(() => Promise.reject(new Error("The new passwords don't match.")));
    if (await act.run(() => send("/auth/password", { json: { current_password: f.get("current_password"), new_password: f.get("new_password") } }), "Password changed.")) form.reset();
  }
  return (
    <form onSubmit={handleSubmit} className="flex max-w-[420px] flex-col gap-4">
      <div>
        <label className="label" htmlFor="current_password">Current password</label>
        <input id="current_password" name="current_password" type="password" autoComplete="current-password" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="new_password">New password</label>
        <input id="new_password" name="new_password" type="password" autoComplete="new-password" required minLength={10} className="input" />
        <p className="hint">At least 10 characters.</p>
      </div>
      <div>
        <label className="label" htmlFor="confirm">Repeat new password</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={10} className="input" />
      </div>
      <button className="btn btn-primary" disabled={act.busy}>Change password</button>
      <Feedback error={act.error} done={act.done} />
    </form>
  );
}
