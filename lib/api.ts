// Server-side client for the FastAPI backend: forwards the visitor's session cookie.
// Client components use `send` from lib/client.ts, which goes through the /api rewrite.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const API_URL = process.env.API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T>(path: string): Promise<T> {
  const cookie = (await cookies()).toString();
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store", headers: { cookie } });
  if (res.status === 401) redirect("/login");
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json() as Promise<T>;
}

export type Role = "admin" | "analyst" | "maintainer";

export type Me = {
  id: string;
  email: string;
  name: string;
  role: Role;
  institution_id: string | null;
  institution_name: string | null;
  email_verified: boolean;
  onboarded: boolean;
  avatar_url: string | null;
  handle: string | null;
  reputation: number;
  tier: Tier | null; // analysts only
  digest_enabled: boolean;
  unread_notifications: number;
  is_senior_reviewer: boolean; // admins act as senior reviewers whatever this says
};

export type Tier = "newcomer" | "contributor" | "expert" | "fellow";

/** For public pages (no sign-in): no cookie, no login redirect; 404 -> null. */
export async function publicApi<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json() as Promise<T>;
}

export const getMe = () => api<Me>("/auth/me");

/** Signed-in extras on public pages: forwards the cookie but never redirects; 401 -> null. */
export async function apiIfSignedIn<T>(path: string): Promise<T | null> {
  const cookie = (await cookies()).toString();
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store", headers: { cookie } });
  if (res.status === 401) return null;
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json() as Promise<T>;
}
