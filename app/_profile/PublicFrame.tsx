// Chrome for the public (signed-out) analyst pages.
import Link from "next/link";
import { currentSession } from "@/lib/currentSession";
import { BrandLink } from "@/app/_brand/Logo";

/** invitedBy: the ?ref handle of whoever shared this page, carried into sign-up. */
export async function PublicFrame({ children, invitedBy }: { children: React.ReactNode; invitedBy?: string }) {
  const signedIn = (await currentSession()) !== null;
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-rule bg-surface">
        <div className="mx-auto flex max-w-[1040px] items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <Link href="/" aria-label="Academic Venture Pipeline home"><BrandLink tile /></Link>
          <nav aria-label="Public" className="flex items-center gap-1">
            <Link href="/analysts" className="btn btn-quiet btn-sm">Analysts</Link>
            {signedIn ? (
              <Link href="/app" className="btn btn-sm">Your dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="btn btn-quiet btn-sm">Sign in</Link>
                <Link href={invitedBy ? `/signup?ref=${encodeURIComponent(invitedBy)}` : "/signup"} className="btn btn-sm">Become an analyser</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1040px] px-4 py-10 sm:px-8 lg:py-14">{children}</main>
    </div>
  );
}
