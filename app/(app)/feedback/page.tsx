import type { Metadata } from "next";
import { Suspense } from "react";
import { api } from "@/lib/api";
import { PanelBones } from "@/app/(app)/skeletons";
import type { FeedbackItem, FeedbackKind } from "@/lib/types";
import { PageHeader } from "@/app/(app)/ui";
import { FeedbackForm } from "./FeedbackForm";
import { kindLabel, StatusTag, when } from "./labels";

export const metadata: Metadata = { title: "Feedback · AVP" };

export default async function FeedbackPage({ searchParams }: PageProps<"/feedback">) {
  const sp = await searchParams;
  const from = typeof sp.from === "string" && sp.from.startsWith("/") ? sp.from : "";
  return (
    <>
      <PageHeader
        title="Send feedback"
        lede="Tell us what broke, what's missing, or where a technology's content looks wrong. The platform team reads every note and updates its status here."
      />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
        <FeedbackForm from={from} kind={typeof sp.kind === "string" ? (sp.kind as FeedbackKind) : undefined} />
        <section aria-labelledby="mine">
          <h2 id="mine" className="font-serif text-[20px]">Your feedback</h2>
          <Suspense fallback={<div className="mt-3"><PanelBones /></div>}><Mine /></Suspense>
        </section>
      </div>
    </>
  );
}

async function Mine() {
  const mine = await api<FeedbackItem[]>("/me/feedback");
  return (
    <>
      {mine.length === 0 ? (
        <p className="mt-2 text-[14px] text-ink-2">Nothing sent yet. What you send shows up here with its status.</p>
      ) : (
        <ul className="mt-3 panel divide-y divide-rule">
          {mine.map((f) => (
            <li key={f.id} className="flex flex-col gap-1 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[15px] font-medium">{f.subject}</span>
                <StatusTag status={f.status} />
              </div>
              <span className="text-[13px] text-ink-2">
                {kindLabel(f.kind)}, {when.format(new Date(f.created_at))}
              </span>
              {f.reply && (
                <div className="mt-1 rounded-[8px] bg-sunken px-3 py-2 text-[14px]">
                  <p className="text-[13px] text-ink-2">Reply from the team{f.replied_at && `, ${when.format(new Date(f.replied_at))}`}</p>
                  <p className="mt-0.5 whitespace-pre-line leading-relaxed">{f.reply}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
