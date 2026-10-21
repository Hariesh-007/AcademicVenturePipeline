import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import localFont from "next/font/local";
import { ScrollProgress } from "./ScrollProgress";
import { GoldenWaveBackground } from "./GoldenWaveBackground";
import { MotionEffects } from "./MotionEffects";
import { MotionProvider } from "./ui/motion/MotionProvider";
import "./globals.css";

// Zodiak: Fontshare / Indian Type Foundry, ITF Free Font License (self-hosted).
const zodiak = localFont({
  variable: "--font-zodiak",
  src: [
    { path: "./fonts/Zodiak-300.woff2", weight: "300" },
    { path: "./fonts/Zodiak-400.woff2", weight: "400" },
    { path: "./fonts/Zodiak-700.woff2", weight: "700" },
  ],
});
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Sets data-theme before first paint so dark-mode users never see a white flash.
// The landing pins its own light palette (landing.module.css), so this only affects the app.
const THEME_SCRIPT = `try{var t=localStorage.getItem("avp-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=t}catch(e){}`;

export const metadata: Metadata = {
  // absolute base for Open Graph images: LinkedIn fetches them from outside
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: "Academic Venture Pipeline",
  description: "Academic Venture Pipeline helps technology-transfer teams, venture builders, and research investors validate university IP with evidence-backed commercialisation dossiers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${zodiak.variable} ${plexMono.variable} ${plexSans.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <noscript>
          <style>{`.motion-reveal,.motion-stagger-item{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="min-h-full flex flex-col font-sans relative">
        <GoldenWaveBackground />
        <MotionEffects />
        <MotionProvider>
          <ScrollProgress />
          <div className="relative z-10 flex min-h-full flex-col flex-1">
            {children}
          </div>
        </MotionProvider>
      </body>
    </html>
  );
}
