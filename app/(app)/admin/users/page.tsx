import { api, getMe } from "@/lib/api";
import type { Institution, User } from "@/lib/types";
import { PAGE, PageHeader, Pager, pageOf } from "@/app/(app)/ui";
import { Users } from "./Users";

export default async function UsersPage({ searchParams }: PageProps<"/admin/users">) {
  const { offset, query } = pageOf(await searchParams);
  const [users, institutions, me] = await Promise.all([
    api<User[]>(`/users?${query}`),
    api<Institution[]>("/institutions"),
    getMe(),
  ]);
  return (
    <>
      <PageHeader
        title="Users"
        lede="Maintainers upload for one university: create their accounts here and share the initial password directly. Analysers sign themselves up and confirm their email; you can deactivate one, or make them a senior reviewer: they close review rounds and approve dossiers for technologies they're independent of."
      />
      <Users users={users.slice(0, PAGE)} institutions={institutions} meId={me.id} />
      <Pager path="/admin/users" offset={offset} count={users.length} />
    </>
  );
}
