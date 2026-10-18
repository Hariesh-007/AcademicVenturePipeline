"use client";

import { useCallback, useEffect, useState } from "react";
import { send } from "@/lib/client";
import { Feedback as Result, useAction } from "@/lib/useAction";

type Model = { id: string; context_length: number; free: boolean };
type Policy = Record<string, string | string[]>;
export type AIConfig = { model: string; default_model: string; ready: boolean; policy: Policy };

const ctx = (n: number) => (n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : `${Math.round(n / 1000)}K`);

export function AISetting({ initial }: { initial: AIConfig }) {
  const act = useAction();
  const [model, setModel] = useState(initial.model);
  const [test, setTest] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  // Live model list; null = loading. An error falls back to typing the name.
  const [models, setModels] = useState<{ list: Model[]; error: string | null } | null>(null);
  const changed = model !== initial.model;

  const load = useCallback(() => {
    send<{ models: Model[]; error: string | null }>("/admin/ai/models")
      .then((r) => setModels({ list: r.models, error: r.error }))
      .catch((e) => setModels({ list: [], error: e instanceof Error ? e.message : "Couldn’t load models" }));
  }, []);
  useEffect(() => { load(); }, [load]);

  const list = models?.list ?? [];
  // Keep a saved model that OpenRouter no longer lists, so saving never silently changes it.
  const options = list.length && !list.some((m) => m.id === model)
    ? [{ id: model, context_length: 0, free: false }, ...list] : list;

  async function check() {
    setTesting(true);
    setTest(null);
    try {
      setTest(await send<{ ok: boolean; message: string }>("/admin/ai/test", { json: { model } }));
    } catch (e) {
      setTest({ ok: false, message: e instanceof Error ? e.message : "Test failed" });
    } finally {
      setTesting(false);
    }
  }

  const pick = (v: string) => { setTest(null); setModel(v); };

  return (
    <form className="panel flex max-w-[720px] flex-col gap-6 p-5" onSubmit={(e) => {
      e.preventDefault();
      act.run(() => send("/admin/ai", { method: "PUT", json: { model } }), "Saved. New extractions use this model.");
    }}>
      <div>
        <h2 className="font-serif text-[20px]">AI model (OpenRouter)</h2>
        <p className="mt-1 text-[14px] text-ink-2">
          AI reads each published patent’s extracted text and pulls out quotes as evidence. Only published patents are sent.
          Disclosures, reports, papers and unpublished files stay in the system, and people add their evidence by hand.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="ai-model">Model</label>
            <button type="button" className="text-[12px] text-blue hover:underline disabled:text-ink-3"
              disabled={!models} onClick={() => { setModels(null); load(); }} aria-label="Reload the model list">
              {models ? "↻ Refresh" : "Loading…"}
            </button>
          </div>
          {options.length ? (
            <select id="ai-model" className="input" value={model} onChange={(e) => pick(e.target.value)}>
              {options.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id}{m.context_length ? ` · ${ctx(m.context_length)}` : ""}{m.free ? " · free" : ""}
                </option>
              ))}
            </select>
          ) : (
            <input id="ai-model" className="input" value={model}
              placeholder={models ? "Type a model id" : "Loading models…"} onChange={(e) => pick(e.target.value)} />
          )}
        </div>
        <button type="button" className="btn" disabled={testing || !model} onClick={check}>
          {testing ? "Testing…" : "Test"}
        </button>
      </div>
      <p className="-mt-3 text-[13px] text-ink-2">
        Free models are listed first, then by context size. The default is {initial.default_model}.
        {!initial.ready && <span className="block text-danger">Set OPENROUTER_API_KEY in the backend .env and restart it.</span>}
      </p>
      {models?.error && <p className="hint">Couldn’t load the model list, so type the id instead. {models.error}</p>}
      {test && <p role="status" className={`text-[13px] ${test.ok ? "text-ok" : "text-danger"}`}>{test.message}</p>}

      <details className="text-[13px] text-ink-2">
        <summary className="cursor-pointer">Provider policy (reviewed {String(initial.policy.reviewed)})</summary>
        <dl className="mt-2 grid gap-x-3 gap-y-1 sm:grid-cols-[max-content_1fr]">
          {Object.entries(initial.policy).map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="font-medium">{k.replaceAll("_", " ")}</dt>
              <dd className="break-words">{Array.isArray(v) ? v.join(", ") : v}</dd>
            </div>
          ))}
        </dl>
      </details>

      <div className="flex items-center gap-3 border-t border-rule pt-4">
        <button className="btn btn-primary" disabled={act.busy || !changed || !model}>Save</button>
        <Result error={act.error} done={act.done} />
      </div>
    </form>
  );
}
