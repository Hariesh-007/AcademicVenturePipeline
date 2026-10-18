import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFrame } from "@/app/login/AuthFrame";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = { title: "Choose a new password · AVP" };

export default function ResetPage() {
  return (
    <AuthFrame title="Choose a new password" lede="Pick something you don&apos;t use anywhere else. This link works once.">
      <Suspense>
        <ResetForm />
      </Suspense>
    </AuthFrame>
  );
}
