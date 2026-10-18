// Photo, or initials on a hue derived from the person (stable across pages, no stored colour).

function hue(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts.at(-1)![0] : "")).toUpperCase();
}

export function Avatar({ name, url, seed, size = 40, className = "" }: {
  name: string; url: string | null; seed: string; size?: number; className?: string;
}) {
  const box = { width: size, height: size };
  if (url) {
    // public object-storage URL, stored as uploaded; object-cover does the crop
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" style={box} className={`shrink-0 rounded-md object-cover ${className}`} />;
  }
  const h = hue(seed);
  return (
    <span
      aria-hidden
      style={{ ...box, fontSize: size * 0.4, background: `oklch(0.93 0.04 ${h})`, color: `oklch(0.35 0.09 ${h})` }}
      className={`inline-flex shrink-0 items-center justify-center rounded-md font-serif leading-none ${className}`}
    >
      {initials(name || seed)}
    </span>
  );
}
