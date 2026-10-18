"use client";

import Link from "next/link";
import { useState } from "react";
import { send } from "@/lib/client";
import type { Institution } from "@/lib/types";
import { Feedback, useAction } from "@/lib/useAction";
import { Empty } from "@/app/(app)/ui";
import { PreviewSwitch } from "@/app/_share/PreviewSwitch";

export function Universities({ institutions, maintainers }: { institutions: Institution[]; maintainers: Record<string, number> }) {
  const add = useAction();
  const rename = useAction();
  const [editing, setEditing] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = String(new FormData(form).get("name")).trim();
    if (await add.run(() => send("/institutions", { json: { name } }), `Added ${name}.`)) form.reset();
  }

  async function handleRename(e: React.FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    const name = String(new FormData(e.currentTarget).get("name")).trim();
    if (await rename.run(() => send(`/institutions/${id}`, { method: "PATCH", json: { name } }))) setEditing(null);
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_340px]">
      <section className="panel overflow-x-auto">
        {institutions.length === 0 ? (
          <div className="p-6"><Empty title="No universities yet">Add the first one with the form.</Empty></div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Maintainers</th><th>Public previews</th><th className="w-1"><span className="sr-only">Actions</span></th></tr>
            </thead>
            <tbody>
              {institutions.map((i) => (
                <tr key={i.id}>
                  <td>
                    {editing === i.id ? (
                      <form onSubmit={(e) => handleRename(e, i.id)} className="flex gap-2">
                        <input name="name" defaultValue={i.name} className="input" aria-label="University name" autoFocus required minLength={2} />
                        <button className="btn btn-primary btn-sm" disabled={rename.busy}>Save</button>
                        <button type="button" className="btn btn-quiet btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                      </form>
                    ) : (
                      <span className="font-medium">{i.name}</span>
                    )}
                  </td>
                  <td>
                    {maintainers[i.id] ? (
                      <span className="data">{maintainers[i.id]}</span>
                    ) : (
                      <Link href="/admin/users" className="text-[13px] text-orange-ink underline decoration-orange underline-offset-4 dark:text-orange">
                        None yet, create one
                      </Link>
                    )}
                  </td>
                  <td>
                    <PreviewSwitch url={`/institutions/${i.id}/public-previews`} on={i.public_previews} label={`Public previews for ${i.name}`} compact />
                  </td>
                  <td>
                    {editing !== i.id && (
                      <button className="btn btn-quiet btn-sm" onClick={() => setEditing(i.id)}>Rename</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {rename.error && <div className="px-4 pb-4"><Feedback error={rename.error} /></div>}
      </section>

      <form onSubmit={handleAdd} className="panel flex h-fit flex-col gap-4 p-5">
        <h2 className="font-serif text-[20px]">Add a university</h2>
        <div>
          <label className="label" htmlFor="uni-name">Name</label>
          <input id="uni-name" name="name" className="input" required minLength={2} placeholder="e.g. IIT Madras" />
        </div>
        <button className="btn btn-primary" disabled={add.busy}>{add.busy ? "Adding…" : "Add university"}</button>
        <Feedback error={add.error} done={add.done} />
      </form>
    </div>
  );
}
