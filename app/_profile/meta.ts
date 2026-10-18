// Labels for profile enums: one place, shared by onboarding, account and public pages.
import type { OrgType, SocialKey } from "@/lib/types";

export const ORG_TYPES: { value: OrgType; label: string }[] = [
  { value: "industry", label: "Industry" },
  { value: "investor", label: "Investor / VC" },
  { value: "tto", label: "Tech transfer office" },
  { value: "academia", label: "Academia" },
  { value: "government", label: "Government" },
  { value: "independent", label: "Independent" },
];

export const SENIORITY = [
  { value: "student", label: "Student" },
  { value: "early", label: "Early career" },
  { value: "mid", label: "Mid-level" },
  { value: "senior", label: "Senior" },
  { value: "executive", label: "Executive" },
];

export const INTERESTS = [
  { value: "licensing", label: "Licensing" },
  { value: "spinout", label: "Spin-outs" },
  { value: "codevelopment", label: "Co-development" },
  { value: "investment", label: "Investment" },
];

export const SOCIALS: { key: SocialKey; label: string; placeholder: string }[] = [
  { key: "linkedin", label: "LinkedIn", placeholder: "https://www.linkedin.com/in/your-name" },
  { key: "orcid", label: "ORCID", placeholder: "https://orcid.org/0000-0000-0000-0000" },
  { key: "scholar", label: "Google Scholar", placeholder: "https://scholar.google.com/citations?user=…" },
  { key: "website", label: "Website", placeholder: "https://…" },
  { key: "x", label: "X", placeholder: "https://x.com/handle" },
  { key: "github", label: "GitHub", placeholder: "https://github.com/handle" },
];

export const label = (list: { value: string; label: string }[], v: string | null) =>
  list.find((x) => x.value === v)?.label ?? v ?? "";

// ISO 3166-1 alpha-2; names come from Intl so there's no country table to maintain
const CODES = "AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HK HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI KM KN KP KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MO MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PS PT PW PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VN VU WS XK YE ZA ZM ZW".split(" ");
const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
export const countryName = (code: string | null) => (code ? regionNames.of(code) ?? code : "");
export const COUNTRIES = CODES.map((c) => ({ value: c, label: countryName(c) })).sort((a, b) =>
  a.label.localeCompare(b.label),
);
