/* ---------------------------------------------------------------------
   DOMAIN TYPES
--------------------------------------------------------------------- */

export type StageKey =
  | "Not Applied"
  | "Applied"
  | "Recruiter Screen"
  | "Interview"
  | "Offer"
  | "Rejected"
  | "Withdrawn";

export type Priority = "High" | "Medium" | "Low";

export type TaskKind = "followup" | "thankyou";

export interface Stage {
  key: StageKey;
  color: string;
  short: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  notes: string;
}

export interface Recruiter {
  id: string;
  name: string;
  email: string;
  agency: string;
  relationship: string;
  notes: string;
}

export interface Application {
  id: string;
  companyId: string;
  recruiterId: string;
  role: string;
  source: string;
  appliedDate: string;
  lastContactDate: string;
  status: StageKey;
  nextAction: string;
  nextFollowUpDate: string;
  thankYouDueDate: string;
  salaryRange: string;
  priority: Priority;
  jobUrl: string;
  notes: string;
}

/* ---------------------------------------------------------------------
   OPS TRACKER TYPES — daily non-negotiables + weekly deliverables.
   Stored inside the same per-user JSON blob as everything else, keyed
   by date (days) and by the Monday of each week (weeks), so it rides
   along with the existing Supabase sync/realtime plumbing for free.
--------------------------------------------------------------------- */
export interface DailyOpsRecord {
  projectWork: boolean;
  documented: boolean;
  commit: boolean;
  applications: number;
  messages: number;
  comments: number;
  connections: number;
  // Commute review, split by focus — done passively during commute.
  commuteTechnical: boolean;
  commuteNetworking: boolean;
}

export interface WeeklyOpsRecord {
  milestone: boolean;
  linkedinPost: number;
}

export interface OpsData {
  // keyed by YYYY-MM-DD (local date)
  days: Record<string, DailyOpsRecord>;
  // keyed by the YYYY-MM-DD of that week's Monday
  weeks: Record<string, WeeklyOpsRecord>;
}

export interface AppData {
  companies: Company[];
  recruiters: Recruiter[];
  applications: Application[];
  // Optional so existing saved rows (from before this feature existed)
  // still satisfy the type — OpsTracker falls back to empty records.
  ops?: OpsData;
}

// Drafts are used while a record is being created/edited in a form —
// they have no id yet (id is null) until saved for the first time.
export type CompanyDraft = Omit<Company, "id"> & { id: string | null };
export type RecruiterDraft = Omit<Recruiter, "id"> & { id: string | null };
export type ApplicationDraft = Omit<Application, "id"> & { id: string | null };

export type NewCompanyFields = Omit<Company, "id">;
export type NewRecruiterFields = Omit<Recruiter, "id">;

export interface TaskItem {
  app: Application;
  kind: TaskKind;
  date: string;
  label?: string;
}

export type SetData = React.Dispatch<React.SetStateAction<AppData | null>>;

export type FormChangeEvent = React.ChangeEvent<
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
>;