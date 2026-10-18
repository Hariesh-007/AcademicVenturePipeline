import Link from "next/link";
import { api, getMe } from "@/lib/api";
import type { Category, Credibility, MyProfile } from "@/lib/types";
import { Badges, TierLadder } from "@/app/_profile/Credibility";
import { captions, withRef } from "@/app/_share/links";
import { ShareButton } from "@/app/_share/ShareButton";
import { BasicsForm, PhotoField, SocialsForm, Strength, WorkForm } from "@/app/_profile/ProfileForms";
import { PageHeader } from "@/app/(app)/ui";
import { DigestToggle } from "./DigestToggle";
import { PasswordForm } from "./PasswordForm";

function Section({ title, lede, children }: { title: string; lede?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 border-t border-rule py-8 lg:grid-cols-[240px_1fr]">
      <div>
        <h2 className="font-serif text-[20px] leading-tight">{title}</h2>
        {lede && <p className="mt-1 text-[14px] text-ink-2">{lede}</p>}
      </div>
      <div className="max-w-[640px]">{children}</div>
    </section>
  );
}

export default async function AccountPage() {
  const me = await getMe();
  const analyst = me.role === "analyst";
  const [profile, categories, cred] = await Promise.all([
    api<MyProfile>("/me/profile"),
    analyst ? api<Category[]>("/categories") : Promise.resolve([]),
    analyst ? api<Credibility>("/me/credibility") : Promise.resolve(null),
  ]);

  return (
    <>
      <PageHeader
        title="Profile"
        lede={me.email}
        actions={analyst && profile.handle ? (
          <>
            <Link href={`/a/${profile.handle}`} className="btn">View public page</Link>
            <ShareButton path={withRef(`/a/${profile.handle}`, profile.handle)} caption={captions.profile()} label="Share my profile" />
          </>
        ) : undefined}
      />
      {analyst && <div className="mb-8 max-w-[420px]"><Strength value={profile.strength} /></div>}
      {cred && (
        <Section title="Standing" lede="Earned when other analysts find your reviews helpful, and when your verdicts prove right.">
          <TierLadder reputation={cred.reputation} tier={cred.tier} share={profile.handle ?? undefined}
            next={{ tier: cred.next_tier, to_next: cred.to_next, unlocks: cred.next_unlocks }} />
          {cred.badges.length > 0 && (
            <div className="mt-6 max-w-[560px]">
              <h3 className="label">Badges</h3>
              <Badges badges={cred.badges} share={profile.handle ?? undefined} />
            </div>
          )}
          <Link href="/rewards" className="btn btn-sm mt-5">See rewards</Link>
        </Section>
      )}
      <Section title="Photo" lede={analyst ? "Shown on your public page and next to your reviews." : "Shown in the sidebar."}>
        <PhotoField profile={profile} seed={me.id} />
      </Section>
      <Section title={analyst ? "Who you are" : "Name"}>
        <BasicsForm profile={profile} nameOnly={!analyst} />
      </Section>
      {analyst && (
        <>
          <Section title="Work and expertise" lede="Expertise decides which technologies reach you first.">
            <WorkForm profile={profile} categories={categories} />
          </Section>
          <Section title="Links" lede="Hidden links stay private to you.">
            <SocialsForm profile={profile} />
          </Section>
        </>
      )}
      {analyst && (
        <Section title="Email">
          <DigestToggle initial={me.digest_enabled} />
        </Section>
      )}
      <Section title="Password">
        <PasswordForm />
      </Section>
    </>
  );
}
