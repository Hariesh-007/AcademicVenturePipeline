import { Suspense, ViewTransition } from "react";
import { api, getMe } from "@/lib/api";
import { LibraryRowsBones } from "@/app/(app)/skeletons";
import type { Category, Challenge, Follows, Institution, LibraryRow } from "@/lib/types";
import { ChallengeBanner } from "@/app/_community/ChallengeBanner";
import { FollowButton } from "@/app/_community/FollowButton";
import { captions, withRef } from "@/app/_share/links";
import { ShareButton } from "@/app/_share/ShareButton";
import { PageHeader } from "@/app/(app)/ui";
import { Filters } from "./Filters";
import { LibraryList } from "./LibraryList";

export default async function LibraryPage({ searchParams }: PageProps<"/library">) {
  const sp = await searchParams;
  const pick = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const query = new URLSearchParams();
  for (const k of ["q", "category", "institution", "sort"]) if (pick(k)) query.set(k, pick(k));
  // the ranked list (the slowest call) and the challenge banner stream in; filters render first
  const [categories, institutions, follows] = await Promise.all([
    api<Category[]>("/categories"),
    api<Institution[]>("/institutions"),
    api<Follows>("/me/follows"),
  ]);
  const me = sp.welcome ? await getMe() : null; // just finished onboarding
  const category = categories.find((c) => c.id === pick("category"));
  const filtered = ["q", "category", "institution"].some((k) => pick(k));

  return (
    <>
      <PageHeader
        title="Library"
        lede="Technologies from every university, ranked by analysers' votes. Open one to read it and write your review."
      />
      {me?.handle && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-rule bg-surface px-4 py-3">
          <p className="text-[14px] text-ink-2">
            <span className="font-medium text-ink">You&apos;re in.</span> Tell your network you&apos;re reviewing university inventions on AVP.
          </p>
          <ShareButton path={withRef(`/a/${me.handle}`, me.handle)} caption={captions.profile()} label="Share that you joined" size="sm" />
        </div>
      )}
      <Suspense fallback={null}><Challenges /></Suspense>
      <Filters
        categories={categories}
        institutions={institutions}
        value={{ q: pick("q"), category: pick("category"), institution: pick("institution"), sort: pick("sort") || "score" }}
      />
      {category && (
        <div className="-mt-2 mb-4">
          <FollowButton key={category.id} type="category" id={category.id} label={category.name}
            initial={follows.categories.some((f) => f.id === category.id)} />
        </div>
      )}
      {/* keyed on the query: a new search shows the skeleton instead of stale rows */}
      <Suspense
        key={query.toString()}
        fallback={
          <ViewTransition exit="slide-down" default="none">
            <LibraryRowsBones />
          </ViewTransition>
        }
      >
        <ViewTransition enter="slide-up" default="none">
          <Rows query={query.toString()} filtered={filtered} />
        </ViewTransition>
      </Suspense>
    </>
  );
}

async function Rows({ query, filtered }: { query: string; filtered: boolean }) {
  return <LibraryList rows={await api<LibraryRow[]>(`/library?${query}`)} filtered={filtered} />;
}

async function Challenges() {
  return <ChallengeBanner challenges={await api<Challenge[]>("/challenges")} />;
}
