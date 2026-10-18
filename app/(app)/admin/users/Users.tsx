"use client";

import { Fragment, useState } from "react";
import { send } from "@/lib/client";
import type { Institution, User } from "@/lib/types";
import { Feedback, useAction } from "@/lib/useAction";

// analysers sign themselves up; admins create staff only
const ROLES = [
  { value: "maintainer", label: "Maintainer" },
  { value: "admin", label: "Platform admin" },
] as const;
const roleLabel = (r: string) => (r === "analyst" ? "Analyser" : ROLES.find((x) => x.value === r)?.label ?? r);

function RoleFields({ role, setRole, institutions, institutionId }: {
  role: string; setRole: (r: string) => void; institutions: Institution[]; institutionId?: string | null;
}) {
  return (
    <>
      <div>
        <label className="label" htmlFor="role">Role</label>
        <select id="role" name="role" className="input" value={role} onChange={(e) => setRole(e.target.value)}>
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      {role === "maintainer" && (
        <div>
          <label className="label" htmlFor="institution_id">University</label>
          <select id="institution_id" name="institution_id" className="input" required defaultValue={institutionId ?? ""}>
            <option value="" disabled>Choose a university</option>
            {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
          {institutions.length === 0 && <p className="hint">Add a university first.</p>}
        </div>
      )}
    </>
  );
}

function EditUser({ user, institutions, isMe, onClose }: { user: User; institutions: Institution[]; isMe: boolean; onClose: () => void }) {
  const save = useAction();
  const [role, setRole] = useState<string>(user.role);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const json: Record<string, unknown> = { name: f.get("name"), role };
    if (role === "maintainer") json.institution_id = f.get("institution_id");
    const pw = String(f.get("password") ?? "");
    if (pw) json.password = pw;
    if (await save.run(() => send(`/users/${user.id}`, { method: "PATCH", json }), "Saved.")) onClose();
  }

  return (
    <form onSubmit={handleSave} className="grid gap-4 bg-sunken p-4 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor="name">Name</label>
        <input id="name" name="name" defaultValue={user.name} className="input" />
      </div>
      {isMe ? <p className="hint self-end">You can’t change your own role.</p> : (
        <RoleFields role={role} setRole={setRole} institutions={institutions} institutionId={user.institution_id} />
      )}
      <div>
        <label className="label" htmlFor="password">New password</label>
        <input id="password" name="password" type="text" minLength={10} className="input" placeholder="Leave empty to keep" autoComplete="off" />
        <p className="hint">At least 10 characters.</p>
      </div>
      <div className="flex items-end gap-2 sm:col-span-2">
        <button className="btn btn-primary btn-sm" disabled={save.busy}>Save changes</button>
        <button type="button" className="btn btn-quiet btn-sm" onClick={onClose}>Cancel</button>
        <Feedback error={save.error} />
      </div>
    </form>
  );
}

export function Users({ users, institutions, meId }: { users: User[]; institutions: Institution[]; meId: string }) {
  const create = useAction();
  const toggle = useAction();
  const [role, setRole] = useState("maintainer");
  const [editing, setEditing] = useState<string | null>(null);
  const instName = Object.fromEntries(institutions.map((i) => [i.id, i.name]));

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const json = {
      email: f.get("email"), name: f.get("name"), password: f.get("password"), role,
      institution_id: role === "maintainer" ? f.get("institution_id") : null,
    };
    if (await create.run(() => send("/users", { json }), `Created ${json.email}. Share the password with them.`)) form.reset();
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_360px]">
      <section className="panel overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Person</th><th>Role</th><th>University</th><th>Status</th><th className="w-1"><span className="sr-only">Actions</span></th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <Fragment key={u.id}>
                <tr className={u.is_active ? "" : "opacity-60"}>
                  <td>
                    <p className="font-medium">{u.name || "—"}{u.id === meId && <span className="ml-2 text-[12.5px] text-ink-2">(you)</span>}</p>
                    <p className="text-[13px] text-ink-2">{u.email}</p>
                  </td>
                  <td>
                    {roleLabel(u.role)}
                    {u.is_senior_reviewer && <span className="chip chip-on ml-2">Senior reviewer</span>}
                    {u.suggest_senior && <span className="chip chip-suggest ml-2" title="Fellow-tier analyser: consider making them a senior reviewer">Suggested senior</span>}
                  </td>
                  <td className="text-ink-2">{u.institution_id ? instName[u.institution_id] : "All"}</td>
                  <td>{u.is_active ? <span className="status text-ok">Active</span> : <span className="status text-ink-3">Deactivated</span>}</td>
                  <td>
                    <div className="flex gap-1">
                      {u.role !== "analyst" && (
                        <button className="btn btn-quiet btn-sm" onClick={() => setEditing(editing === u.id ? null : u.id)}>Edit</button>
                      )}
                      {u.role === "analyst" && (
                        <button className="btn btn-quiet btn-sm" disabled={toggle.busy}
                          onClick={() => toggle.run(() => send(`/users/${u.id}`, { method: "PATCH", json: { is_senior_reviewer: !u.is_senior_reviewer } }))}>
                          {u.is_senior_reviewer ? "Remove senior" : "Make senior"}
                        </button>
                      )}
                      {u.id !== meId && (
                        <button
                          className={`btn btn-quiet btn-sm ${u.is_active ? "btn-danger" : ""}`}
                          disabled={toggle.busy}
                          onClick={() => toggle.run(() => send(`/users/${u.id}`, { method: "PATCH", json: { is_active: !u.is_active } }))}
                        >
                          {u.is_active ? "Deactivate" : "Reactivate"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {editing === u.id && (
                  <tr>
                    <td colSpan={5} className="p-0">
                      <EditUser user={u} institutions={institutions} isMe={u.id === meId} onClose={() => setEditing(null)} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {toggle.error && <div className="p-4"><Feedback error={toggle.error} /></div>}
      </section>

      <form onSubmit={handleCreate} className="panel flex h-fit flex-col gap-4 p-5">
        <h2 className="font-serif text-[20px]">Create an account</h2>
        <div>
          <label className="label" htmlFor="new-name">Name</label>
          <input id="new-name" name="name" className="input" autoComplete="off" />
        </div>
        <div>
          <label className="label" htmlFor="new-email">Email</label>
          <input id="new-email" name="email" type="email" required className="input" autoComplete="off" />
        </div>
        <RoleFields role={role} setRole={setRole} institutions={institutions} />
        <div>
          <label className="label" htmlFor="new-password">Initial password</label>
          <input id="new-password" name="password" type="text" required minLength={10} className="input" autoComplete="off" />
          <p className="hint">At least 10 characters. They can change it after signing in.</p>
        </div>
        <button className="btn btn-primary" disabled={create.busy}>{create.busy ? "Creating…" : "Create account"}</button>
        <Feedback error={create.error} done={create.done} />
      </form>
    </div>
  );
}
