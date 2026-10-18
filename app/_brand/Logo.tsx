// The AVP mark (columns rising from a wave) and the full lockup with the name.
// Keyed PNGs in /public/brand. The artwork is navy, so on dark surfaces it sits on a light
// tile instead of disappearing (pass `tile` where the page follows the app theme).
/* eslint-disable @next/next/no-img-element -- static brand PNGs, already sized; no optimiser needed */

const TILE = "dark:rounded-md dark:bg-[#f5f7fb] dark:p-1";

export function Mark({ size = 28, tile = false, className = "" }: { size?: number; tile?: boolean; className?: string }) {
  return (
    <span className={`brand-mark-motion inline-flex shrink-0 items-center ${tile ? TILE : ""} ${className}`}>
      <img src="/brand/mark.png" alt="" width={Math.round(size * 1.06)} height={size} style={{ height: size, width: "auto" }} />
    </span>
  );
}

/** Mark + "AVP" for navs: the image is decorative, the text is the accessible name. */
export function BrandLink({ size = 28, tile = false, label = "AVP" }: { size?: number; tile?: boolean; label?: string }) {
  return (
    <span className="brand-link-motion inline-flex items-center gap-2.5">
      <Mark size={size} tile={tile} />
      <span className="font-serif text-[20px] leading-none">{label}</span>
    </span>
  );
}

export function Lockup({ width = 280, tile = false, className = "" }: { width?: number; tile?: boolean; className?: string }) {
  return (
    <span className={`inline-block ${tile ? "dark:rounded-xl dark:bg-[#f5f7fb] dark:p-4" : ""} ${className}`}>
      <img src="/brand/lockup.png" alt="Academic Venture Pipeline" width={width} height={Math.round(width * 1.025)} style={{ width, height: "auto" }} />
    </span>
  );
}
