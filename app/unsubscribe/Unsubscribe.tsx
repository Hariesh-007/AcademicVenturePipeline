"use client";

// The link only switches the digest off; it never signs anyone in. A button (not an
// automatic request on load) so link scanners in mail clients can't unsubscribe people.
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { send } from "@/lib/client";

export function Unsubscribe() {
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState("");
  async function go() {
    setState("busy");
    try {
      await send("/digest/unsubscribe", { json: { token } });
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "That link didn't work");
      setState("error");
    }
  }
  if (state === "done") {
    return (
      <p role="status" className="mt-8 text-[15px] text-ink-2">
        You won&apos;t get the weekly digest any more. Turn it back on any time from your{" "}
        <Link href="/account" className="text-blue hover:underline">profile</Link>.
      </p>
    );
  }
  return (
    <div className="mt-8 flex flex-col gap-4">
      <button className="btn btn-primary w-fit" disabled={!token || state === "busy"} onClick={go}>
        {state === "busy" ? "Unsubscribing…" : "Unsubscribe from the digest"}
      </button>
      {(state === "error" || !token) && (
        <p role="alert" className="text-[14px] text-danger">
          {token ? error : "This link is missing its token."} You can also switch it off on your{" "}
          <Link href="/account" className="text-blue hover:underline">profile</Link>.
        </p>
      )}
    </div>
  );
}
