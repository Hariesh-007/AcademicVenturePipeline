import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthFrame } from "./AuthFrame";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in · AVP" };

export default function LoginPage() {
  return (
    <AuthFrame
      title="Sign in"
      lede={<>New analyser? <Link href="/signup" className="text-blue underline-offset-2 hover:underline">Create an account</Link>.</>}
      footer={<>University staff accounts are set up by your platform admin.</>}
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthFrame>
  );
}
