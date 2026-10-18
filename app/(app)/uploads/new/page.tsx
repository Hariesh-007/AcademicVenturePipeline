import { api, getMe } from "@/lib/api";
import type { Category, Institution } from "@/lib/types";
import { PageHeader } from "@/app/(app)/ui";
import { UploadForm } from "./UploadForm";

export default async function NewUploadPage() {
  const me = await getMe();
  const [categories, institutions] = await Promise.all([
    api<Category[]>("/categories"),
    me.role === "admin" ? api<Institution[]>("/institutions") : Promise.resolve(null),
  ]);
  return (
    <>
      <PageHeader
        title="New upload"
        lede="One technology per upload. Attach its patent PDF (and any supporting PDFs); text is extracted automatically."
      />
      <UploadForm categories={categories} institutions={institutions} />
    </>
  );
}
