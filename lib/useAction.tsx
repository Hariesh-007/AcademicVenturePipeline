"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Runs a mutation, tracks busy/error/done, then re-renders server data. */
export function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function run(fn: () => Promise<unknown>, success = "") {
    setBusy(true);
    setError("");
    setDone("");
    try {
      await fn();
      setDone(success);
      router.refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { run, busy, error, done };
}

export function Feedback({ error, done }: { error: string; done?: string }) {
  if (error) return <p role="alert" className="text-[14px] text-danger">{error}</p>;
  return <p role="status" className="text-[14px] text-ok">{done}</p>;
}
