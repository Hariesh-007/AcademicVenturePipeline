import type { Metadata } from "next";
import { api, getMe } from "@/lib/api";
import type { Category, MyProfile } from "@/lib/types";
import { Onboarding } from "./Onboarding";

export const metadata: Metadata = { title: "Set up your profile · AVP" };

export default async function OnboardingPage() {
  const [me, profile, categories] = await Promise.all([
    getMe(),
    api<MyProfile>("/me/profile"),
    api<Category[]>("/categories"),
  ]);
  return <Onboarding seed={me.id} email={me.email} profile={profile} categories={categories} />;
}
