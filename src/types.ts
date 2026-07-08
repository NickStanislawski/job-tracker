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

export interface AppData {
  companies: Company[];
  recruiters: Recruiter[];
  applications: Application[];
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
