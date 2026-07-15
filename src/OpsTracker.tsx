import React, { useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Minus, Plus, Sparkles } from "lucide-react";
import type { AppData, DailyOpsRecord, WeeklyOpsRecord, SetData } from "./types";

/* ---------------------------------------------------------------------
   ITEM DEFINITIONS
   Each daily item carries a time block (when it happens in the day) and
   a category (what kind of work it is), so the list can be organized
   either way.
--------------------------------------------------------------------- */
type TimeBlock = "morning" | "day" | "evening";
type OpsCategory = "technical" | "networking";
type GroupBy = "time" | "category";

const BLOCK_LABEL: Record<TimeBlock, string> = { morning: "Morning", day: "Throughout the day", evening: "Evening" };
const CATEGORY_LABEL: Record<OpsCategory, string> = { technical: "Technical", networking: "Networking" };

type CheckItem<T> = { key: keyof T; label: string; small?: string; type: "check"; block: TimeBlock; category: OpsCategory };
type CounterItem<T> = { key: keyof T; label: string; small?: string; type: "counter"; target: number; block: TimeBlock; category: OpsCategory };
type Item<T> = CheckItem<T> | CounterItem<T>;

// Rotating commute focus, split into a technical track (security concepts,
// technical Q&A) and a networking track (behavioral stories, pitch,
// outreach) so each commute check has a clear, specific focus.
const COMMUTE_TECHNICAL_FOCUS: string[] = [
  "Free review — catch up on anything", // Sun
  "Technical questions — CVSS, remediation workflow", // Mon
  "Vulnerability management scenarios",  // Tue
  "Security frameworks & concepts",      // Wed
  "Linux / cloud / networking fundamentals", // Thu
  "Technical mock Q&A",                  // Fri
  "Free review — catch up on anything", // Sat
];
const COMMUTE_NETWORKING_FOCUS: string[] = [
  "Free review — catch up on anything", // Sun
  "Elevator pitch practice",             // Mon
  "Behavioral stories (STAR method)",    // Tue
  "Recruiter talking points",            // Wed
  "LinkedIn outreach messaging",         // Thu
  "Mock interview — behavioral",         // Fri
  "Free review — catch up on anything", // Sat
];

function dailyItems(techFocus: string, netFocus: string): Item<DailyOpsRecord>[] {
  return [
    { key: "projectWork", label: "Project work", small: "5:00–6:30am · build", type: "check", block: "morning", category: "technical" },
    { key: "documented", label: "Document progress", small: "6:30–7:00am · README, notes, diagrams", type: "check", block: "morning", category: "technical" },
    { key: "commit", label: "GitHub commit", small: "meaningful, not volume", type: "check", block: "morning", category: "technical" },
    { key: "commuteTechnical", label: "Commute review — technical", small: `Security concepts · ${techFocus}`, type: "check", block: "day", category: "technical" },
    { key: "messages", label: "Recruiter / network messages", small: "30-min block · target 2", type: "counter", target: 2, block: "day", category: "networking" },
    { key: "comments", label: "LinkedIn comments", small: "30-min block · target 5", type: "counter", target: 5, block: "day", category: "networking" },
    { key: "commuteNetworking", label: "Commute review — networking", small: `Interview delivery · ${netFocus}`, type: "check", block: "day", category: "networking" },
    { key: "applications", label: "Applications", small: "8–9pm · quality over volume, target 5", type: "counter", target: 5, block: "evening", category: "networking" },
  ];
}

const WEEK_ITEMS: (Item<WeeklyOpsRecord> & { category: OpsCategory })[] = [
  { key: "milestone", label: "Project milestone completed", type: "check", block: "morning", category: "technical" },
  { key: "docImprovement", label: "Documentation improvement", type: "check", block: "morning", category: "technical" },
  { key: "portfolioImprovement", label: "Portfolio improvement", type: "check", block: "morning", category: "technical" },
  { key: "linkedinPost", label: "LinkedIn post", type: "check", block: "day", category: "networking" },
  { key: "connections", label: "New connections", type: "counter", target: 12, block: "day", category: "networking" },
  { key: "resumeReview", label: "Resume: review 5 job descriptions", type: "check", block: "evening", category: "networking" },
  { key: "trackerMaintained", label: "Application tracker maintained", type: "check", block: "evening", category: "networking" },
];

/* ---------------------------------------------------------------------
   DATE HELPERS
--------------------------------------------------------------------- */
function pad(n: number): string { return n < 10 ? "0" + n : "" + n; }
function fmtDateKey(d: Date): string { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function addDays(d: Date, n: number): Date { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt; }
function mondayOf(d: Date): Date {
  const dt = new Date(d);
  const day = dt.getDay(); // 0 sun .. 6 sat
  const diff = (day === 0 ? -6 : 1) - day;
  dt.setDate(dt.getDate() + diff);
  dt.setHours(0, 0, 0, 0);
  return dt;
}
function sameDay(a: Date, b: Date): boolean { return fmtDateKey(a) === fmtDateKey(b); }

const emptyDaily = (): DailyOpsRecord => ({
  projectWork: false, documented: false, commit: false,
  applications: 0, messages: 0, comments: 0,
  commuteTechnical: false, commuteNetworking: false,
});
const emptyWeekly = (): WeeklyOpsRecord => ({
  milestone: false, docImprovement: false, linkedinPost: false,
  connections: 0, portfolioImprovement: false, resumeReview: false, trackerMaintained: false,
});

function isComplete<T>(item: { type: "check" | "counter"; target?: number }, value: number | boolean): boolean {
  return item.type === "check" ? !!value : (value as number) >= (item.target as number);
}

/* ---------------------------------------------------------------------
   ROW SUB-COMPONENTS
--------------------------------------------------------------------- */
function Tag({ children, tone }: { children: React.ReactNode; tone: "technical" | "networking" }) {
  return <span className={"jst-ops-tag jst-ops-tag-" + tone}>{children}</span>;
}

function ChecklistRow<T>({
  item, value, onToggle, onStep,
}: {
  item: Item<T> & { category: OpsCategory };
  value: number | boolean;
  onToggle: () => void;
  onStep: (delta: number) => void;
}) {
  const done = isComplete(item, value);
  return (
    <div className="jst-ops-row">
      <div className="jst-ops-row-label">
        <div className="jst-ops-row-label-top">
          {item.label}
          <Tag tone={item.category}>{CATEGORY_LABEL[item.category]}</Tag>
        </div>
        {item.small && <small>{item.small}</small>}
      </div>
      {item.type === "check" ? (
        <button
          type="button"
          className={"jst-ops-check" + (done ? " jst-ops-check-done" : "")}
          onClick={onToggle}
          aria-pressed={done}
          aria-label={item.label}
        >
          <CheckCircle2 size={15} />
        </button>
      ) : (
        <div className="jst-ops-stepper">
          <button type="button" onClick={() => onStep(-1)} aria-label="Decrease">
            <Minus size={13} />
          </button>
          <span className={"jst-ops-count" + (done ? " jst-ops-count-met" : "")}>
            {value as number}
            <span className="jst-muted">/{item.target}</span>
          </span>
          <button type="button" onClick={() => onStep(1)} aria-label="Increase">
            <Plus size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   OPS TRACKER — daily non-negotiables + weekly deliverables.
--------------------------------------------------------------------- */
export function OpsTracker({ data, setData }: { data: AppData; setData: SetData }) {
  const [viewedDate, setViewedDate] = useState<Date>(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [groupBy, setGroupBy] = useState<GroupBy>("time");

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const isToday = sameDay(viewedDate, today);
  const dayKey = fmtDateKey(viewedDate);
  const monday = useMemo(() => mondayOf(viewedDate), [viewedDate]);
  const sunday = useMemo(() => addDays(monday, 6), [monday]);
  const mondayKey = fmtDateKey(monday);

  const techFocus = COMMUTE_TECHNICAL_FOCUS[viewedDate.getDay()];
  const netFocus = COMMUTE_NETWORKING_FOCUS[viewedDate.getDay()];
  const DAILY_ITEMS = useMemo(() => dailyItems(techFocus, netFocus), [techFocus, netFocus]);

  const daily = data.ops?.days?.[dayKey] ?? emptyDaily();
  const weekManual = data.ops?.weeks?.[mondayKey] ?? emptyWeekly();

  const weekDailyRecords = useMemo(() => {
    const days = data.ops?.days ?? {};
    return Object.entries(days)
      .filter(([key]) => {
        const dt = new Date(key + "T00:00:00");
        return dt >= monday && dt <= sunday;
      })
      .map(([, rec]) => rec);
  }, [data.ops, monday, sunday]);

  const updateDaily = (key: keyof DailyOpsRecord, value: boolean | number) => {
    setData((d) => {
      if (!d) return d;
      const ops = d.ops ?? { days: {}, weeks: {} };
      const rec = { ...(ops.days[dayKey] ?? emptyDaily()), [key]: value };
      return { ...d, ops: { ...ops, days: { ...ops.days, [dayKey]: rec } } };
    });
  };
  const updateWeekly = (key: keyof WeeklyOpsRecord, value: boolean | number) => {
    setData((d) => {
      if (!d) return d;
      const ops = d.ops ?? { days: {}, weeks: {} };
      const rec = { ...(ops.weeks[mondayKey] ?? emptyWeekly()), [key]: value };
      return { ...d, ops: { ...ops, weeks: { ...ops.weeks, [mondayKey]: rec } } };
    });
  };

  const completedCount = DAILY_ITEMS.filter((item) => isComplete(item, daily[item.key])).length;
  const pct = completedCount / DAILY_ITEMS.length;
  const circumference = 150.8;
  const offset = circumference * (1 - pct);
  const ringColor = pct >= 1 ? "#3F7D53" : pct >= 0.55 ? "#D9A441" : "#C1584A";
  const ringStatus = pct >= 1 ? "On track" : Math.round(pct * 100) + "% done";

  const weekSums = weekDailyRecords.reduce(
    (acc, r) => ({
      commit: acc.commit + (r.commit ? 1 : 0),
      applications: acc.applications + (r.applications || 0),
      messages: acc.messages + (r.messages || 0),
      comments: acc.comments + (r.comments || 0),
      commuteTechDays: acc.commuteTechDays + (r.commuteTechnical ? 1 : 0),
      commuteNetDays: acc.commuteNetDays + (r.commuteNetworking ? 1 : 0),
    }),
    { commit: 0, applications: 0, messages: 0, comments: 0, commuteTechDays: 0, commuteNetDays: 0 }
  );

  const weekMetrics: { label: string; value: number; target: number; fmt: (v: number) => string }[] = [
    { label: "GitHub commits", value: weekSums.commit, target: 6, fmt: (v) => String(v) },
    { label: "Applications", value: weekSums.applications, target: 30, fmt: (v) => String(v) },
    { label: "Recruiter / network messages", value: weekSums.messages, target: 12, fmt: (v) => String(v) },
    { label: "LinkedIn comments", value: weekSums.comments, target: 30, fmt: (v) => String(v) },
    { label: "Commute review — technical", value: weekSums.commuteTechDays, target: 5, fmt: (v) => v + " days" },
    { label: "Commute review — networking", value: weekSums.commuteNetDays, target: 5, fmt: (v) => v + " days" },
  ];

  const dateLabel = isToday
    ? "Today · " + viewedDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
    : viewedDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const rangeLabel =
    monday.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    "  –  " +
    sunday.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  // Group the daily checklist either by time-of-day block or by category —
  // the toggle just changes which one drives section headers; both are
  // always visible as tags on each row.
  const blockOrder: TimeBlock[] = ["morning", "day", "evening"];
  const categoryOrder: OpsCategory[] = ["technical", "networking"];
  const sections = (groupBy === "time" ? blockOrder : categoryOrder)
    .map((k) => ({
      key: k,
      label: groupBy === "time" ? BLOCK_LABEL[k as TimeBlock] : CATEGORY_LABEL[k as OpsCategory],
      items: DAILY_ITEMS.filter((item) => (groupBy === "time" ? item.block === k : item.category === k)),
    }))
    .filter((s) => s.items.length > 0);

  return (
    <div className="jst-view">
      <div className="jst-hero">
        <div className="jst-hero-text">
          <span className="jst-eyebrow">Security career sprint</span>
          <h2>Daily non-negotiables, one ring at a time</h2>
        </div>
        <div className="jst-ops-headerrow">
          <div className="jst-ops-daynav">
            <button type="button" className="jst-ops-navbtn" onClick={() => setViewedDate(addDays(viewedDate, -1))} aria-label="Previous day">
              <ChevronLeft size={16} />
            </button>
            <div className="jst-ops-date">
              {dateLabel}
              {!isToday && (
                <button type="button" className="jst-ops-today-btn" onClick={() => setViewedDate(today)}>
                  Jump to today
                </button>
              )}
            </div>
            <button type="button" className="jst-ops-navbtn" onClick={() => setViewedDate(addDays(viewedDate, 1))} aria-label="Next day">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="jst-ops-ring-wrap">
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="var(--line)" strokeWidth={5} />
              <circle
                cx="28" cy="28" r="24" fill="none" stroke={ringColor} strokeWidth={5}
                strokeLinecap="round" strokeDasharray={circumference}
                strokeDashoffset={offset} transform="rotate(-90 28 28)"
              />
            </svg>
            <div>
              <div className="jst-ops-ring-label">{isToday ? "Today" : "This day"}</div>
              <div className="jst-ops-ring-status" style={{ color: ringColor }}>{ringStatus}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="jst-card">
        <div className="jst-card-title-row">
          <h4 className="jst-card-title">Daily non-negotiables</h4>
          <div className="jst-ops-groupby">
            <button
              type="button"
              className={"jst-ops-groupby-btn" + (groupBy === "time" ? " jst-ops-groupby-active" : "")}
              onClick={() => setGroupBy("time")}
            >
              By time of day
            </button>
            <button
              type="button"
              className={"jst-ops-groupby-btn" + (groupBy === "category" ? " jst-ops-groupby-active" : "")}
              onClick={() => setGroupBy("category")}
            >
              By category
            </button>
          </div>
        </div>
        {sections.map((section) => (
          <div className="jst-ops-section" key={section.key}>
            <div className="jst-ops-section-title">{section.label}</div>
            <div className="jst-ops-list">
              {section.items.map((item) => (
                <ChecklistRow
                  key={String(item.key)}
                  item={item}
                  value={daily[item.key]}
                  onToggle={() => updateDaily(item.key, !daily[item.key])}
                  onStep={(delta) => updateDaily(item.key, Math.max(0, (daily[item.key] as number) + delta))}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="jst-card">
        <div className="jst-card-title-row">
          <h4 className="jst-card-title">This week</h4>
          <div className="jst-ops-weeknav">
            <button type="button" className="jst-ops-navbtn" onClick={() => setViewedDate(addDays(viewedDate, -7))} aria-label="Previous week">
              <ChevronLeft size={14} />
            </button>
            <span className="jst-ops-range">{rangeLabel}</span>
            <button type="button" className="jst-ops-navbtn" onClick={() => setViewedDate(addDays(viewedDate, 7))} aria-label="Next week">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
        <div className="jst-ops-bars">
          {weekMetrics.map((m) => {
            const met = m.value >= m.target;
            const pctBar = Math.min(100, (m.value / m.target) * 100);
            return (
              <div className="jst-ops-bar-row" key={m.label}>
                <div className="jst-ops-bar-top">
                  <span>{m.label}</span>
                  <span className={"jst-mono" + (met ? " jst-ops-count-met" : "")}>
                    {m.fmt(m.value)} / {m.fmt(m.target)}
                  </span>
                </div>
                <div className="jst-ops-bar-track">
                  <div className={"jst-ops-bar-fill" + (met ? " jst-ops-bar-fill-met" : "")} style={{ width: pctBar + "%" }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="jst-ops-list jst-ops-list-manual">
          {WEEK_ITEMS.map((item) => (
            <ChecklistRow
              key={String(item.key)}
              item={item}
              value={weekManual[item.key]}
              onToggle={() => updateWeekly(item.key, !weekManual[item.key])}
              onStep={(delta) => updateWeekly(item.key, Math.max(0, (weekManual[item.key] as number) + delta))}
            />
          ))}
        </div>
      </div>

      <div className="jst-card jst-ops-callout">
        <span className="jst-ops-callout-k"><Sparkles size={13} /> Biggest win condition</span>
        <p>One portfolio improvement, one project milestone, and enough applications to keep interviews flowing. Everything else supports those three.</p>
      </div>
    </div>
  );
}