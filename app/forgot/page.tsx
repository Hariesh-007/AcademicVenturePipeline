import type { Metadata } from "next";
import Link from "next/link";
import { AuthFrame } from "@/app/login/AuthFrame";
import { ForgotForm } from "./ForgotForm";

export const metadata: Metadata = { title: "Reset your password · AVP" };

export default function ForgotPage() {
  return (
    <AuthFrame
      title="Reset your password"
      lede="Enter the email you sign in with. We'll send a link to choose a new password."
      footer={<Link href="/login" className="text-blue hover:underline">Back to sign in</Link>}
    >
      <ForgotForm />
    </AuthFrame>
  );
}
