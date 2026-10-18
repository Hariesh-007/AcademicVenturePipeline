import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFrame } from "@/app/login/AuthFrame";
import { Unsubscribe } from "./Unsubscribe";

export const metadata: Metadata = { title: "Unsubscribe · AVP" };

export default function UnsubscribePage() {
  return (
    <AuthFrame title="Weekly digest" lede="Stop the Monday email with one click.">
      <Suspense>
        <Unsubscribe />
      </Suspense>
    </AuthFrame>
  );
}
