"use client";

import { useState } from "react";
import { send } from "@/lib/client";
import type { RouteDecision, RouteKind } from "@/lib/types";
import { Feedback, useAction } from "@/lib/useAction";

const ROUTES: { value: RouteKind; label: string }[] = [
  { value: "incubation", label: "Incubation" },
  { value: "industry_collaboration", label: "Industry collaboration" },
  { value: "further_research", label: "Further research" },
  { value: "external_appraisal", label: "External appraisal" },
  { value: "shelve", label: "Shelve" },
];
const label = (r: string) => ROUTES.find((x) => x.value === r)?.label ?? r;
const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

/** Stage 11: the university decides where an approved technology goes. Re-routing adds history. */
export function Routing({ technologyId, finalTrl, history }: { technologyId: string; finalTrl: number | null; history: RouteDecision[] }) {
  const [route, setRoute] = useState<RouteKind>("incubation");
  const [rationale, setRationale] = useState("");
  const [party, setParty] = useState("");
  const { run, busy, error, done } = useAction();
  return (
    <section>
      <h2 className="label">Routing</h2>
      <div className="panel flex flex-col gap-3 p-4 text-[14px]">
        <p>The dossier is approved{finalTrl != null && <> at TRL {finalTrl}</>}. Decide where it goes next.</p>
        {history[0] && <p className="text-ink-2">Currently: <span className="font-medium text-ink">{label(history[0].route)}</span></p>}
        <div>
          <label className="label" htmlFor="route">Route</label>
          <select id="route" className="input" value={route} onChange={(e) => setRoute(e.target.value as RouteKind)}>
            {ROUTES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        {route === "external_appraisal" && (
          <div>
            <label className="label" htmlFor="party">External party</label>
            <input id="party" className="input" maxLength={300} value={party} onChange={(e) => setParty(e.target.value)} />
          </div>
        )}
        <div>
          <label className="label" htmlFor="why">Why</label>
          <textarea id="why" className="input min-h-20 py-2" value={rationale} onChange={(e) => setRationale(e.target.value)} />
        </div>
        <button type="button" className="btn btn-primary self-start" disabled={busy || !rationale.trim()}
          onClick={() => run(() => send(`/technologies/${technologyId}/routing`, {
            json: { route, rationale, external_party: route === "external_appraisal" ? party : null },
          }), history.length ? "Re-routed" : "Routed")}>
          {history.length ? "Re-route" : "Route"}
        </button>
        <Feedback error={error} done={done} />
        {history.length > 0 && (
          <ul className="flex flex-col gap-1 border-t border-rule pt-3 text-[13px] text-ink-2">
            {history.map((h) => (
              <li key={h.id}>
                {date.format(new Date(h.created_at))}: <span className="text-ink">{label(h.route)}</span>
                {h.external_party && <> ({h.external_party})</>}. {h.rationale}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
