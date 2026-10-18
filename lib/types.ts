// Shapes returned by the backend (hand-written; `pnpm gen:api` can replace these later).
import type { Tier } from "./api";

export type Category = { id: string; name: string };
export type Institution = { id: string; name: string; public_previews: boolean };

export type Technology = {
  id: string;
  title: string;
  summary: string;
  institution_id: string;
  originating_department: string | null;
  originating_lab: string | null;
  stage: string;
  created_at: string;
  categories: Category[];
  public_preview_hidden: boolean;
  // institution-provided context (spec 13.8)
  institutional_reference: string | null;
  institutional_ownership_context: string | null;
  licensing_status: string | null;
  permission_status: string | null;
};

export type DocumentRow = {
  id: string;
  patent_id: string | null;
  original_filename: string;
  processing_status: string;
  document_type: string | null;
  page_count: number | null;
  file_size_bytes: number;
  created_at: string;
};

export type EligibilityDecision = {
  status: "ELIGIBLE" | "INELIGIBLE" | "REQUIRES_CLARIFICATION";
  permission_status: string;
  confirmed_by: string;
  confirmed_at: string;
  reasons: string;
};

export type TechnologyRecord = {
  technology: Technology;
  eligibility: EligibilityDecision | null;
  patents: Record<string, unknown>[];
  documents: DocumentRow[];
  suggested_categories: Category[];
};

export type Candidate = { value: unknown; sources: string[]; observation_ids: string[]; confidence?: number };

export type FieldState = {
  patent_id: string | null;
  field_name: string;
  critical: boolean;
  current_value: unknown;
  verification_status: string;
  candidate_values: Candidate[];
  source_evidence: { observation_id: string; page_number: number | null; document_id: string | null }[];
  validation_errors: string[];
};

export type ReviewState = { fields: FieldState[]; blocking: string[]; warnings?: string[] };

export type User = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "analyst" | "maintainer";
  institution_id: string | null;
  is_active: boolean;
  is_senior_reviewer: boolean;
  suggest_senior: boolean; // Fellow-tier analyst, not yet a senior reviewer
  reputation: number;
  created_at: string;
};

export type TechnologyRow = Technology & { document_statuses: string[] };

export type LibraryRow = {
  id: string;
  title: string;
  summary: string;
  abstract: string | null;
  institution_id: string;
  institution_name: string;
  categories: string[];
  created_at: string;
  score: number;
  ups: number;
  downs: number;
  my_vote: number;
  review_count: number;
  reviewed_by_me: boolean;
  verified: boolean;
  read_ok: boolean;
};

/** score (net) is only for sorting; the UI shows ups and downs separately. */
export type VoteState = {
  score: number; ups: number; downs: number; my_vote: number;
  read_ok: boolean; read_seconds?: number; min_read_seconds?: number;
};

export type AnalystReview = {
  id: string;
  user_id: string;
  reviewer_name: string;
  reviewer_handle: string | null;
  reviewer_tier: Tier | null;
  helpful_count: number;
  marked_helpful: boolean;
  verdict: "promising" | "needs_work" | "not_viable" | null;
  novelty: number | null;
  productisation: number | null;
  feasibility: number | null;
  market: number | null;
  trl: number | null;
  body: string;
  submitted_at: string | null;
  updated_at: string;
};

export type Reviews = {
  mine: AnalystReview | null;
  unlocked: boolean;
  submitted_count: number;
  others: AnalystReview[];
  averages: Record<string, number | null>;
  verdicts: Record<string, number>;
};

/** Formal stage-6 reviewer report (one aspect). submitted_at null = the author's draft. */
export type Report = {
  id: string;
  technology_id: string;
  reviewer_id: string;
  aspect: string;
  trl: number | null;
  conclusion: string;
  rationale: string;
  confidence: "low" | "medium" | "high";
  gaps: string[];
  body: Record<string, unknown>;
  evidence_ids: string[];
  supersedes_id: string | null;
  submitted_at: string | null;
  created_at: string;
};

export type Page = { page: number; text: string; method: string };

export type EvidenceKind = "claim" | "result" | "metric" | "method" | "ip_scope" | "regulatory" | "market" | "other";
export type Evidence = {
  id: string;
  technology_id: string;
  document_id: string | null;
  source_url: string | null;
  page: number | null;
  span_start: number | null;
  span_end: number | null;
  quote: string;
  kind: EvidenceKind;
  added_by: string; // "system:evidence" or a user id
  retracted: boolean;
  created_at: string;
};
export type EvidenceStatus = {
  document_id: string;
  filename: string;
  status: "QUEUED" | "RUNNING" | "RETRYING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | null; // CANCELLED = skipped (confidential, no private AI)
  error: { code: string; message: string } | null;
  items: number;
};

export type OrgType = "industry" | "investor" | "tto" | "academia" | "government" | "independent";
export type SocialKey = "linkedin" | "orcid" | "scholar" | "website" | "x" | "github";

export type PublicProfile = {
  id: string;
  handle: string;
  name: string;
  avatar_url: string | null;
  headline: string;
  organisation: string;
  org_type: OrgType | null;
  job_title: string;
  seniority: string | null;
  years_experience: number | null;
  country: string | null;
  bio: string;
  interests: string[];
  categories: Category[];
  socials: Partial<Record<SocialKey, string>>;
  member_since: string;
  reviews_submitted: number;
  credibility: PublicCredibility | null;
};

export type MyProfile = Omit<PublicProfile, "handle"> & {
  handle: string | null;
  all_socials: Partial<Record<SocialKey, { url: string; visible: boolean }>>;
  missing: string[];
  strength: number;
  onboarded: boolean;
};

export type Badge = { badge: string; label: string; description: string; awarded_at: string };

export type PublicCredibility = {
  reputation: number;
  tier: Tier;
  badges: Badge[];
  streak_weeks: number;
  activity: Record<string, number>; // ISO date -> actions
};

export type Credibility = PublicCredibility & {
  next_tier: Tier | null;
  to_next: number | null;
  next_unlocks: string | null;
};

export type BandName = "top10" | "top25" | "top50" | "building";
export type Band = { band: BandName; value: number | null; population: number };
export type Rewards = {
  credibility: Credibility;
  standing: Band;
  cohorts: { category: string; band: Band }[];
  skills: { key: string; label: string; band: Band; detail: string }[];
  tips: string[];
  badges: { badge: string; label: string; description: string; earned: boolean; progress: number | null; target: number | null }[];
  rules: {
    points: Record<string, number>;
    mark_weight: Record<Tier, number>;
    pair_cap: { marks: number; days: number };
    tiers: Record<Tier, number>;
    unlocks: Record<string, string>;
    min_population: number;
  };
};

export type CommentAuthor = { id: string; name: string; handle: string | null; avatar_url: string | null; tier: Tier | null };
export type Comment = {
  id: string;
  parent_id: string | null;
  body: string;
  deleted: boolean;
  author: CommentAuthor;
  created_at: string;
  edited_at: string | null;
  mine: boolean;
  replies: Comment[];
  mentions: { handle: string; name: string }[]; // resolved @handles: rendered as profile links
};
export type Notification = {
  id: string;
  kind: "reply" | "mention" | "tier_up" | "badge" | "challenge" | "feedback" | "senior_queue" | "returned" | "ai_stuck";
  created_at: string;
  read: boolean;
  actor_name: string | null;
  technology_id: string | null;
  technology_title: string | null;
  comment_id: string | null;
  detail: string;
};
export type FollowTarget = "category" | "technology" | "analyst";
export type Follows = Record<"categories" | "technologies" | "analysts", { id: string; name: string; handle: string | null }[]>;
export type Challenge = {
  id: string;
  title: string;
  description: string;
  category_id: string;
  category_name: string;
  goal: number;
  starts_at: string;
  ends_at: string;
  status: "proposed" | "published" | "rejected";
  proposed_by_name: string | null;
  progress: number;
  my_count: number;
  percent: number;
};

export type FeedbackKind = "bug" | "feature" | "content" | "product" | "other";
export type FeedbackStatus = "new" | "in_progress" | "resolved" | "wont_fix";
export type FeedbackItem = {
  id: string;
  kind: FeedbackKind;
  subject: string;
  body: string;
  page_url: string;
  status: FeedbackStatus;
  created_at: string;
  updated_at: string;
  reply: string | null;
  replied_at: string | null;
  author_name: string;
  author_role: string;
};

export type PublicTechnology = {
  id: string;
  title: string;
  institution_name: string;
  categories: string[];
  ups: number;
  review_count: number;
  shared_by: { name: string; handle: string; tier: Tier } | null;
};

export type TriageFlag = { kind: string; message: string; evidence_ids?: string[] };
export type TriageResult = {
  id: string;
  technology_id: string;
  model: string;
  prompt_version: string;
  screening_score: number | null; // null: no component had evidence
  score_breakdown: Record<string, { score: number; rationale: string; evidence_ids: string[] }>;
  categories: string[];
  synopsis: string;
  flags: TriageFlag[];
  evidence_ids: string[];
  created_at: string;
};
export type TriageState = {
  result: TriageResult | null;
  last_event: { action: "TRIAGE_QUEUED" | "TRIAGE_DONE" | "TRIAGE_FAILED" | "TRIAGE_SKIPPED"; at: string; message: string | null } | null;
};

// --- stages 7-11: dossier, conflicts, senior review, routing ---------------------------------
export type DossierClaim = {
  id: string; section: string; text: string; source_report_id: string | null; evidence_ids: string[]; unsupported: boolean;
};
export type Dossier = {
  id: string; technology_id: string; version: number; status: "draft" | "approved" | "superseded";
  content: { sections?: Record<string, string>; model?: string };
  draft_trl: number | null; final_trl: number | null; trl_rationale: string;
  created_by: string; parent_id: string | null; approved_by: string | null; approved_at: string | null;
  created_at: string; claims: DossierClaim[];
};
export type Conflict = {
  id: string; aspect: string; report_ids: string[]; description: string;
  resolution: string | null; resolved_by: string | null; created_at: string;
};
export type SeniorDecision = {
  id: string; dossier_version_id: string; reviewer_id: string; action: "approve" | "edit" | "return";
  notes: string; final_trl: number | null; created_at: string;
};
export type CompileState = {
  last_event: { action: "COMPILE_QUEUED" | "COMPILE_DONE" | "COMPILE_FAILED" | "COMPILE_SKIPPED" | "COMPILE_MANUAL"; at: string; message: string | null } | null;
};
export type SeniorQueueRow = {
  id: string; title: string; institution_name: string; draft_trl: number | null; open_conflicts: number; waiting_since: string | null;
};
export type RouteKind = "shelve" | "further_research" | "incubation" | "industry_collaboration" | "external_appraisal";
export type RouteDecision = {
  id: string; technology_id: string; dossier_version_id: string; decided_by: string; route: RouteKind;
  rationale: string; external_party: string | null; created_at: string;
};
