// The signed-out page frame: form on the left, one line of conviction on the right.
import Link from "next/link";
import { BrandLink, Lockup } from "@/app/_brand/Logo";

export function AuthFrame({ title, lede, children, footer }: {
  title: string; lede: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen bg-transparent lg:grid-cols-[1fr_1.1fr]">
      <section className="flex flex-col justify-between px-6 py-8 sm:px-12 lg:py-12 page-enter">
        <Link href="/" aria-label="Academic Venture Pipeline home" className="w-fit"><BrandLink tile /></Link>
        <div className="w-full max-w-[380px] py-12">
          <h1 className="font-serif text-[34px] leading-[1.1] tracking-[-0.01em]">{title}</h1>
          <p className="mt-2 text-[15px] text-ink-2">{lede}</p>
          {children}
        </div>
        <div className="text-[13px] text-ink-2">{footer}</div>
      </section>
      <aside
        className="hidden border-l border-rule bg-surface/75 backdrop-blur-xl lg:flex lg:flex-col lg:justify-between lg:p-12 shadow-2xl"
        style={{ animation: 'authPanelEnter 520ms cubic-bezier(0.2, 0.7, 0.2, 1) both' }}
      >
        <Lockup width={300} tile className="mt-[8vh] self-center" />
        <blockquote className="max-w-[30ch] font-serif text-[32px] leading-[1.2] text-ink">
          Most university inventions never leave the archive. This is where they get a second reading.
        </blockquote>
      </aside>
      <style>{`
        @keyframes authPanelEnter {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="authPanelEnter"] { animation: none !important; }
        }
      `}</style>
    </main>
  );
}
