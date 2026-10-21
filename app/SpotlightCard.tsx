"use client";

import React, { useRef, useState, useCallback, type MouseEvent, type ReactNode } from "react";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
  spotlightRadius?: number;
}

/**
 * High-performance SpotlightCard component:
 * Tracks pointer motion to render a dynamic, subtle cursor-reactive specular highlight
 * across dark borders and glass surfaces without triggering React re-renders.
 */
export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(255, 215, 0, 0.18)",
  spotlightRadius = 380,
  ...props
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    divRef.current.style.setProperty("--mouse-x", `${x}px`);
    divRef.current.style.setProperty("--mouse-y", `${y}px`);
    divRef.current.style.setProperty("--spotlight-opacity", "1");
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!divRef.current) return;
    divRef.current.style.setProperty("--spotlight-opacity", "1");
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!divRef.current) return;
    divRef.current.style.setProperty("--spotlight-opacity", "0");
  }, []);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={`relative overflow-hidden ${className}`}
      style={{
        // CSS variables for spotlight coordinates
        ["--spotlight-color" as string]: spotlightColor,
        ["--spotlight-radius" as string]: `${spotlightRadius}px`,
      }}
      {...props}
    >
      {/* Specular spotlight overlay */}
      <div
        className="pointer-events-none absolute -inset-px rounded-[inherit] transition-opacity duration-300 ease-out"
        style={{
          opacity: isFocused ? 1 : "var(--spotlight-opacity, 0)",
          background: `radial-gradient(var(--spotlight-radius, 380px) circle at var(--mouse-x, 0px) var(--mouse-y, 0px), var(--spotlight-color, rgba(255, 215, 0, 0.18)), transparent 80%)`,
        }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
