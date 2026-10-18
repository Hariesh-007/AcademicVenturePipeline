// Server components only (reads request cookies). Kept apart from session.ts so proxy.ts
// doesn't pull in next/headers.
import { cookies } from "next/headers";
import { SESSION_COOKIE, sessionOf } from "./session";

export async function currentSession() {
  return sessionOf((await cookies()).get(SESSION_COOKIE)?.value);
}
