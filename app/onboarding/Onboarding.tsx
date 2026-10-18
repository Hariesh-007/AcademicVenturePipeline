"use client";

import Link from "next/link";
import { useState } from "react";
import { send } from "@/lib/client";
import type { Category, MyProfile } from "@/lib/types";
import { Feedback, useAction } from "@/lib/useAction";
import { BrandLink } from "@/app/_brand/Logo";
import { BasicsForm, PhotoField, SocialsForm, Strength, WorkForm } from "@/app/_profile/ProfileForms";

const STEPS = [
  { title: "Who you are", lede: "Your name, a handle for your public page, and one line about what you do." },
  { title: "Your work", lede: "Where you work and what you know. This decides which technologies reach you first." },
  { title: "Where to find you", lede: "Optional. Links let universities and other analysts check your background." },
];
const BASICS = ["name", "handle", "headline"];

export function Onboarding({ seed, email, profile, categories }: {
  seed: string; email: string; profile: MyProfile; categories: Category[];
}) {
  const [step, setStep] = useState(() =>
    profile.missing.some((m) => BASICS.includes(m)) ? 0 : profile.missing.length ? 1 : 2,
  );
  const finish = useAction();

  async function complete() {
    if (await finish.run(() => send("/me/onboarding/complete", { method: "POST" }))) {
      window.location.href = "/library?welcome=1"; // full load: the session cookie was just re-issued
    }
  }

  return (
    <main className="min-h-screen bg-canvas">
      <header className="flex items-center justify-between border-b border-rule bg-surface px-6 py-4 sm:px-10">
        <Link href="/" aria-label="Academic Venture Pipeline home"><BrandLink tile /></Link>
        <span className="truncate text-[13px] text-ink-2">{email}</span>
      </header>

      <div className="mx-auto grid max-w-[1040px] gap-10 px-6 py-10 sm:px-10 lg:grid-cols-[260px_1fr] lg:py-14">
        <aside className="flex flex-col gap-8">
          <div>
            <h1 className="font-serif text-[30px] leading-[1.15] tracking-[-0.01em]">Set up your analyst profile</h1>
            <p className="mt-2 text-[15px] text-ink-2">Three short steps, then the library opens.</p>
          </div>
          <ol className="flex flex-col gap-1">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <button type="button" onClick={() => i <= step && setStep(i)} disabled={i > step}
                  aria-current={i === step ? "step" : undefined}
                  className={`flex w-full items-baseline gap-3 rounded-md px-3 py-2 text-left text-[14px] ${
                    i === step ? "bg-blue-tint font-medium text-blue" : i < step ? "text-ink hover:bg-sunken" : "text-ink-3"}`}>
                  <span className="data">{i + 1}</span>{s.title}
                </button>
              </li>
            ))}
          </ol>
          <Strength value={profile.strength} />
        </aside>

        <section className="panel p-6 sm:p-8">
          <h2 className="font-serif text-[24px] leading-tight">{STEPS[step].title}</h2>
          <p className="mb-6 mt-1 max-w-[60ch] text-[15px] text-ink-2">{STEPS[step].lede}</p>

          {step === 0 && (
            <div className="flex flex-col gap-6">
              <PhotoField profile={profile} seed={seed} />
              <BasicsForm profile={profile} submitLabel="Continue" onSaved={() => setStep(1)} />
            </div>
          )}
          {step === 1 && <WorkForm profile={profile} categories={categories} submitLabel="Continue" onSaved={() => setStep(2)} />}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <SocialsForm profile={profile} submitLabel="Save and open the library" onSaved={complete} />
              <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-4">
                <button type="button" className="btn btn-quiet" disabled={finish.busy} onClick={complete}>
                  Skip links and open the library
                </button>
                <Feedback error={finish.error} />
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
