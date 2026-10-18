"use client";

// One share control for everything AVP lets people post: a profile, a tier, a badge, a
// technology. LinkedIn only for now. LinkedIn's official share link takes just a URL (the post
// preview comes from that page's Open Graph card), so we also offer a caption to paste.
// Native <details>, like the inbox: keyboard and screen-reader friendly with no menu state.
import { useRef, useState } from "react";
import { linkedIn } from "./links";

function LinkedInMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <rect width="24" height="24" rx="4" fill="#0a66c2" />
      <path fill="#fff" d="M7.1 9.6h-2.6V19h2.6V9.6Zm.2-2.9a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0ZM19.5 13.4c0-2.6-1.4-4-3.4-4-1.5 0-2.2.8-2.6 1.4V9.6h-2.6V19h2.6v-5c0-1.3.3-2.5 1.9-2.5s1.6 1.5 1.6 2.6V19h2.6v-5.6Z" />
    </svg>
  );
}

export function ShareButton({ path, caption, label = "Share", privateReason, size = "md", align = "right" }: {
  path: string;          // site path; made absolute at click time
  caption: string;       // suggested post text
  label?: string;
  privateReason?: string; // set when only members can open the link: LinkedIn is not offered
  size?: "sm" | "md";
  align?: "left" | "right";
}) {
  const [copied, setCopied] = useState<"" | "link" | "caption">("");
  const box = useRef<HTMLDetailsElement>(null);
  const url = () => new URL(path, window.location.origin).toString();

  async function copy(what: "link" | "caption") {
    try {
      await navigator.clipboard.writeText(what === "link" ? url() : `${caption}\n\n${url()}`);
      setCopied(what);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      setCopied("");
    }
  }

  return (
    <details ref={box} className="relative" onKeyDown={(e) => { if (e.key === "Escape" && box.current) box.current.open = false; }}>
      <summary className={`btn ${size === "sm" ? "btn-sm btn-quiet" : ""} cursor-pointer list-none`}>
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 10V2.5M5 5.5l3-3 3 3M3 9v4.5h10V9" />
        </svg>
        {label}
      </summary>
      <div className={`absolute top-full z-30 mt-2 flex w-[300px] flex-col gap-1 rounded-[10px] border border-rule bg-surface p-2 shadow-[0_8px_24px_-12px_rgb(10_16_51/0.25)] ${
        align === "right" ? "right-0" : "left-0"}`}>
        {privateReason ? (
          <p className="px-2 py-1.5 text-[13px] text-ink-2">{privateReason}</p>
        ) : (
          <button type="button" onClick={() => window.open(linkedIn(url()), "_blank", "noopener,noreferrer,width=600,height=640")}
            className="flex items-center gap-2.5 rounded-md px-2 py-2 text-left text-[14px] hover:bg-sunken">
            <LinkedInMark />
            Share on LinkedIn
          </button>
        )}
        <button type="button" onClick={() => copy("link")} className="flex items-center gap-2.5 rounded-md px-2 py-2 text-left text-[14px] hover:bg-sunken">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="shrink-0 text-ink-2">
            <path d="M6.5 9.5l3-3M7 4.5l1-1a2.8 2.8 0 0 1 4 4l-1 1M9 11.5l-1 1a2.8 2.8 0 0 1-4-4l1-1" />
          </svg>
          {copied === "link" ? "Link copied" : "Copy link"}
        </button>
        {!privateReason && (
          <div className="mt-1 border-t border-rule px-2 pt-2.5 pb-1">
            <p className="text-[12.5px] text-ink-2">LinkedIn starts the post empty. A caption you can paste:</p>
            <p className="mt-1.5 rounded-md bg-sunken px-2.5 py-2 font-serif text-[14px] leading-snug">{caption}</p>
            <button type="button" onClick={() => copy("caption")} className="btn btn-quiet btn-sm mt-1.5 -ml-2">
              {copied === "caption" ? "Caption copied" : "Copy caption with link"}
            </button>
          </div>
        )}
        <span role="status" className="sr-only">{copied ? `${copied === "link" ? "Link" : "Caption"} copied` : ""}</span>
      </div>
    </details>
  );
}
