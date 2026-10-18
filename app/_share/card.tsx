// Open Graph cards (1200x630) for LinkedIn previews. Satori renders these: flexbox only, no
// webp, no woff2, hence the -og.png tier images and the ttf copies of Zodiak in ./fonts.
// One layout for every share: medallion or mark on the left, the claim in Zodiak on the right.
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const C = { canvas: "#f5f7fb", ink: "#0a1033", ink2: "#5c6178", blue: "#003bfd", rule: "#dde2ee", tint: "#edf1ff" };
const asset = (...p: string[]) => readFile(join(process.cwd(), ...p));
const dataUrl = async (...p: string[]) => `data:image/png;base64,${(await asset(...p)).toString("base64")}`;

export async function shareCard({ kicker, title, detail, tier, stats = [] }: {
  kicker: string;          // who / what, small, above the claim
  title: string;           // the claim
  detail?: string;         // one supporting line
  tier?: string;           // shows that tier's medallion; otherwise the AVP mark
  stats?: [string, string][]; // [number, label]
}) {
  const [regular, bold, art, mark] = await Promise.all([
    asset("app/_share/fonts/Zodiak-400.ttf"),
    asset("app/_share/fonts/Zodiak-700.ttf"),
    tier ? dataUrl("public/brand/tiers", `${tier}-og.png`) : dataUrl("public/brand/mark.png"),
    dataUrl("public/brand/mark.png"),
  ]);
  const long = title.length > 60;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: C.canvas, fontFamily: "Zodiak", color: C.ink }}>
        <div style={{ height: 10, background: C.blue, display: "flex" }} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 64, padding: "0 80px" }}>
          <div style={{ width: 300, height: 300, borderRadius: 300, background: tier ? "transparent" : C.tint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- satori renders plain img */}
            <img src={art} alt="" width={tier ? 300 : 170} height={tier ? 300 : 160} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ fontSize: 30, color: C.ink2, display: "flex" }}>{kicker}</div>
            <div style={{ fontSize: long ? 54 : 68, fontWeight: 700, lineHeight: 1.08, marginTop: 14, letterSpacing: -1, display: "flex" }}>{title}</div>
            {detail && <div style={{ fontSize: 30, color: C.ink2, marginTop: 20, lineHeight: 1.3, display: "flex" }}>{detail}</div>}
            {stats.length > 0 && (
              <div style={{ display: "flex", gap: 48, marginTop: 36 }}>
                {stats.map(([n, l]) => (
                  <div key={l} style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 52, fontWeight: 700, color: C.blue }}>{n}</span>
                    <span style={{ fontSize: 24, color: C.ink2 }}>{l}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "26px 80px", borderTop: `2px solid ${C.rule}` }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- satori renders plain img */}
          <img src={mark} alt="" width={40} height={38} />
          <span style={{ fontSize: 26, fontWeight: 700 }}>Academic Venture Pipeline</span>
          <span style={{ fontSize: 24, color: C.ink2, marginLeft: "auto" }}>University inventions, reviewed by analysers</span>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Zodiak", data: regular, weight: 400 }, { name: "Zodiak", data: bold, weight: 700 }] },
  );
}
