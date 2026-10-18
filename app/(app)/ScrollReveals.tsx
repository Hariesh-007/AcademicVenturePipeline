"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollReveals() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Respect reduced-motion preferences
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const main = document.getElementById("main");
    if (!main) return;

    // Select candidate elements: .panel and .app-page-header within #main
    const candidates = main.querySelectorAll<HTMLElement>(".panel, .app-page-header");

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            obs.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -40px 0px",
        threshold: 0.05,
      }
    );

    candidates.forEach((el) => {
      // Exclude collapsed (e.g. hidden), busy, or explicitly excluded elements
      if (
        el.closest("[hidden]") ||
        el.closest("[inert]") ||
        el.getAttribute("aria-hidden") === "true" ||
        el.getAttribute("aria-busy") === "true" ||
        el.closest('[aria-busy="true"]') ||
        el.classList.contains("no-reveal") ||
        el.hasAttribute("data-no-reveal")
      ) {
        return;
      }

      el.classList.add("scroll-reveal");
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
