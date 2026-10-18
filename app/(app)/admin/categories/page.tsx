import { api } from "@/lib/api";
import type { Category } from "@/lib/types";
import { PageHeader } from "@/app/(app)/ui";
import { Categories } from "./Categories";

export default async function CategoriesPage() {
  const categories = await api<Category[]>("/categories");
  return (
    <>
      <PageHeader
        title="Categories"
        lede="Technologies can sit in several categories. Maintainers pick them at upload, and patent classification codes suggest more. Analysers filter the library by them."
      />
      <Categories categories={categories} />
    </>
  );
}
