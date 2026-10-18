import { api } from "@/lib/api";
import type { Institution, User } from "@/lib/types";
import { PageHeader } from "@/app/(app)/ui";
import { Universities } from "./Universities";

export default async function UniversitiesPage() {
  const [institutions, users] = await Promise.all([
    api<Institution[]>("/institutions"),
    api<User[]>("/users"),
  ]);
  const maintainers: Record<string, number> = {};
  for (const u of users) if (u.institution_id) maintainers[u.institution_id] = (maintainers[u.institution_id] ?? 0) + 1;
  return (
    <>
      <PageHeader
        title="Universities"
        lede="Institutions that contribute technologies. Add one, then create a maintainer account for it under Users."
      />
      <Universities institutions={institutions} maintainers={maintainers} />
    </>
  );
}
