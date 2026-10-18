// Optimistic routing only: decodes (does not verify) the session to pick a home and keep
// roles out of each other's sections. Every API call is still authorised by the backend.
// Public pages (/, /t/[id], /a/[handle], /analysts) pass straight through; they're matched only
// so an invite (?ref=handle) is remembered in a cookie until sign-up, even after browsing away.
import { NextResponse, type NextRequest } from "next/server";
import { HOME, SESSION_COOKIE, sessionOf, type SessionRole } from "./lib/session";
// change to verify the commit signature
// section -> roles allowed (admin goes everywhere)
const SECTIONS: [string, SessionRole[]][] = [
  ["/admin", ["admin"]],
  ["/library", ["admin", "analyst"]],
  ["/uploads", ["admin", "maintainer"]],
  ["/rewards", ["analyst"]],
  ["/senior", ["admin", "analyst"]], // senior reviewers are flagged analysts; the API checks the flag
];
// signed-out pages; a signed-in visitor is sent home instead
const GUEST_ONLY = ["/login", "/signup", "/forgot"];
const REF_COOKIE = "avp_ref";
const isPublic = (p: string) => p === "/" || p === "/analysts" || p.startsWith("/t/") || p.startsWith("/a/");

export function proxy(req: NextRequest) {
  const res = route(req);
  const ref = req.nextUrl.searchParams.get("ref");
  if (ref && /^[A-Za-z0-9_.-]{1,30}$/.test(ref)) {
    res.cookies.set(REF_COOKIE, ref, { maxAge: 30 * 86400, sameSite: "lax", httpOnly: true, path: "/" });
  }
  return res;
}

function route(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = sessionOf(req.cookies.get(SESSION_COOKIE)?.value);
  const to = (path: string) => NextResponse.redirect(new URL(path, req.url));
  if (isPublic(pathname)) return NextResponse.next();

  if (GUEST_ONLY.includes(pathname)) return session ? to(HOME[session.role]) : NextResponse.next();
  if (!session) return to(`/login?next=${encodeURIComponent(pathname)}`);
  const { role, onboarded } = session;
  // a new analyst finishes their profile before anything else
  if (role === "analyst" && !onboarded) return pathname === "/onboarding" ? NextResponse.next() : to("/onboarding");
  if (pathname === "/onboarding" || pathname === "/app") return to(HOME[role]);
  const section = SECTIONS.find(([p]) => pathname.startsWith(p));
  if (section && !section[1].includes(role)) return to(HOME[role]);
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/", "/t/:path*", "/a/:path*", "/analysts",
    "/login", "/signup", "/forgot", "/app", "/onboarding",
    "/admin/:path*", "/library/:path*", "/uploads/:path*", "/account", "/rewards", "/senior",
  ],
};
