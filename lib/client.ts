// Browser-side calls through the same-origin /api rewrite (session cookie rides along).

export class SendError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Turns FastAPI error bodies ({detail: string | {message} | [{msg}]}) into one readable line. */
function readable(body: unknown, status: number): string {
  const d = (body as { detail?: unknown })?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((e) => `${e.loc?.slice(-1)[0] ?? ""}: ${e.msg}`).join("; ");
  if (d && typeof d === "object") {
    const o = d as { message?: string; code?: string; blocking?: string[] };
    if (o.blocking) return o.blocking.join("; ");
    return o.message ?? o.code ?? JSON.stringify(o);
  }
  return status >= 500 ? "The server had a problem. Try again in a moment." : `Request failed (${status})`;
}

export async function send<T = unknown>(
  path: string,
  init: { method?: string; json?: unknown; form?: FormData } = {},
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: init.method ?? (init.json || init.form ? "POST" : "GET"),
    headers: init.json !== undefined ? { "content-type": "application/json" } : undefined,
    body: init.form ?? (init.json !== undefined ? JSON.stringify(init.json) : undefined),
  });
  if (res.status === 401 && !path.startsWith("/auth/login")) {
    window.location.href = "/login";
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new SendError(res.status, readable(body, res.status));
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}
