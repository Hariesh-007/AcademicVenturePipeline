// Decodes (does NOT verify) the session cookie: only for routing and choosing which links to
// show. Every API call is still authorised by the backend.
export const HOME = { admin: "/admin/documents", analyst: "/library", maintainer: "/uploads" } as const;
export type SessionRole = keyof typeof HOME;
export const SESSION_COOKIE = "avp_session";

export function sessionOf(token: string | undefined): { role: SessionRole; onboarded: boolean } | null {
  try {
    const payload = JSON.parse(atob(token!.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp * 1000 < Date.now() || !(payload.role in HOME)) return null;
    // tokens issued before onboarding existed have no `ob`: those users were grandfathered
    return { role: payload.role, onboarded: payload.ob ?? true };
  } catch {
    return null;
  }
}
