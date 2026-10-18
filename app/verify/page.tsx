import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFrame } from "@/app/login/AuthFrame";
import { Verify } from "./Verify";

export const metadata: Metadata = { title: "Confirm your email · AVP" };

export default function VerifyPage() {
  return (
    <AuthFrame title="Confirming your email" lede="One moment while we check your link.">
      <Suspense>
        <Verify />
      </Suspense>
    </AuthFrame>
  );
}
