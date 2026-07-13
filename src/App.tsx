import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, X, Search, Building2, User, Briefcase, Calendar, Trash2, Pencil,
  ChevronRight, LayoutDashboard, ListChecks, Users2, AlertCircle, Sparkles,
  CheckCircle2, ClipboardEdit, Mail, Inbox, LogOut, Menu,
} from "lucide-react";
import type {
  Stage, StageKey, Priority, TaskKind, TaskItem,
  Company, Recruiter, Application, AppData,
  CompanyDraft, RecruiterDraft, ApplicationDraft,
  NewCompanyFields, NewRecruiterFields,
  SetData, FormChangeEvent,
} from "./types";
import { useCloudData } from "./useCloudData";
import { useAuthUser, LoginScreen, signOutUser } from "./AuthGate";
import { CSS } from "./styles";

/* ---------------------------------------------------------------------
   PIPELINE STAGES — order carries meaning: left-to-right is the funnel.
--------------------------------------------------------------------- */
const STAGES: Stage[] = [
  { key: "Not Applied",      color: "#9CA79E", short: "Draft" },
  { key: "Applied",          color: "#4C7A8C", short: "Applied" },
  { key: "Recruiter Screen", color: "#D9A441", short: "Screen" },
  { key: "Interview",        color: "#C1584A", short: "Interview" },
  { key: "Offer",            color: "#3F7D53", short: "Offer" },
  { key: "Rejected",         color: "#8A8378", short: "Rejected" },
  { key: "Withdrawn",        color: "#B0A99A", short: "Withdrawn" },
];
const OPEN_STAGES: StageKey[] = ["Not Applied", "Applied", "Recruiter Screen", "Interview"];
const stageColor = (s: StageKey): string => (STAGES.find((x) => x.key === s) || STAGES[0]).color;

// How many days out a follow-up typically makes sense once a stage is entered.
// Used only to *suggest* a next follow-up date — never overrides a date already set.
const FOLLOWUP_CADENCE_DAYS: Record<StageKey, number | null> = {
  "Not Applied": 5,
  "Applied": 10,
  "Recruiter Screen": 4,
  "Interview": 5,
  "Offer": 2,
  "Rejected": null,
  "Withdrawn": null,
};

const PRIORITIES: Priority[] = ["High", "Medium", "Low"];
const priorityColor: Record<Priority, string> = { High: "#C1584A", Medium: "#D9A441", Low: "#9CA79E" };

// Where a task "graduates" to once you complete it. Rejected/Withdrawn are
// dead ends on purpose — nothing auto-advances out of them.
const NEXT_STAGE: Record<StageKey, StageKey> = {
  "Not Applied": "Applied",
  "Applied": "Recruiter Screen",
  "Recruiter Screen": "Interview",
  "Interview": "Offer",
  "Offer": "Offer",
  "Rejected": "Rejected",
  "Withdrawn": "Withdrawn",
};
const DEFAULT_NEXT_ACTION: Partial<Record<StageKey, string>> = {
  "Applied": "Wait for recruiter response",
  "Recruiter Screen": "Prep for recruiter screen call",
  "Interview": "Prep for interview",
  "Offer": "Review offer details and respond",
};

// The check-in action once a live conversation has already happened —
// distinct from the "prep for X" action used when a stage is first entered.
const FOLLOWUP_CHECKIN_ACTION: Partial<Record<StageKey, string>> = {
  "Applied": "Wait for recruiter response",
  "Recruiter Screen": "Follow up if you haven't heard back",
  "Interview": "Follow up if you haven't heard back",
  "Offer": "Follow up on your offer decision",
};

// Stages where a real conversation just happened — these get a fast,
// separate thank-you-note task in addition to the longer check-in.
const THANK_YOU_STAGES: StageKey[] = ["Recruiter Screen", "Interview"];

// "Applied" is the one stage where the right cadence depends on context:
// a known contact means a fast introduction note; a cold application means
// waiting out the usual review window before checking in.
function getCadenceDays(status: StageKey, hasRecruiter: boolean): number | null {
  if (status === "Applied") return hasRecruiter ? 2 : FOLLOWUP_CADENCE_DAYS["Applied"];
  return FOLLOWUP_CADENCE_DAYS[status];
}
function getDefaultNextAction(status: StageKey, hasRecruiter: boolean): string {
  if (status === "Applied") return hasRecruiter ? "Introduce yourself to your recruiter contact" : DEFAULT_NEXT_ACTION["Applied"]!;
  return DEFAULT_NEXT_ACTION[status] || "";
}
function getCheckinAction(status: StageKey): string {
  return FOLLOWUP_CHECKIN_ACTION[status] || "";
}

// Preset choices offered in the "Next action" selector, keyed by the stage
// that just concluded. Kept short and stage-appropriate; "Write my own…"
// and "No follow-up needed" are added on top of these in the UI.
function getActionPresets(status: StageKey, hasRecruiter: boolean): string[] {
  switch (status) {
    case "Applied":
      return hasRecruiter
        ? ["Introduce yourself to your recruiter contact", "Wait for recruiter response"]
        : ["Wait for recruiter response"];
    case "Recruiter Screen":
      return ["Send thank-you note", "Follow up if you haven't heard back", "Prep for recruiter screen call"];
    case "Interview":
      return ["Send thank-you note", "Follow up if you haven't heard back", "Prep for interview", "Send additional materials"];
    case "Offer":
      return ["Review offer details and respond", "Negotiate offer terms", "Follow up on your offer decision"];
    default:
      return [];
  }
}

// Recruiter screens and interviews get a two-touch chain: a fast thank-you
// note, then an automatically-queued check-in if it's gone quiet.

const uid = (): string => Math.random().toString(36).slice(2, 10);
const todayISO = (): string => new Date().toISOString().slice(0, 10);
const addDaysISO = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const fmtDate = (d: string | null | undefined): string => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};
const daysUntil = (d: string | null | undefined): number => {
  if (!d) return Number.POSITIVE_INFINITY;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const dt = new Date(d); dt.setHours(0, 0, 0, 0);
  return Math.round((dt.getTime() - now.getTime()) / 86400000);
};

/* ---------------------------------------------------------------------
   SEED DATA — mirrors the uploaded tracker so the app opens populated.
--------------------------------------------------------------------- */
const seedCompanies = (): Company[] => [
];
const seedRecruiters = (): Recruiter[] => [
];
const seedApplications = (): Application[] => [
];

const makeSeedData = (): AppData => ({
  companies: seedCompanies(),
  recruiters: seedRecruiters(),
  applications: seedApplications(),
});

/* ---------------------------------------------------------------------
   SMALL UI PRIMITIVES
--------------------------------------------------------------------- */
function StagePill({ stage }: { stage: StageKey }) {
  return (
    <span className="jst-pill" style={{ "--pill-color": stageColor(stage) } as React.CSSProperties}>
      <span className="jst-pill-dot" />{stage}
    </span>
  );
}
function PriorityDot({ priority }: { priority: Priority | "" | null | undefined }) {
  if (!priority) return null;
  return <span className="jst-prio" title={`${priority} priority`} style={{ background: priorityColor[priority] }} />;
}
function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={"jst-field" + (full ? " jst-field-full" : "")}>
      <span className="jst-field-label">{label}</span>
      {children}
    </label>
  );
}
function Modal({
  title, onClose, children, onDelete,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  onDelete?: (() => void) | null;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="jst-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="jst-modal" role="dialog" aria-modal="true">
        <div className="jst-modal-head">
          <h3>{title}</h3>
          <button className="jst-icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="jst-modal-body">{children}</div>
        {onDelete && (
          <div className="jst-modal-foot">
            <button className="jst-danger-link" onClick={onDelete}><Trash2 size={14} /> Delete permanently</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   PIPELINE RAIL — signature dashboard element
--------------------------------------------------------------------- */
function PipelineRail({
  applications, onStationClick,
}: {
  applications: Application[];
  onStationClick: (stage: StageKey) => void;
}) {
  const counts = STAGES.map((s) => applications.filter((a) => a.status === s.key).length);
  const max = Math.max(1, ...counts);
  return (
    <div className="jst-rail-wrap">
      <div className="jst-rail">
        {STAGES.map((s, i) => (
          <button key={s.key} className="jst-station" onClick={() => onStationClick(s.key)}>
            <div className="jst-station-stem" style={{ height: 8 + (counts[i] / max) * 40, "--mag": counts[i] / max } as React.CSSProperties}>
              <div className="jst-station-fill" style={{ background: s.color }} />
            </div>
            <div className="jst-station-dot" style={{ borderColor: s.color, background: counts[i] ? s.color : "#fff" }} />
            <div className="jst-station-count" style={{ color: s.color }}>{counts[i]}</div>
            <div className="jst-station-label">{s.short}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   APP PICKER — used to start a new follow-up from Dashboard or Tasks
   without having to go find the application first.
--------------------------------------------------------------------- */
function AppPickerModal({
  applications, companies, onPick, onCancel,
}: {
  applications: Application[];
  companies: Company[];
  onPick: (a: Application) => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState("");
  const companyName = (id: string): string => companies.find((c) => c.id === id)?.name || "Unlinked company";
  const filtered = applications.filter((a) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return a.role.toLowerCase().includes(q) || companyName(a.companyId).toLowerCase().includes(q);
  });
  return (
    <Modal title="Schedule a follow-up" onClose={onCancel}>
      <div className="jst-search jst-picker-search">
        <Search size={16} />
        <input autoFocus placeholder="Search your applications…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {applications.length === 0 ? (
        <p className="jst-empty-note">No applications yet. Add one from the Applications tab first.</p>
      ) : filtered.length === 0 ? (
        <p className="jst-empty-note">No applications match.</p>
      ) : (
        <div className="jst-picker-list">
          {filtered.map((a) => (
            <button key={a.id} className="jst-picker-item" onClick={() => onPick(a)}>
              <span className="jst-picker-text">
                <span className="jst-picker-role">{a.role}</span>
                <span className="jst-picker-company">{companyName(a.companyId)}</span>
              </span>
              <StagePill stage={a.status} />
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}

/* ---------------------------------------------------------------------
   DASHBOARD
--------------------------------------------------------------------- */
function Dashboard({
  applications, companies, recruiters, setData, goToApplications, goToTasks,
}: {
  applications: Application[];
  companies: Company[];
  recruiters: Recruiter[];
  setData: SetData;
  goToApplications: (stage?: StageKey | "", urgency?: string) => void;
  goToTasks: () => void;
}) {
  const [completing, setCompleting] = useState<Application | null>(null);
  const [editing, setEditing] = useState<ApplicationDraft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const companyName = (id: string): string => companies.find((c) => c.id === id)?.name || "—";

  const save = (form: ApplicationDraft) => {
    setData((d) => {
      if (!d) return d;
      const exists = d.applications.some((a) => a.id === form.id);
      const apps = exists
        ? d.applications.map((a) => (a.id === form.id ? (form as Application) : a))
        : [...d.applications, { ...form, id: uid() } as Application];
      return { ...d, applications: apps };
    });
    setEditing(null);
  };
  const remove = (id: string) => {
    setData((d) => d && ({ ...d, applications: d.applications.filter((a) => a.id !== id) }));
    setEditing(null);
    setConfirmDelete(null);
  };
  const createCompany = (fields: NewCompanyFields): string => {
    const id = uid();
    setData((d) => d && ({ ...d, companies: [...d.companies, { ...fields, id }] }));
    return id;
  };
  const createRecruiter = (fields: NewRecruiterFields): string => {
    const id = uid();
    setData((d) => d && ({ ...d, recruiters: [...d.recruiters, { ...fields, id }] }));
    return id;
  };

  const total = applications.length;
  const active = applications.filter((a) => OPEN_STAGES.includes(a.status)).length;
  const offers = applications.filter((a) => a.status === "Offer").length;
  const appliedCount = applications.filter((a) => a.status !== "Not Applied").length;
  const advanced = applications.filter((a) => ["Recruiter Screen", "Interview", "Offer"].includes(a.status)).length;
  const responseRate = appliedCount ? Math.round((advanced / appliedCount) * 100) : 0;

  const withFollowUp: TaskItem[] = applications.filter((a) => a.nextFollowUpDate).map((a) => ({ app: a, date: a.nextFollowUpDate, kind: "followup" }));
  const withThankYou: TaskItem[] = applications.filter((a) => a.thankYouDueDate).map((a) => ({ app: a, date: a.thankYouDueDate, kind: "thankyou" }));
  const allTasks: TaskItem[] = [...withFollowUp, ...withThankYou];
  const overdue = allTasks.filter((t) => daysUntil(t.date) < 0);
  const dueSoon = allTasks.filter((t) => { const d = daysUntil(t.date); return d >= 0 && d <= 7; });

  const upcoming = [...allTasks]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 6);

  return (
    <div className="jst-view">
      <div className="jst-hero">
        <div className="jst-hero-text">
          <span className="jst-eyebrow">The line, station by station</span>
          <h2>Where every application stands right now</h2>
        </div>
        <PipelineRail applications={applications} onStationClick={(stage) => goToApplications(stage)} />
      </div>

      <div className="jst-grid-3">
        <div className="jst-card jst-card-alert" onClick={goToTasks}>
          <span className="jst-metric-num" style={{ color: overdue.length ? "#C1584A" : "var(--ink)" }}>{overdue.length}</span>
          <span className="jst-metric-label">Overdue follow-ups</span>
        </div>
        <div className="jst-card jst-card-alert" onClick={goToTasks}>
          <span className="jst-metric-num" style={{ color: "#D9A441" }}>{dueSoon.length}</span>
          <span className="jst-metric-label">Due within 7 days</span>
        </div>
        <div className="jst-card jst-card-alert">
          <span className="jst-metric-num">{responseRate}%</span>
          <span className="jst-metric-label">Applications that advanced</span>
        </div>
      </div>

      <div className="jst-grid-2">
        <div className="jst-card">
          <h4 className="jst-card-title">Key metrics</h4>
          <div className="jst-metrics">
            <div className="jst-metric"><span className="jst-metric-num">{total}</span><span className="jst-metric-label">Total roles tracked</span></div>
            <div className="jst-metric"><span className="jst-metric-num">{active}</span><span className="jst-metric-label">Active in pipeline</span></div>
            <div className="jst-metric"><span className="jst-metric-num">{offers}</span><span className="jst-metric-label">Offers on the table</span></div>
            <div className="jst-metric"><span className="jst-metric-num">{companies.length}</span><span className="jst-metric-label">Companies in play</span></div>
          </div>
        </div>

        <div className="jst-card">
          <div className="jst-card-title-row">
            <h4 className="jst-card-title">Upcoming follow-ups</h4>
            <button className="jst-btn-ghost jst-btn-sm" onClick={() => setPicking(true)}><Plus size={14} /> New follow-up</button>
          </div>
          {upcoming.length === 0 ? (
            <p className="jst-empty-note">Nothing scheduled. Add a next follow-up date on an application to see it here.</p>
          ) : (
            <ul className="jst-followup-list">
              {upcoming.map((t) => {
                const a = t.app;
                const d = daysUntil(t.date);
                const isOverdue = d < 0;
                const isThankYou = t.kind === "thankyou";
                return (
                  <li key={a.id + t.kind} className="jst-followup-item" onClick={() => setCompleting(a)}>
                    <div className={"jst-followup-flag" + (isOverdue ? " jst-overdue" : "")}>
                      {isOverdue ? <AlertCircle size={14} /> : isThankYou ? <Mail size={14} /> : <Calendar size={14} />}
                    </div>
                    <div className="jst-followup-main">
                      <span className="jst-followup-role">{isThankYou ? "Send thank-you note" : a.role}</span>
                      <span className="jst-followup-company">{isThankYou ? a.role + " · " + companyName(a.companyId) : companyName(a.companyId)}</span>
                    </div>
                    <div className={"jst-followup-date" + (isOverdue ? " jst-overdue-text" : "")}>
                      {isOverdue ? `${Math.abs(d)}d overdue` : d === 0 ? "Today" : `in ${d}d`}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {picking && (
        <AppPickerModal
          applications={applications}
          companies={companies}
          onPick={(a) => { setPicking(false); setCompleting(a); }}
          onCancel={() => setPicking(false)}
        />
      )}

      {completing && (
        <FollowUpTaskModal
          app={completing}
          companyName={companyName(completing.companyId)}
          onComplete={(updated) => { save(updated); setCompleting(null); }}
          onCancel={() => setCompleting(null)}
          onEditFull={() => { setEditing(completing); setCompleting(null); }}
        />
      )}

      {editing && (
        <ApplicationForm
          initial={editing}
          companies={companies}
          recruiters={recruiters}
          onSave={save}
          onCancel={() => setEditing(null)}
          onDelete={editing.id ? () => setConfirmDelete(editing.id as string) : null}
          onCreateCompany={createCompany}
          onCreateRecruiter={createRecruiter}
        />
      )}

      {confirmDelete && (
        <Modal title="Delete this application?" onClose={() => setConfirmDelete(null)}>
          <p className="jst-confirm-text">This removes it permanently. This can't be undone.</p>
          <div className="jst-form-actions">
            <button className="jst-btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button className="jst-btn-danger" onClick={() => remove(confirmDelete)}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   INLINE QUICK-CREATE — used inside the application modal
--------------------------------------------------------------------- */
function QuickCreateCompany({
  onCreate, onCancel,
}: {
  onCreate: (fields: NewCompanyFields) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  return (
    <div className="jst-quickcreate">
      <input autoFocus placeholder="Company name" value={name} onChange={(e) => setName(e.target.value)} />
      <input placeholder="Industry (optional)" value={industry} onChange={(e) => setIndustry(e.target.value)} />
      <div className="jst-quickcreate-actions">
        <button type="button" className="jst-btn-ghost jst-btn-sm" onClick={onCancel}>Cancel</button>
        <button
          type="button"
          className="jst-btn-primary jst-btn-sm"
          disabled={!name.trim()}
          onClick={() => name.trim() && onCreate({ name: name.trim(), industry: industry.trim(), notes: "" })}
        >
          Add company
        </button>
      </div>
    </div>
  );
}
function QuickCreateRecruiter({
  onCreate, onCancel,
}: {
  onCreate: (fields: NewRecruiterFields) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [agency, setAgency] = useState("");
  const [email, setEmail] = useState("");
  return (
    <div className="jst-quickcreate">
      <input autoFocus placeholder="Recruiter name" value={name} onChange={(e) => setName(e.target.value)} />
      <input placeholder="Agency / employer (optional)" value={agency} onChange={(e) => setAgency(e.target.value)} />
      <input placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
      <div className="jst-quickcreate-actions">
        <button type="button" className="jst-btn-ghost jst-btn-sm" onClick={onCancel}>Cancel</button>
        <button
          type="button"
          className="jst-btn-primary jst-btn-sm"
          disabled={!name.trim()}
          onClick={() => name.trim() && onCreate({ name: name.trim(), agency: agency.trim(), email: email.trim(), relationship: "", notes: "" })}
        >
          Add recruiter
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   APPLICATION FORM (add / edit) — no native <form>, plain handlers
--------------------------------------------------------------------- */
function ApplicationForm({
  initial, companies, recruiters, onSave, onCancel, onDelete, onCreateCompany, onCreateRecruiter,
}: {
  initial: ApplicationDraft;
  companies: Company[];
  recruiters: Recruiter[];
  onSave: (form: ApplicationDraft) => void;
  onCancel: () => void;
  onDelete?: (() => void) | null;
  onCreateCompany: (fields: NewCompanyFields) => string;
  onCreateRecruiter: (fields: NewRecruiterFields) => string;
}) {
  const [form, setForm] = useState<ApplicationDraft>(initial);
  const [error, setError] = useState("");
  const [addingCompany, setAddingCompany] = useState(false);
  const [addingRecruiter, setAddingRecruiter] = useState(false);
  const set = <K extends keyof ApplicationDraft>(k: K) => (e: FormChangeEvent) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const cadenceDays = getCadenceDays(form.status, Boolean(form.recruiterId));
  const suggestedDate = cadenceDays != null ? addDaysISO(cadenceDays) : null;

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value as StageKey;
    setForm((f) => {
      const cadence = getCadenceDays(status, Boolean(f.recruiterId));
      const shouldSuggest = cadence != null && !f.nextFollowUpDate;
      return { ...f, status, nextFollowUpDate: shouldSuggest ? addDaysISO(cadence!) : f.nextFollowUpDate };
    });
  };

  const applySuggestedDate = () => {
    if (suggestedDate) setForm((f) => ({ ...f, nextFollowUpDate: suggestedDate }));
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "__new__") setAddingCompany(true);
    else setForm((f) => ({ ...f, companyId: e.target.value }));
  };
  const handleRecruiterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "__new__") setAddingRecruiter(true);
    else setForm((f) => ({ ...f, recruiterId: e.target.value }));
  };

  const createCompany = (fields: NewCompanyFields) => {
    const id = onCreateCompany(fields);
    setForm((f) => ({ ...f, companyId: id }));
    setAddingCompany(false);
  };
  const createRecruiter = (fields: NewRecruiterFields) => {
    const id = onCreateRecruiter(fields);
    setForm((f) => ({ ...f, recruiterId: id }));
    setAddingRecruiter(false);
  };

  const submit = () => {
    if (!form.companyId) { setError("Pick or add a company first."); return; }
    if (!form.role.trim()) { setError("Give the role a title."); return; }
    onSave(form);
  };

  return (
    <Modal title={initial.id ? "Edit application" : "New application"} onClose={onCancel} onDelete={initial.id ? onDelete : null}>
      <div className="jst-form">
        <Field label="Company" full>
          {addingCompany ? (
            <QuickCreateCompany onCreate={createCompany} onCancel={() => setAddingCompany(false)} />
          ) : (
            <select value={form.companyId} onChange={handleCompanyChange}>
              <option value="">Select a company…</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value="__new__">+ Add new company…</option>
            </select>
          )}
        </Field>
        <Field label="Role / title" full>
          <input value={form.role} onChange={set("role")} placeholder="e.g. Product Manager" />
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={handleStatusChange}>
            {STAGES.map((s) => <option key={s.key} value={s.key}>{s.key}</option>)}
          </select>
        </Field>
        <Field label="Priority">
          <select value={form.priority} onChange={set("priority")}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Source">
          <input value={form.source} onChange={set("source")} placeholder="LinkedIn, referral…" />
        </Field>
        <Field label="Recruiter" full={addingRecruiter}>
          {addingRecruiter ? (
            <QuickCreateRecruiter onCreate={createRecruiter} onCancel={() => setAddingRecruiter(false)} />
          ) : (
            <select value={form.recruiterId} onChange={handleRecruiterChange}>
              <option value="">None</option>
              {recruiters.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              <option value="__new__">+ Add new recruiter…</option>
            </select>
          )}
        </Field>
        <Field label="Applied date">
          <input type="date" value={form.appliedDate} onChange={set("appliedDate")} />
        </Field>
        <Field label="Last contact">
          <input type="date" value={form.lastContactDate} onChange={set("lastContactDate")} />
        </Field>
        <Field label="Next action" full>
          <input value={form.nextAction} onChange={set("nextAction")} placeholder="Prep for screen call…" />
        </Field>
        <Field label="Next follow-up date" full>
          <div className="jst-followup-input-row">
            <input type="date" value={form.nextFollowUpDate} onChange={set("nextFollowUpDate")} />
            {suggestedDate && suggestedDate !== form.nextFollowUpDate && (
              <button type="button" className="jst-suggest-btn" onClick={applySuggestedDate}>
                <Sparkles size={12} /> Suggest {fmtDate(suggestedDate)}
              </button>
            )}
          </div>
        </Field>
        <Field label="Thank-you note due" full>
          <input type="date" value={form.thankYouDueDate} onChange={set("thankYouDueDate")} />
        </Field>
        <Field label="Salary range">
          <input value={form.salaryRange} onChange={set("salaryRange")} placeholder="$100k–$120k" />
        </Field>
        <Field label="Job posting URL">
          <input value={form.jobUrl} onChange={set("jobUrl")} placeholder="https://…" />
        </Field>
        <Field label="Notes" full>
          <textarea rows={3} value={form.notes} onChange={set("notes")} placeholder="Anything worth remembering…" />
        </Field>

        {error && <div className="jst-form-error jst-field-full">{error}</div>}

        <div className="jst-form-actions">
          <button type="button" className="jst-btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="button" className="jst-btn-primary" onClick={submit}>Save application</button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------------------
   FOLLOW-UP TASK MODAL — what opens when you click a task, instead of
   re-showing the whole job. Log what happened, then line up what's next.
--------------------------------------------------------------------- */
function FollowUpTaskModal({
  app, companyName, onComplete, onCancel, onEditFull,
}: {
  app: Application;
  companyName: string;
  onComplete: (updated: Application) => void;
  onCancel: () => void;
  onEditFull: () => void;
}) {
  const hasRecruiter = Boolean(app.recruiterId);
  const justCompleted = app.status; // the stage whose task you're closing out right now
  const suggestedNextStage = NEXT_STAGE[justCompleted] || justCompleted;

  const needsThankYou = THANK_YOU_STAGES.includes(justCompleted) && !app.thankYouDueDate;
  const alreadyPendingThankYou = Boolean(app.thankYouDueDate);

  const [outcome, setOutcome] = useState("");
  const [status, setStatus] = useState<StageKey>(suggestedNextStage);
  const [thankYouSent, setThankYouSent] = useState(false);
  const [thankYouDate, setThankYouDate] = useState(needsThankYou ? addDaysISO(1) : (app.thankYouDueDate || ""));

  const presets = getActionPresets(status, hasRecruiter);
  const defaultAction = (needsThankYou || alreadyPendingThankYou) ? getCheckinAction(status) : (presets[0] || "");

  const [noFollowUp, setNoFollowUp] = useState(false);
  const [actionMode, setActionMode] = useState<"preset" | "custom">("preset");
  const [nextAction, setNextAction] = useState(defaultAction);
  const [nextFollowUpDate, setNextFollowUpDate] = useState(() => {
    const c = getCadenceDays(status, hasRecruiter);
    return c != null ? addDaysISO(c) : "";
  });

  const cadenceDays = getCadenceDays(status, hasRecruiter);
  const suggestedDate = cadenceDays != null ? addDaysISO(cadenceDays) : null;
  const didAdvance = suggestedNextStage !== app.status;
  const hadTask = Boolean(app.nextAction || app.nextFollowUpDate);

  const handleStageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as StageKey;
    setStatus(newStatus);
    const newPresets = getActionPresets(newStatus, hasRecruiter);
    const newDefault = (needsThankYou || alreadyPendingThankYou) ? getCheckinAction(newStatus) : (newPresets[0] || "");
    setActionMode("preset");
    setNextAction(newDefault);
    const c = getCadenceDays(newStatus, hasRecruiter);
    setNextFollowUpDate(c != null ? addDaysISO(c) : "");
  };

  const handleActionSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    if (v === "__custom__") { setActionMode("custom"); setNextAction(""); }
    else { setActionMode("preset"); setNextAction(v); }
  };

  const submit = () => {
    const loggedNote = outcome.trim() ? `[${fmtDate(todayISO())}] ${outcome.trim()}` : "";
    const notes = loggedNote ? (app.notes ? `${app.notes}\n${loggedNote}` : loggedNote) : app.notes;
    onComplete({
      ...app,
      status,
      lastContactDate: todayISO(),
      notes,
      nextAction: noFollowUp ? "" : nextAction.trim(),
      nextFollowUpDate: noFollowUp ? "" : nextFollowUpDate,
      thankYouDueDate: thankYouSent ? "" : thankYouDate,
    });
  };

  const cancelTask = () => {
    onComplete({ ...app, nextAction: "", nextFollowUpDate: "", thankYouDueDate: "" });
  };

  return (
    <Modal title={hadTask ? "Complete this follow-up" : "Schedule a follow-up"} onClose={onCancel}>
      <div className="jst-task-head">
        <span className="jst-task-role">{app.role}</span>
        <span className="jst-task-company">{companyName}</span>
        {hadTask && (
          <div className="jst-task-current">
            <span className="jst-task-current-label">Was due:</span>
            {app.nextAction || "Follow up"} — {fmtDate(app.nextFollowUpDate)}
          </div>
        )}
      </div>

      <div className="jst-form">
        <Field label="Update stage" full>
          <select value={status} onChange={handleStageChange}>
            {STAGES.map((s) => <option key={s.key} value={s.key}>{s.key}</option>)}
          </select>
          {didAdvance && status === suggestedNextStage && (
            <span className="jst-stage-hint">Moved forward from {app.status}</span>
          )}
        </Field>

        {(needsThankYou || alreadyPendingThankYou) && (
          <div className="jst-field-full jst-thankyou-box">
            <div className="jst-thankyou-head">
              <Mail size={14} />
              <span>Thank-you note</span>
            </div>
            <label className="jst-thankyou-check">
              <input type="checkbox" checked={thankYouSent} onChange={(e) => setThankYouSent(e.target.checked)} />
              I already sent it
            </label>
            {!thankYouSent && (
              <div className="jst-followup-input-row">
                <span className="jst-thankyou-due-label">Remind me by</span>
                <input type="date" value={thankYouDate} onChange={(e) => setThankYouDate(e.target.value)} />
              </div>
            )}
          </div>
        )}

        <div className="jst-field-full jst-nofollowup-row">
          <label className="jst-thankyou-check">
            <input type="checkbox" checked={noFollowUp} onChange={(e) => setNoFollowUp(e.target.checked)} />
            No follow-up needed for this one
          </label>
        </div>

        {!noFollowUp && (
          <>
            <Field label="Next action">
              <select value={actionMode === "custom" ? "__custom__" : nextAction} onChange={handleActionSelect}>
                {presets.map((p) => <option key={p} value={p}>{p}</option>)}
                <option value="__custom__">Write my own…</option>
              </select>
            </Field>
            {actionMode === "custom" && (
              <Field label="Custom action">
                <input value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="e.g. Call again Thursday" autoFocus />
              </Field>
            )}
            <Field label="Next follow-up date" full>
              <div className="jst-followup-input-row">
                <input type="date" value={nextFollowUpDate} onChange={(e) => setNextFollowUpDate(e.target.value)} />
                {suggestedDate && suggestedDate !== nextFollowUpDate && (
                  <button type="button" className="jst-suggest-btn" onClick={() => setNextFollowUpDate(suggestedDate)}>
                    <Sparkles size={12} /> Suggest {fmtDate(suggestedDate)}
                  </button>
                )}
              </div>
            </Field>
          </>
        )}

        <Field label="Notes" full>
          <textarea
            rows={3}
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            placeholder="e.g. Left a voicemail, no answer yet…"
          />
        </Field>

        <div className="jst-form-actions jst-task-actions">
          <div className="jst-task-actions-left">
            <button type="button" className="jst-danger-link jst-edit-full-link" onClick={onEditFull}>
              <ClipboardEdit size={13} /> Edit full application
            </button>
            {hadTask && (
              <button type="button" className="jst-danger-link" onClick={cancelTask}>
                <X size={13} /> Cancel this task
              </button>
            )}
          </div>
          <div className="jst-task-actions-right">
            <button type="button" className="jst-btn-ghost" onClick={onCancel}>Cancel</button>
            <button type="button" className="jst-btn-primary" onClick={submit}>
              <CheckCircle2 size={15} /> {hadTask ? "Mark done" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------------------
   TASKS VIEW — every pending follow-up and thank-you note, one list.
--------------------------------------------------------------------- */
function TasksView({
  applications, companies, recruiters, setData,
}: {
  applications: Application[];
  companies: Company[];
  recruiters: Recruiter[];
  setData: SetData;
}) {
  const [typeFilter, setTypeFilter] = useState<TaskKind | "">("");
  const [urgencyFilter, setUrgencyFilter] = useState("");
  const [query, setQuery] = useState("");
  const [completing, setCompleting] = useState<Application | null>(null);
  const [editing, setEditing] = useState<ApplicationDraft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const companyName = (id: string): string => companies.find((c) => c.id === id)?.name || "Unlinked company";

  const save = (form: ApplicationDraft) => {
    setData((d) => {
      if (!d) return d;
      const exists = d.applications.some((a) => a.id === form.id);
      const apps = exists
        ? d.applications.map((a) => (a.id === form.id ? (form as Application) : a))
        : [...d.applications, { ...form, id: uid() } as Application];
      return { ...d, applications: apps };
    });
    setEditing(null);
  };
  const remove = (id: string) => {
    setData((d) => d && ({ ...d, applications: d.applications.filter((a) => a.id !== id) }));
    setEditing(null);
    setConfirmDelete(null);
  };
  const createCompany = (fields: NewCompanyFields): string => {
    const id = uid();
    setData((d) => d && ({ ...d, companies: [...d.companies, { ...fields, id }] }));
    return id;
  };
  const createRecruiter = (fields: NewRecruiterFields): string => {
    const id = uid();
    setData((d) => d && ({ ...d, recruiters: [...d.recruiters, { ...fields, id }] }));
    return id;
  };
  const markThankYouSent = (appId: string) => {
    setData((d) => d && ({ ...d, applications: d.applications.map((a) => (a.id === appId ? { ...a, thankYouDueDate: "" } : a)) }));
  };

  const tasks = useMemo(() => {
    const followups: TaskItem[] = applications
      .filter((a) => a.nextFollowUpDate)
      .map((a) => ({ app: a, kind: "followup" as const, date: a.nextFollowUpDate, label: a.nextAction || "Follow up" }));
    const thankyous: TaskItem[] = applications
      .filter((a) => a.thankYouDueDate)
      .map((a) => ({ app: a, kind: "thankyou" as const, date: a.thankYouDueDate, label: "Send thank-you note" }));
    return [...followups, ...thankyous]
      .filter((t) => !typeFilter || t.kind === typeFilter)
      .filter((t) => {
        if (!urgencyFilter) return true;
        const d = daysUntil(t.date);
        if (urgencyFilter === "overdue") return d < 0;
        if (urgencyFilter === "soon") return d >= 0 && d <= 7;
        return true;
      })
      .filter((t) => {
        if (!query) return true;
        const q = query.toLowerCase();
        return t.app.role.toLowerCase().includes(q) || companyName(t.app.companyId).toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [applications, typeFilter, urgencyFilter, query]); // eslint-disable-line

  const groups = [
    { key: "overdue", label: "Overdue", test: (t: TaskItem) => daysUntil(t.date) < 0 },
    { key: "week", label: "This week", test: (t: TaskItem) => { const d = daysUntil(t.date); return d >= 0 && d <= 7; } },
    { key: "later", label: "Later", test: (t: TaskItem) => daysUntil(t.date) > 7 },
  ].map((g) => ({ ...g, items: tasks.filter(g.test) })).filter((g) => g.items.length > 0);

  return (
    <div className="jst-view">
      <div className="jst-toolbar">
        <div className="jst-search">
          <Search size={16} />
          <input placeholder="Search role or company…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TaskKind | "")}>
          <option value="">All task types</option>
          <option value="followup">Follow-ups</option>
          <option value="thankyou">Thank-you notes</option>
        </select>
        <select value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)}>
          <option value="">Any timing</option>
          <option value="overdue">Overdue</option>
          <option value="soon">Due within 7 days</option>
        </select>
        <button className="jst-btn-primary" onClick={() => setPicking(true)}><Plus size={16} /> New follow-up</button>
      </div>

      {tasks.length === 0 ? (
        <div className="jst-empty">
          <Inbox size={22} />
          <p>Nothing pending. Tasks show up here as soon as an application has a follow-up or thank-you note due.</p>
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.key} className="jst-task-group">
            <h4 className="jst-task-group-title">{g.label} <span className="jst-task-group-count">{g.items.length}</span></h4>
            <div className="jst-table jst-task-table">
              {g.items.map((t) => {
                const d = daysUntil(t.date);
                const isOverdue = d < 0;
                return (
                  <div key={t.app.id + t.kind} className={"jst-table-row jst-task-row" + (isOverdue ? " jst-row-overdue" : "")} onClick={() => setCompleting(t.app)}>
                    <span className="jst-task-kind-icon">{t.kind === "thankyou" ? <Mail size={15} /> : <Calendar size={15} />}</span>
                    <span className="jst-row-role">
                      <PriorityDot priority={t.app.priority} />
                      {t.app.role}
                    </span>
                    <span data-label="Company" className="jst-muted">{companyName(t.app.companyId)}</span>
                    <span data-label="Note" className="jst-muted jst-task-label">{t.label}</span>
                    <span data-label="Due" className={"jst-muted jst-mono" + (isOverdue ? " jst-overdue-text" : "")}>
                      {isOverdue ? `${Math.abs(d)}d overdue` : d === 0 ? "Today" : fmtDate(t.date)}
                    </span>
                    <span className="jst-row-actions" onClick={(e) => e.stopPropagation()}>
                      {t.kind === "thankyou" ? (
                        <button className="jst-icon-btn" onClick={() => markThankYouSent(t.app.id)} aria-label="Mark sent"><CheckCircle2 size={15} /></button>
                      ) : (
                        <button className="jst-icon-btn" onClick={() => setEditing(t.app)} aria-label="Edit full application"><Pencil size={14} /></button>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {picking && (
        <AppPickerModal
          applications={applications}
          companies={companies}
          onPick={(a) => { setPicking(false); setCompleting(a); }}
          onCancel={() => setPicking(false)}
        />
      )}

      {completing && (
        <FollowUpTaskModal
          app={completing}
          companyName={companyName(completing.companyId)}
          onComplete={(updated) => { save(updated); setCompleting(null); }}
          onCancel={() => setCompleting(null)}
          onEditFull={() => { setEditing(completing); setCompleting(null); }}
        />
      )}

      {editing && (
        <ApplicationForm
          initial={editing}
          companies={companies}
          recruiters={recruiters}
          onSave={save}
          onCancel={() => setEditing(null)}
          onDelete={editing.id ? () => setConfirmDelete(editing.id as string) : null}
          onCreateCompany={createCompany}
          onCreateRecruiter={createRecruiter}
        />
      )}

      {confirmDelete && (
        <Modal title="Delete this application?" onClose={() => setConfirmDelete(null)}>
          <p className="jst-confirm-text">This removes it permanently. This can't be undone.</p>
          <div className="jst-form-actions">
            <button className="jst-btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button className="jst-btn-danger" onClick={() => remove(confirmDelete)}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   APPLICATIONS VIEW
--------------------------------------------------------------------- */
function ApplicationsView({
  applications, companies, recruiters, setData, filterStage, setFilterStage,
  urgencyFilter, setUrgencyFilter, focusId, clearFocus,
}: {
  applications: Application[];
  companies: Company[];
  recruiters: Recruiter[];
  setData: SetData;
  filterStage: StageKey | "";
  setFilterStage: (s: StageKey | "") => void;
  urgencyFilter: string;
  setUrgencyFilter: (s: string) => void;
  focusId: string | null;
  clearFocus: () => void;
}) {
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "">("");
  const [editing, setEditing] = useState<ApplicationDraft | null>(null);
  const [completing, setCompleting] = useState<Application | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const companyName = (id: string): string => companies.find((c) => c.id === id)?.name || "Unlinked company";
  const recruiterName = (id: string): string => recruiters.find((r) => r.id === id)?.name || "";

  useEffect(() => {
    if (focusId) {
      const app = applications.find((a) => a.id === focusId);
      if (app) setCompleting(app);
      clearFocus();
    }
  }, [focusId]); // eslint-disable-line

  const filtered = useMemo(() => {
    return applications
      .filter((a) => !filterStage || a.status === filterStage)
      .filter((a) => !priorityFilter || a.priority === priorityFilter)
      .filter((a) => {
        if (!urgencyFilter) return true;
        if (!a.nextFollowUpDate) return false;
        const d = daysUntil(a.nextFollowUpDate);
        if (urgencyFilter === "overdue") return d < 0;
        if (urgencyFilter === "soon") return d >= 0 && d <= 7;
        return true;
      })
      .filter((a) => {
        if (!query) return true;
        const q = query.toLowerCase();
        return a.role.toLowerCase().includes(q) || companyName(a.companyId).toLowerCase().includes(q) || recruiterName(a.recruiterId).toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const da = a.nextFollowUpDate ? daysUntil(a.nextFollowUpDate) : 9999;
        const db = b.nextFollowUpDate ? daysUntil(b.nextFollowUpDate) : 9999;
        return da - db;
      });
  }, [applications, filterStage, priorityFilter, urgencyFilter, query]); // eslint-disable-line

  const save = (form: ApplicationDraft) => {
    setData((d) => {
      if (!d) return d;
      const exists = d.applications.some((a) => a.id === form.id);
      const applications = exists
        ? d.applications.map((a) => (a.id === form.id ? (form as Application) : a))
        : [...d.applications, { ...form, id: uid() } as Application];
      return { ...d, applications };
    });
    setEditing(null);
  };
  const remove = (id: string) => {
    setData((d) => d && ({ ...d, applications: d.applications.filter((a) => a.id !== id) }));
    setEditing(null);
    setConfirmDelete(null);
  };
  const createCompany = (fields: NewCompanyFields): string => {
    const id = uid();
    setData((d) => d && ({ ...d, companies: [...d.companies, { ...fields, id }] }));
    return id;
  };
  const createRecruiter = (fields: NewRecruiterFields): string => {
    const id = uid();
    setData((d) => d && ({ ...d, recruiters: [...d.recruiters, { ...fields, id }] }));
    return id;
  };

  const blank = (): ApplicationDraft => ({
    id: null, companyId: companies[0]?.id || "", recruiterId: "", role: "", source: "",
    appliedDate: "", lastContactDate: "", status: "Not Applied", nextAction: "",
    nextFollowUpDate: "", thankYouDueDate: "", salaryRange: "", priority: "Medium", jobUrl: "", notes: "",
  });

  return (
    <div className="jst-view">
      <div className="jst-toolbar">
        <div className="jst-search">
          <Search size={16} />
          <input placeholder="Search role, company, recruiter…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select value={filterStage} onChange={(e) => setFilterStage(e.target.value as StageKey | "")}>
          <option value="">All stages</option>
          {STAGES.map((s) => <option key={s.key} value={s.key}>{s.key}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as Priority | "")}>
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)}>
          <option value="">Any follow-up timing</option>
          <option value="overdue">Overdue</option>
          <option value="soon">Due within 7 days</option>
        </select>
        <button className="jst-btn-primary" onClick={() => setEditing(blank())}><Plus size={16} /> New application</button>
      </div>

      {filtered.length === 0 ? (
        <div className="jst-empty"><Briefcase size={22} /><p>No applications match. Add one, or clear your filters.</p></div>
      ) : (
        <div className="jst-table">
          <div className="jst-table-head">
            <span>Role</span><span>Company</span><span>Stage</span><span>Recruiter</span><span>Next follow-up</span><span></span>
          </div>
          {filtered.map((a) => {
            const d = a.nextFollowUpDate ? daysUntil(a.nextFollowUpDate) : null;
            const isOverdue = d !== null && d < 0;
            const isSoon = d !== null && d >= 0 && d <= 2;
            return (
              <div key={a.id} className={"jst-table-row" + (isOverdue ? " jst-row-overdue" : "")} onClick={() => setCompleting(a)}>
                <span className="jst-row-role">
                  <PriorityDot priority={a.priority} />
                  {a.role}
                  {a.thankYouDueDate && (
                    <button
                      className="jst-thankyou-pill"
                      onClick={(e) => { e.stopPropagation(); setData((d) => d && ({ ...d, applications: d.applications.map((x) => (x.id === a.id ? { ...x, thankYouDueDate: "" } : x)) })); }}
                      title="Mark thank-you note sent"
                    >
                      <Mail size={11} /> {fmtDate(a.thankYouDueDate)}
                    </button>
                  )}
                </span>
                <span data-label="Company">{companyName(a.companyId)}</span>
                <span data-label="Stage"><StagePill stage={a.status} /></span>
                <span data-label="Recruiter" className="jst-muted">{recruiterName(a.recruiterId) || "—"}</span>
                <span data-label="Next follow-up" className={"jst-muted jst-mono" + (isOverdue ? " jst-overdue-text" : isSoon ? " jst-soon-text" : "")}>
                  {a.nextFollowUpDate ? (isOverdue ? `${Math.abs(d as number)}d overdue` : d === 0 ? "Today" : `${fmtDate(a.nextFollowUpDate)}`) : "—"}
                </span>
                <span className="jst-row-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="jst-icon-btn" onClick={() => setEditing(a)} aria-label="Edit full application"><Pencil size={14} /></button>
                  <button className="jst-icon-btn" onClick={() => setConfirmDelete(a.id)} aria-label="Delete"><Trash2 size={14} /></button>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {completing && (
        <FollowUpTaskModal
          app={completing}
          companyName={companyName(completing.companyId)}
          onComplete={(updated) => { save(updated); setCompleting(null); }}
          onCancel={() => setCompleting(null)}
          onEditFull={() => { setEditing(completing); setCompleting(null); }}
        />
      )}

      {editing && (
        <ApplicationForm
          initial={editing}
          companies={companies}
          recruiters={recruiters}
          onSave={save}
          onCancel={() => setEditing(null)}
          onDelete={editing.id ? () => setConfirmDelete(editing.id as string) : null}
          onCreateCompany={createCompany}
          onCreateRecruiter={createRecruiter}
        />
      )}

      {confirmDelete && (
        <Modal title="Delete this application?" onClose={() => setConfirmDelete(null)}>
          <p className="jst-confirm-text">This removes it permanently. This can't be undone.</p>
          <div className="jst-form-actions">
            <button className="jst-btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button className="jst-btn-danger" onClick={() => remove(confirmDelete)}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   COMPANY FORM
--------------------------------------------------------------------- */
function CompanyForm({
  initial, onSave, onCancel, onDelete,
}: {
  initial: CompanyDraft;
  onSave: (form: CompanyDraft) => void;
  onCancel: () => void;
  onDelete?: (() => void) | null;
}) {
  const [form, setForm] = useState<CompanyDraft>(initial);
  const [error, setError] = useState("");
  const set = <K extends keyof CompanyDraft>(k: K) => (e: FormChangeEvent) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = () => {
    if (!form.name.trim()) { setError("Give the company a name."); return; }
    onSave(form);
  };
  return (
    <Modal title={initial.id ? "Edit company" : "New company"} onClose={onCancel} onDelete={initial.id ? onDelete : null}>
      <div className="jst-form">
        <Field label="Company name" full>
          <input value={form.name} onChange={set("name")} autoFocus />
        </Field>
        <Field label="Industry" full>
          <input value={form.industry} onChange={set("industry")} placeholder="e.g. Fintech" />
        </Field>
        <Field label="Notes" full>
          <textarea rows={3} value={form.notes} onChange={set("notes")} placeholder="Culture notes, interview loop details…" />
        </Field>
        {error && <div className="jst-form-error jst-field-full">{error}</div>}
        <div className="jst-form-actions">
          <button type="button" className="jst-btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="button" className="jst-btn-primary" onClick={submit}>Save company</button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------------------
   COMPANIES VIEW
--------------------------------------------------------------------- */
function CompaniesView({
  companies, applications, setData, openApplication,
}: {
  companies: Company[];
  applications: Application[];
  setData: SetData;
  openApplication: (id: string) => void;
}) {
  const [editing, setEditing] = useState<CompanyDraft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const save = (form: CompanyDraft) => {
    setData((d) => {
      if (!d) return d;
      const exists = d.companies.some((c) => c.id === form.id);
      const companies = exists
        ? d.companies.map((c) => (c.id === form.id ? (form as Company) : c))
        : [...d.companies, { ...form, id: uid() } as Company];
      return { ...d, companies };
    });
    setEditing(null);
  };
  const remove = (id: string) => {
    setData((d) => d && ({ ...d, companies: d.companies.filter((c) => c.id !== id), applications: d.applications.filter((a) => a.companyId !== id) }));
    setEditing(null);
    setConfirmDelete(null);
  };

  return (
    <div className="jst-view">
      <div className="jst-toolbar">
        <div className="jst-toolbar-title">Every company you're in motion with</div>
        <button className="jst-btn-primary" onClick={() => setEditing({ id: null, name: "", industry: "", notes: "" })}><Plus size={16} /> New company</button>
      </div>

      {companies.length === 0 ? (
        <div className="jst-empty"><Building2 size={22} /><p>No companies yet. Add the first one you're targeting.</p></div>
      ) : (
        <div className="jst-cards">
          {companies.map((c) => {
            const apps = applications.filter((a) => a.companyId === c.id);
            const recruiterIds = new Set(apps.map((a) => a.recruiterId).filter(Boolean));
            const isOpen = expanded === c.id;
            return (
              <div key={c.id} className="jst-entity-card">
                <div className="jst-entity-head" onClick={() => setExpanded(isOpen ? null : c.id)}>
                  <div className="jst-entity-icon" style={{ background: "#4C7A8C" }}><Building2 size={16} /></div>
                  <div className="jst-entity-main">
                    <span className="jst-entity-name">{c.name}</span>
                    <span className="jst-entity-sub">{c.industry || "Industry not set"}</span>
                  </div>
                  <div className="jst-entity-stats">
                    <span>{apps.length} role{apps.length === 1 ? "" : "s"}</span>
                    <span>{recruiterIds.size} recruiter{recruiterIds.size === 1 ? "" : "s"}</span>
                  </div>
                  <ChevronRight size={16} className={"jst-chevron" + (isOpen ? " jst-chevron-open" : "")} />
                  <span className="jst-row-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="jst-icon-btn" onClick={() => setEditing(c)} aria-label="Edit"><Pencil size={14} /></button>
                    <button className="jst-icon-btn" onClick={() => setConfirmDelete(c.id)} aria-label="Delete"><Trash2 size={14} /></button>
                  </span>
                </div>
                {isOpen && (
                  <div className="jst-entity-body">
                    {c.notes && <p className="jst-entity-notes">{c.notes}</p>}
                    {apps.length === 0 ? <p className="jst-empty-note">No applications linked yet.</p> : apps.map((a) => (
                      <div key={a.id} className="jst-linked-row" onClick={() => openApplication(a.id)}>
                        <span>{a.role}</span><StagePill stage={a.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editing && <CompanyForm initial={editing} onSave={save} onCancel={() => setEditing(null)} onDelete={editing.id ? () => setConfirmDelete(editing.id as string) : null} />}
      {confirmDelete && (
        <Modal title="Delete this company?" onClose={() => setConfirmDelete(null)}>
          <p className="jst-confirm-text">Its linked applications will be removed too. This can't be undone.</p>
          <div className="jst-form-actions">
            <button className="jst-btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button className="jst-btn-danger" onClick={() => remove(confirmDelete)}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   RECRUITER FORM
--------------------------------------------------------------------- */
function RecruiterForm({
  initial, onSave, onCancel, onDelete,
}: {
  initial: RecruiterDraft;
  onSave: (form: RecruiterDraft) => void;
  onCancel: () => void;
  onDelete?: (() => void) | null;
}) {
  const [form, setForm] = useState<RecruiterDraft>(initial);
  const [error, setError] = useState("");
  const set = <K extends keyof RecruiterDraft>(k: K) => (e: FormChangeEvent) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = () => {
    if (!form.name.trim()) { setError("Give the recruiter a name."); return; }
    onSave(form);
  };
  return (
    <Modal title={initial.id ? "Edit recruiter" : "New recruiter"} onClose={onCancel} onDelete={initial.id ? onDelete : null}>
      <div className="jst-form">
        <Field label="Name" full>
          <input value={form.name} onChange={set("name")} autoFocus />
        </Field>
        <Field label="Email">
          <input type="email" value={form.email} onChange={set("email")} placeholder="name@firm.com" />
        </Field>
        <Field label="Agency / employer">
          <input value={form.agency} onChange={set("agency")} placeholder="Internal, or staffing firm" />
        </Field>
        <Field label="Relationship" full>
          <input value={form.relationship} onChange={set("relationship")} placeholder="How you connected" />
        </Field>
        <Field label="Notes" full>
          <textarea rows={3} value={form.notes} onChange={set("notes")} />
        </Field>
        {error && <div className="jst-form-error jst-field-full">{error}</div>}
        <div className="jst-form-actions">
          <button type="button" className="jst-btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="button" className="jst-btn-primary" onClick={submit}>Save recruiter</button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------------------
   RECRUITERS VIEW
--------------------------------------------------------------------- */
function RecruitersView({
  recruiters, applications, companies, setData, openApplication,
}: {
  recruiters: Recruiter[];
  applications: Application[];
  companies: Company[];
  setData: SetData;
  openApplication: (id: string) => void;
}) {
  const [editing, setEditing] = useState<RecruiterDraft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const companyName = (id: string): string => companies.find((c) => c.id === id)?.name || "Unlinked company";

  const save = (form: RecruiterDraft) => {
    setData((d) => {
      if (!d) return d;
      const exists = d.recruiters.some((r) => r.id === form.id);
      const recruiters = exists
        ? d.recruiters.map((r) => (r.id === form.id ? (form as Recruiter) : r))
        : [...d.recruiters, { ...form, id: uid() } as Recruiter];
      return { ...d, recruiters };
    });
    setEditing(null);
  };
  const remove = (id: string) => {
    setData((d) => d && ({ ...d, recruiters: d.recruiters.filter((r) => r.id !== id), applications: d.applications.map((a) => (a.recruiterId === id ? { ...a, recruiterId: "" } : a)) }));
    setEditing(null);
    setConfirmDelete(null);
  };

  return (
    <div className="jst-view">
      <div className="jst-toolbar">
        <div className="jst-toolbar-title">Everyone presenting you for roles</div>
        <button className="jst-btn-primary" onClick={() => setEditing({ id: null, name: "", email: "", agency: "", relationship: "", notes: "" })}><Plus size={16} /> New recruiter</button>
      </div>

      {recruiters.length === 0 ? (
        <div className="jst-empty"><Users2 size={22} /><p>No recruiters yet. Add one to start linking them to applications.</p></div>
      ) : (
        <div className="jst-cards">
          {recruiters.map((r) => {
            const apps = applications.filter((a) => a.recruiterId === r.id);
            const isOpen = expanded === r.id;
            return (
              <div key={r.id} className="jst-entity-card">
                <div className="jst-entity-head" onClick={() => setExpanded(isOpen ? null : r.id)}>
                  <div className="jst-entity-icon" style={{ background: "#D9A441" }}><User size={16} /></div>
                  <div className="jst-entity-main">
                    <span className="jst-entity-name">{r.name}</span>
                    <span className="jst-entity-sub">{r.agency || "Agency not set"}</span>
                  </div>
                  <div className="jst-entity-stats"><span>{apps.length} role{apps.length === 1 ? "" : "s"}</span></div>
                  <ChevronRight size={16} className={"jst-chevron" + (isOpen ? " jst-chevron-open" : "")} />
                  <span className="jst-row-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="jst-icon-btn" onClick={() => setEditing(r)} aria-label="Edit"><Pencil size={14} /></button>
                    <button className="jst-icon-btn" onClick={() => setConfirmDelete(r.id)} aria-label="Delete"><Trash2 size={14} /></button>
                  </span>
                </div>
                {isOpen && (
                  <div className="jst-entity-body">
                    <div className="jst-entity-detail-row">
                      {r.email && <span className="jst-detail-chip">{r.email}</span>}
                      {r.relationship && <span className="jst-detail-chip">{r.relationship}</span>}
                    </div>
                    {r.notes && <p className="jst-entity-notes">{r.notes}</p>}
                    {apps.length === 0 ? <p className="jst-empty-note">Not linked to any application yet.</p> : apps.map((a) => (
                      <div key={a.id} className="jst-linked-row" onClick={() => openApplication(a.id)}>
                        <span>{a.role} <span className="jst-muted">· {companyName(a.companyId)}</span></span>
                        <StagePill stage={a.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editing && <RecruiterForm initial={editing} onSave={save} onCancel={() => setEditing(null)} onDelete={editing.id ? () => setConfirmDelete(editing.id as string) : null} />}
      {confirmDelete && (
        <Modal title="Delete this recruiter?" onClose={() => setConfirmDelete(null)}>
          <p className="jst-confirm-text">Linked applications stay, but will show no recruiter. This can't be undone.</p>
          <div className="jst-form-actions">
            <button className="jst-btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button className="jst-btn-danger" onClick={() => remove(confirmDelete)}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   ROOT APP (signed-in)
--------------------------------------------------------------------- */
type TabKey = "dashboard" | "tasks" | "applications" | "companies" | "recruiters";

function JobSearchTracker({ uid, userEmail }: { uid: string; userEmail: string | null }) {
  const [data, setData, status] = useCloudData<AppData>(uid, makeSeedData);
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [filterStage, setFilterStage] = useState<StageKey | "">("");
  const [urgencyFilter, setUrgencyFilter] = useState("");
  const [focusId, setFocusId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const goToApplications = (stage?: StageKey | "", urgency?: string) => {
    setFilterStage(stage || "");
    setUrgencyFilter(urgency || "");
    setTab("applications");
  };
  const goToTasks = () => setTab("tasks");
  const openApplication = (id: string) => { setFocusId(id); setTab("applications"); };
  const selectTab = (t: TabKey) => { setTab(t); setMobileMenuOpen(false); };

  return (
    <div className="jst-app">
      <style>{CSS}</style>
      <header className="jst-header">
        <div className="jst-brand">
          <span className="jst-eyebrow">Job search</span>
          <h1>Command Center</h1>
        </div>
        <nav className="jst-nav">
          <button className={"jst-nav-btn" + (tab === "dashboard" ? " jst-nav-active" : "")} onClick={() => selectTab("dashboard")}><LayoutDashboard size={16} /> Dashboard</button>
          <button className={"jst-nav-btn" + (tab === "tasks" ? " jst-nav-active" : "")} onClick={() => selectTab("tasks")}><Inbox size={16} /> Tasks</button>
          <button className={"jst-nav-btn" + (tab === "applications" ? " jst-nav-active" : "")} onClick={() => selectTab("applications")}><ListChecks size={16} /> Applications</button>
          <button className={"jst-nav-btn" + (tab === "companies" ? " jst-nav-active" : "")} onClick={() => selectTab("companies")}><Building2 size={16} /> Companies</button>
          <button className={"jst-nav-btn" + (tab === "recruiters" ? " jst-nav-active" : "")} onClick={() => selectTab("recruiters")}><Users2 size={16} /> Recruiters</button>
        </nav>
        <div className="jst-account">
          {userEmail && <span className="jst-account-email">{userEmail}</span>}
          <button className="jst-nav-btn jst-signout-btn" onClick={() => signOutUser()}><LogOut size={15} /> Sign out</button>
        </div>
        <button
          className="jst-hamburger-btn"
          onClick={() => setMobileMenuOpen((o) => !o)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {mobileMenuOpen && (
        <>
          <div className="jst-mobile-menu-backdrop" onClick={() => setMobileMenuOpen(false)} />
          <nav className="jst-mobile-menu">
            <button className={"jst-mobile-menu-btn" + (tab === "dashboard" ? " jst-mobile-menu-active" : "")} onClick={() => selectTab("dashboard")}><LayoutDashboard size={18} /> Dashboard</button>
            <button className={"jst-mobile-menu-btn" + (tab === "tasks" ? " jst-mobile-menu-active" : "")} onClick={() => selectTab("tasks")}><Inbox size={18} /> Tasks</button>
            <button className={"jst-mobile-menu-btn" + (tab === "applications" ? " jst-mobile-menu-active" : "")} onClick={() => selectTab("applications")}><ListChecks size={18} /> Applications</button>
            <button className={"jst-mobile-menu-btn" + (tab === "companies" ? " jst-mobile-menu-active" : "")} onClick={() => selectTab("companies")}><Building2 size={18} /> Companies</button>
            <button className={"jst-mobile-menu-btn" + (tab === "recruiters" ? " jst-mobile-menu-active" : "")} onClick={() => selectTab("recruiters")}><Users2 size={18} /> Recruiters</button>
            <div className="jst-mobile-menu-divider" />
            {userEmail && <span className="jst-mobile-menu-email">{userEmail}</span>}
            <button className="jst-mobile-menu-btn" onClick={() => signOutUser()}><LogOut size={17} /> Sign out</button>
          </nav>
        </>
      )}

      <main className="jst-main">
        {status === "loading" || !data ? (
          <div className="jst-loading">Loading your tracker…</div>
        ) : tab === "dashboard" ? (
          <Dashboard applications={data.applications} companies={data.companies} recruiters={data.recruiters} setData={setData} goToApplications={goToApplications} goToTasks={goToTasks} />
        ) : tab === "tasks" ? (
          <TasksView applications={data.applications} companies={data.companies} recruiters={data.recruiters} setData={setData} />
        ) : tab === "applications" ? (
          <ApplicationsView
            applications={data.applications} companies={data.companies} recruiters={data.recruiters} setData={setData}
            filterStage={filterStage} setFilterStage={setFilterStage}
            urgencyFilter={urgencyFilter} setUrgencyFilter={setUrgencyFilter}
            focusId={focusId} clearFocus={() => setFocusId(null)}
          />
        ) : tab === "companies" ? (
          <CompaniesView companies={data.companies} applications={data.applications} setData={setData} openApplication={openApplication} />
        ) : (
          <RecruitersView recruiters={data.recruiters} applications={data.applications} companies={data.companies} setData={setData} openApplication={openApplication} />
        )}
      </main>
    </div>
  );
}

/* ---------------------------------------------------------------------
   AUTH GATE — decides between the login screen and the signed-in app.
   This is the module's default export (what main.tsx renders).
--------------------------------------------------------------------- */
export default function AuthenticatedApp() {
  const { user, checking } = useAuthUser();

  if (checking) {
    return (
      <div className="jst-app">
        <style>{CSS}</style>
        <div className="jst-loading">Loading…</div>
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  return <JobSearchTracker uid={user.id} userEmail={user.email ?? null} />;
}