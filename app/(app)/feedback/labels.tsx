import type { FeedbackKind, FeedbackStatus } from "@/lib/types";

export const KINDS: { value: FeedbackKind; label: string; hint: string }[] = [
  { value: "bug", label: "Something broke", hint: "An error, a blank page, a button that does nothing" },
  { value: "feature", label: "Feature idea", hint: "Something you wish AVP did" },
  { value: "content", label: "Content problem", hint: "A wrong title, missing pages, unreadable text, a bad summary" },
  { value: "product", label: "Product quality", hint: "Confusing, slow or awkward to use" },
  { value: "other", label: "Something else", hint: "Anything that doesn't fit above" },
];

export const STATUS: Record<FeedbackStatus, { label: string; tone: string }> = {
  new: { label: "New", tone: "text-blue" },
  in_progress: { label: "In progress", tone: "text-orange-ink dark:text-orange" },
  resolved: { label: "Resolved", tone: "text-ok" },
  wont_fix: { label: "Won't fix", tone: "text-ink-2" },
};

export const kindLabel = (k: FeedbackKind) => KINDS.find((x) => x.value === k)?.label ?? k;

export function StatusTag({ status }: { status: FeedbackStatus }) {
  return <span className={`status ${STATUS[status].tone}`}>{STATUS[status].label}</span>;
}

export const when = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
