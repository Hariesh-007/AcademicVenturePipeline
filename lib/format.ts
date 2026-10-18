// Plain helpers shared by server and client components (no "use client" here).

/** A field value as display text: lists joined, parties by name. */
export function show(v: unknown): string {
  if (v == null || v === "") return "—";
  if (Array.isArray(v)) return v.map(show).join(", ");
  if (typeof v === "object") return String((v as { name?: string }).name ?? JSON.stringify(v));
  return String(v);
}
