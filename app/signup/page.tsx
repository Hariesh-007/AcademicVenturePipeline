import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { AuthFrame } from "@/app/login/AuthFrame";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Create an analyser account · AVP" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  // the invite link's ?ref, or the one proxy.ts remembered when they first landed
  const q = (await searchParams).ref;
  const ref = typeof q === "string" ? q : (await cookies()).get("avp_ref")?.value;
  return (
    <AuthFrame
      title="Become an analyser"
      lede="Read and assess technologies from universities across the network. Your reviews build your public track record."
      footer={<>Already have an account? <Link href="/login" className="text-blue hover:underline">Sign in</Link></>}
    >
      <SignupForm invitedBy={ref?.slice(0, 30)} />
    </AuthFrame>
  );
}
