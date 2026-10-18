"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { send } from "@/lib/client";
import type { Me } from "@/lib/api";

export function Verify() {
  const token = useSearchParams().get("token") ?? "";
  const [error, setError] = useState(token ? "" : "This link is missing its token. Open the link from the email again.");
  const once = useRef(false); // dev StrictMode runs effects twice; the POST should run once

  useEffect(() => {
    if (!token || once.current) return;
    once.current = true;
    send<Me>("/auth/verify", { json: { token } })
      .then((me) => { window.location.href = me.onboarded ? "/app" : "/onboarding"; })
      .catch((e) => setError(e instanceof Error ? e.message : "This link didn't work."));
  }, [token]);

  if (!error) return <p role="status" className="mt-8 text-[15px] text-ink-2">Confirming…</p>;
  return (
    <div role="alert" className="mt-8 flex flex-col gap-4">
      <p className="text-[15px] text-danger">{error}</p>
      <p className="text-[15px] text-ink-2">
        Links expire after 24 hours. <Link href="/login" className="text-blue hover:underline">Sign in</Link> and
        we&apos;ll offer to send a new one.
      </p>
    </div>
  );
}
