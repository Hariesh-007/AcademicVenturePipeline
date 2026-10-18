// Institution-provided choices (spec 13.8). Must match backend intake/rules.py LICENSING / PERMISSION.

export const LICENSING = [
  { value: "unlicensed", label: "Not licensed" },
  { value: "under_option", label: "Under option" },
  { value: "licensed_exclusive", label: "Licensed, exclusive" },
  { value: "licensed_non_exclusive", label: "Licensed, non-exclusive" },
  { value: "unknown", label: "Not known" },
] as const;

export const PERMISSION = [
  { value: "GRANTED", label: "Granted" },
  { value: "PENDING", label: "Pending" },
  { value: "DENIED", label: "Denied" },
] as const;

export const choiceLabel = (list: readonly { value: string; label: string }[], v: string | null) =>
  list.find((x) => x.value === v)?.label ?? v ?? "Not set";
