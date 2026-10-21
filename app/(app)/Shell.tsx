"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import type { Me } from "@/lib/api";
import { send } from "@/lib/client";
import { BrandLink } from "@/app/_brand/Logo";
import { Avatar } from "@/app/_profile/Avatar";
import { TierBadge, tierLabel } from "@/app/_profile/Credibility";
import { Inbox } from "@/app/_community/Inbox";

const NAV: Record<Me["role"], { href: string; label: string }[]> = {
  admin: [
    { href: "/admin/documents", label: "Documents" },
    { href: "/library", label: "Library" },
    { href: "/admin/universities", label: "Universities" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/categories", label: "Categories" },
    { href: "/admin/challenges", label: "Challenges" },
    { href: "/admin/analytics", label: "Analytics" },
    { href: "/admin/feedback", label: "Feedback" },
    { href: "/admin/settings", label: "Settings" },
  ],
  analyst: [
    { href: "/library", label: "Library" },
    { href: "/rewards", label: "Rewards" },
    { href: "/analysts", label: "Analysts" },
  ],
  maintainer: [
    { href: "/uploads", label: "Uploads" },
    { href: "/uploads/new", label: "New upload" },
  ],
};

const ROLE_LABEL = { admin: "Platform admin", analyst: "Analyser", maintainer: "Maintainer" };

function ThemeToggle() {
  // label comes from CSS (dark: variant), so no state to sync with the pre-paint script
  const flip = () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("avp-theme", next);
    } catch {}
  };
  return (
    <button type="button" className="btn btn-quiet btn-sm w-full justify-start" onClick={flip}>
      <span className="dark:hidden">Dark theme</span>
      <span className="hidden dark:inline">Light theme</span>
    </button>
  );
}

function RailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1.75" y="2.75" width="12.5" height="10.5" rx="2" />
      <path d="M6 2.75v10.5" />
    </svg>
  );
}

/** Sidebar shown or hidden, remembered per context: the technology reader starts hidden
 *  (reading needs the width), everything else starts shown. "[" toggles it anywhere. */
function useRail(path: string) {
  const reading = /^\/library\/[^/]+$/.test(path);
  const key = reading ? "avp-rail-reading" : "avp-rail";
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      const read = (k: string) => (localStorage.getItem(k) === null ? undefined : localStorage.getItem(k) === "1");
      setSaved({ "avp-rail": read("avp-rail"), "avp-rail-reading": read("avp-rail-reading") } as Record<string, boolean>); // eslint-disable-line react-hooks/set-state-in-effect
    } catch {}
  }, []);
  const open = saved[key] ?? !reading;
  const toggle = () => {
    setSaved((s) => ({ ...s, [key]: !open }));
    try { localStorage.setItem(key, open ? "0" : "1"); } catch {}
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key !== "[" || e.metaKey || e.ctrlKey || e.altKey || el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  return { open, toggle };
}

export function Shell({ me, children }: { me: Me; children: React.ReactNode }) {
  const path = usePathname();
  const rail = useRail(path);
  const items = me.role === "admin" || me.is_senior_reviewer
    ? [...NAV[me.role].slice(0, 2), { href: "/senior", label: "Senior review" }, ...NAV[me.role].slice(2)]
    : NAV[me.role];
  // longest matching href wins, so /uploads/new doesn’t also light up /uploads
  const active = items
    .filter((i) => path === i.href || path.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  async function signOut() {
    await send("/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const renderNav = (idPrefix: string) => (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {items.map((i) => {
        const isActive = active === i.href;
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={isActive ? "page" : undefined}
            className={`relative rounded-md px-3 py-2 text-[14px] nav-link transition-colors ${
              isActive
                ? "font-medium text-blue"
                : "text-ink-2 hover:bg-sunken hover:text-ink"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId={`${idPrefix}-active-indicator`}
                className="absolute inset-0 rounded-md bg-blue-tint nav-indicator"
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                }}
              />
            )}
            <span className="relative z-10">{i.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="flex flex-col gap-1 border-t border-rule pt-3">
      <Link href="/account" className="flex items-center gap-3 rounded-md px-3 py-2 transition-[background-color,transform] duration-150 hover:bg-sunken hover:translate-x-0.5">
        <Avatar name={me.name || me.email} url={me.avatar_url} seed={me.id} size={36} />
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-medium">{me.name || me.email}</span>
          <span className="flex items-center gap-1.5 truncate text-[12.5px] text-ink-2">
            {me.tier && <TierBadge tier={me.tier} size={16} />}
            {me.tier ? `${tierLabel(me.tier)} analyser` : ROLE_LABEL[me.role]}
            {me.institution_name ? `, ${me.institution_name}` : ""}
          </span>
        </span>
      </Link>
      <Link href="/account" className="btn btn-quiet btn-sm justify-start">
        Profile
      </Link>
      {me.handle && (
        <Link href={`/a/${me.handle}`} className="btn btn-quiet btn-sm justify-start">
          Public page
        </Link>
      )}
      {me.role !== "maintainer" && <Inbox unread={me.unread_notifications} handle={me.handle} />}
      {me.role !== "admin" && (
        <Link href={`/feedback?from=${encodeURIComponent(path)}`} className="btn btn-quiet btn-sm justify-start">
          Send feedback
        </Link>
      )}
      <ThemeToggle />
      <button type="button" className="btn btn-quiet btn-sm justify-start" onClick={signOut}>
        Sign out
      </button>
    </div>
  );

  return (
    <div className={`min-h-screen lg:grid motion-safe:transition-[grid-template-columns] motion-safe:duration-200 motion-safe:ease-out ${
      rail.open ? "lg:grid-cols-[232px_minmax(0,1fr)]" : "lg:grid-cols-[0px_minmax(0,1fr)]"}`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 btn">
        Skip to content
      </a>
      {/* desktop rail */}
      <aside id="rail" aria-label="Sidebar" inert={!rail.open}
        style={{ viewTransitionName: 'site-rail' }}
        className={`sticky top-0 hidden h-screen min-w-0 overflow-hidden bg-surface/85 backdrop-blur-md lg:block ${rail.open ? "border-r border-rule" : ""}`}>
        <div className="flex h-full w-[232px] flex-col justify-between p-3">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-2 pt-2 pl-3">
              <Link href="/app" aria-label="Dashboard">
                <BrandLink tile />
              </Link>
              <button type="button" onClick={rail.toggle} aria-controls="rail" aria-expanded={rail.open}
                title="Hide sidebar ( [ )" className="grid size-8 place-items-center rounded-md text-ink-2 hover:bg-sunken hover:text-ink">
                <RailIcon />
                <span className="sr-only">Hide sidebar</span>
              </button>
            </div>
            {renderNav("desktop")}
          </div>
          {footer}
        </div>
      </aside>
      {!rail.open && (
        <button type="button" onClick={rail.toggle} aria-controls="rail" aria-expanded={false}
          className="btn btn-sm fixed bottom-4 left-4 z-40 hidden shadow-[0_8px_24px_-12px_rgb(10_16_51/0.35)] backdrop-blur-md lg:inline-flex">
          <RailIcon />
          Menu
          <kbd className="data rounded border border-rule px-1 text-[11px] leading-4 text-ink-3">[</kbd>
        </button>
      )}
      {/* mobile bar: native disclosure, no JS menu state */}
      <details className="mobile-nav group border-b border-rule bg-surface/85 backdrop-blur-md lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
          <BrandLink size={24} tile />
          <span className="text-[14px] text-ink-2">
            <span className="group-open:hidden">Menu</span>
            <span className="hidden group-open:inline">Close</span>
          </span>
        </summary>
        <div className="mobile-nav-content flex flex-col gap-4 px-2 pb-3">
          {renderNav("mobile")}
          {footer}
        </div>
      </details>
      <main id="main" className="min-w-0 px-4 py-6 sm:px-8 lg:px-10 lg:py-8 route-content-fade page-enter">
        {children}
      </main>
    </div>
  );
}
