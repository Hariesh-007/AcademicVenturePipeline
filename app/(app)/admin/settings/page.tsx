import { api } from "@/lib/api";
import { PageHeader } from "@/app/(app)/ui";
import { type AIConfig, AISetting } from "./AISetting";
import { ReadingSetting } from "./ReadingSetting";

export default async function SettingsPage() {
  const [s, ai] = await Promise.all([
    api<{ min_read_seconds: number }>("/admin/settings"),
    api<AIConfig>("/admin/ai"),
  ]);
  return (
    <>
      <PageHeader title="Settings" lede="Rules that shape how analysers work through the library, and which AI reads the documents." />
      <div className="flex flex-col gap-8">
        <ReadingSetting initial={s.min_read_seconds} />
        <AISetting initial={ai} />
      </div>
    </>
  );
}
