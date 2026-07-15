/* ---------------------------------------------------------------------
   SHARED STYLES — used by both the main app shell and the auth screen.
--------------------------------------------------------------------- */
export const CSS: string = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

.jst-app {
  --bg: #EEF1EC; --surface: #FFFFFF; --ink: #202A22; --ink-soft: #5B6459; --line: #DCE2D8; --amber: #D9A441;
  font-family: 'Inter', sans-serif; color: var(--ink); background: var(--bg); min-height: 100%; padding: 0 0 64px 0; box-sizing: border-box;
}
.jst-app * { box-sizing: border-box; }
.jst-app :focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .jst-app * { transition: none !important; animation: none !important; } }

.jst-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; padding: 28px 32px 20px; border-bottom: 1px solid var(--line); background: var(--surface); }
.jst-brand h1 { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 700; margin: 2px 0 0; letter-spacing: -0.01em; }
.jst-eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-soft); }
.jst-account { display: flex; align-items: center; gap: 12px; margin-left: auto; }
.jst-account-email { font-size: 12.5px; color: var(--ink-soft); }
.jst-signout-btn { background: var(--bg); }

.jst-nav { display: flex; gap: 4px; background: var(--bg); padding: 4px; border-radius: 10px; }
.jst-nav-btn { display: flex; align-items: center; gap: 6px; padding: 9px 14px; border: none; background: transparent; border-radius: 8px; font-family: 'Inter', sans-serif; font-size: 13.5px; font-weight: 500; color: var(--ink-soft); cursor: pointer; transition: background .15s, color .15s; }
.jst-nav-btn:hover { background: rgba(0,0,0,0.04); color: var(--ink); }
.jst-nav-active { background: var(--ink) !important; color: #fff !important; }

.jst-main { max-width: 1080px; margin: 0 auto; padding: 32px; }
.jst-loading { padding: 60px 0; text-align: center; color: var(--ink-soft); font-family: 'IBM Plex Mono', monospace; }
.jst-view { display: flex; flex-direction: column; gap: 24px; }

.jst-hero { background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 28px 28px 12px; }
.jst-hero-text h2 { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 600; margin: 4px 0 20px; }
.jst-rail-wrap { position: relative; overflow-x: auto; padding-bottom: 6px; }
.jst-rail { display: flex; gap: 4px; align-items: flex-end; min-width: 560px; padding-top: 8px; }
.jst-station { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; padding: 4px 2px 8px; border-radius: 10px; transition: background .15s; }
.jst-station:hover { background: rgba(0,0,0,0.035); }
.jst-station-stem { width: 6px; border-radius: 3px; background: #EEE; display: flex; align-items: flex-end; overflow: hidden; }
.jst-station-fill { width: 100%; height: 100%; border-radius: 3px; }
.jst-station-dot { width: 12px; height: 12px; border-radius: 50%; border: 2px solid; margin-top: -6px; }
.jst-station-count { font-family: 'IBM Plex Mono', monospace; font-size: 15px; font-weight: 500; }
.jst-station-label { font-size: 11.5px; color: var(--ink-soft); text-align: center; }

.jst-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.jst-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
@media (max-width: 720px) { .jst-grid-2, .jst-grid-3 { grid-template-columns: 1fr; } }

.jst-card { background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 22px 24px; }
.jst-card-alert { display: flex; flex-direction: column; gap: 4px; cursor: pointer; transition: box-shadow .15s; }
.jst-card-alert:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.06); }
.jst-card-title { font-family: 'Fraunces', serif; font-size: 15px; font-weight: 600; margin: 0 0 16px; }
.jst-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.jst-metric { display: flex; flex-direction: column; }
.jst-metric-num { font-family: 'IBM Plex Mono', monospace; font-size: 26px; font-weight: 500; color: var(--ink); }
.jst-metric-label { font-size: 12px; color: var(--ink-soft); margin-top: 2px; }

.jst-followup-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.jst-followup-item { display: flex; align-items: center; gap: 12px; padding: 9px 6px; border-radius: 8px; cursor: pointer; transition: background .15s; }
.jst-followup-item:hover { background: var(--bg); }
.jst-followup-flag { color: var(--ink-soft); display: flex; }
.jst-overdue { color: #C1584A; }
.jst-followup-main { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.jst-followup-role { font-size: 13.5px; font-weight: 500; }
.jst-followup-company { font-size: 12px; color: var(--ink-soft); }
.jst-followup-date { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--ink-soft); white-space: nowrap; }
.jst-overdue-text { color: #C1584A; }
.jst-soon-text { color: #B9862E; }

.jst-empty-note { font-size: 13px; color: var(--ink-soft); margin: 0; }
.jst-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 48px 0; color: var(--ink-soft); background: var(--surface); border: 1px dashed var(--line); border-radius: 16px; }

.jst-toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.jst-toolbar-title { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 600; flex: 1; }
.jst-search { display: flex; align-items: center; gap: 8px; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 9px 12px; flex: 1; min-width: 200px; color: var(--ink-soft); }
.jst-search input { border: none; outline: none; background: none; font-size: 13.5px; width: 100%; color: var(--ink); font-family: 'Inter', sans-serif; }
.jst-toolbar select { border: 1px solid var(--line); background: var(--surface); border-radius: 10px; padding: 9px 10px; font-size: 13px; font-family: 'Inter', sans-serif; color: var(--ink); }

.jst-btn-primary, .jst-btn-ghost, .jst-btn-danger { display: inline-flex; align-items: center; gap: 6px; font-family: 'Inter', sans-serif; font-size: 13.5px; font-weight: 600; border-radius: 10px; padding: 10px 16px; cursor: pointer; border: 1px solid transparent; transition: opacity .15s, background .15s; }
.jst-btn-primary { background: var(--ink); color: #fff; }
.jst-btn-primary:hover { opacity: 0.88; }
.jst-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.jst-btn-ghost { background: transparent; border-color: var(--line); color: var(--ink); }
.jst-btn-ghost:hover { background: var(--bg); }
.jst-btn-danger { background: #C1584A; color: #fff; }
.jst-btn-danger:hover { opacity: 0.88; }
.jst-btn-sm { padding: 7px 12px; font-size: 12.5px; }

.jst-table { background: var(--surface); border: 1px solid var(--line); border-radius: 16px; overflow: hidden; }
.jst-table-head, .jst-table-row { display: grid; grid-template-columns: 1.6fr 1.4fr 1.3fr 1.1fr 1fr 64px; align-items: center; gap: 10px; padding: 13px 18px; }
.jst-table-head { font-family: 'IBM Plex Mono', monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-soft); border-bottom: 1px solid var(--line); }
.jst-table-row { border-top: 1px solid var(--line); border-left: 3px solid transparent; font-size: 13.5px; cursor: pointer; transition: background .12s; }
.jst-table-row:first-of-type { border-top: none; }
.jst-table-row:hover { background: var(--bg); }
.jst-row-overdue { border-left-color: #C1584A; }
.jst-row-role { display: flex; align-items: center; gap: 8px; font-weight: 500; }
.jst-muted { color: var(--ink-soft); }
.jst-mono { font-family: 'IBM Plex Mono', monospace; font-size: 12px; }
.jst-row-actions { display: flex; gap: 4px; justify-content: flex-end; }

.jst-prio { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.jst-pill { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; padding: 4px 10px; border-radius: 999px; background: color-mix(in srgb, var(--pill-color) 14%, white); color: var(--pill-color); }
.jst-pill-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--pill-color); }

.jst-icon-btn { border: none; background: transparent; color: var(--ink-soft); cursor: pointer; padding: 6px; border-radius: 7px; display: flex; transition: background .15s, color .15s; }
.jst-icon-btn:hover { background: var(--bg); color: var(--ink); }

.jst-cards { display: flex; flex-direction: column; gap: 10px; }
.jst-entity-card { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
.jst-entity-head { display: flex; align-items: center; gap: 14px; padding: 16px 18px; cursor: pointer; }
.jst-entity-icon { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
.jst-entity-main { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.jst-entity-name { font-weight: 600; font-size: 14.5px; }
.jst-entity-sub { font-size: 12px; color: var(--ink-soft); }
.jst-entity-stats { display: flex; gap: 14px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--ink-soft); white-space: nowrap; }
.jst-chevron { transition: transform .15s; color: var(--ink-soft); flex-shrink: 0; }
.jst-chevron-open { transform: rotate(90deg); }
.jst-entity-body { padding: 4px 18px 18px 66px; display: flex; flex-direction: column; gap: 8px; border-top: 1px solid var(--line); padding-top: 14px; }
.jst-entity-notes { font-size: 13px; color: var(--ink-soft); margin: 0 0 4px; }
.jst-entity-detail-row { display: flex; gap: 8px; flex-wrap: wrap; }
.jst-detail-chip { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; background: var(--bg); padding: 4px 9px; border-radius: 999px; color: var(--ink-soft); }
.jst-linked-row { display: flex; align-items: center; justify-content: space-between; font-size: 13px; padding: 7px 10px; border-radius: 8px; cursor: pointer; transition: background .12s; }
.jst-linked-row:hover { background: var(--bg); }

.jst-modal-backdrop { position: fixed; inset: 0; background: rgba(20,24,20,0.4); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 20px; }
.jst-modal { background: var(--surface); border-radius: 18px; width: 100%; max-width: 560px; max-height: 88vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
.jst-modal-head { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--line); position: sticky; top: 0; background: var(--surface); }
.jst-modal-head h3 { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 600; margin: 0; }
.jst-modal-body { padding: 22px 24px; }
.jst-modal-foot { padding: 0 24px 20px; }
.jst-confirm-text { font-size: 13.5px; color: var(--ink-soft); margin: 0 0 4px; }

.jst-danger-link { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; color: #C1584A; font-size: 13px; font-weight: 500; cursor: pointer; padding: 6px 0; }
.jst-danger-link:hover { text-decoration: underline; }

.jst-form { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; }
.jst-field { display: flex; flex-direction: column; gap: 5px; }
.jst-field-full { grid-column: 1 / -1; }
.jst-field-label { font-size: 12px; font-weight: 600; color: var(--ink-soft); }
.jst-field input, .jst-field select, .jst-field textarea { border: 1px solid var(--line); border-radius: 9px; padding: 9px 11px; font-family: 'Inter', sans-serif; font-size: 13.5px; color: var(--ink); background: var(--surface); }
.jst-field textarea { resize: vertical; }
.jst-form-actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px; }
.jst-form-error { color: #C1584A; font-size: 12.5px; background: rgba(193,88,74,0.08); padding: 8px 12px; border-radius: 8px; }

.jst-followup-input-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.jst-suggest-btn { display: inline-flex; align-items: center; gap: 5px; background: rgba(217,164,65,0.14); color: #A8781F; border: none; border-radius: 999px; padding: 6px 11px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.jst-suggest-btn:hover { background: rgba(217,164,65,0.24); }

.jst-quickcreate { display: flex; flex-direction: column; gap: 8px; background: var(--bg); border: 1px solid var(--line); border-radius: 10px; padding: 12px; }
.jst-quickcreate input { border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; font-family: 'Inter', sans-serif; font-size: 13px; background: var(--surface); color: var(--ink); }
.jst-quickcreate-actions { display: flex; justify-content: flex-end; gap: 8px; }

.jst-task-head { display: flex; flex-direction: column; gap: 3px; margin-bottom: 18px; padding-bottom: 16px; border-bottom: 1px solid var(--line); }
.jst-task-role { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 600; }
.jst-task-company { font-size: 13px; color: var(--ink-soft); }
.jst-task-current { margin-top: 8px; font-size: 12.5px; background: var(--bg); border-radius: 8px; padding: 8px 11px; color: var(--ink); }
.jst-task-current-label { font-weight: 600; margin-right: 5px; color: var(--ink-soft); }
.jst-task-actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.jst-task-actions-right { display: flex; gap: 10px; }
.jst-edit-full-link { padding: 6px 0; }
.jst-stage-hint { font-size: 11px; color: #3F7D53; margin-top: 3px; }
.jst-thankyou-box { background: rgba(217,164,65,0.08); border: 1px solid rgba(217,164,65,0.3); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }
.jst-thankyou-head { display: flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 600; color: #A8781F; }
.jst-thankyou-check { display: flex; align-items: center; gap: 7px; font-size: 13px; cursor: pointer; }
.jst-thankyou-due-label { font-size: 12.5px; color: var(--ink-soft); }
.jst-thankyou-pill { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #A8781F; background: rgba(217,164,65,0.14); padding: 3px 8px; border-radius: 999px; border: none; cursor: pointer; white-space: nowrap; }
.jst-thankyou-pill:hover { background: rgba(217,164,65,0.24); }

.jst-task-group { display: flex; flex-direction: column; gap: 10px; }
.jst-task-group-title { display: flex; align-items: center; gap: 8px; font-family: 'Fraunces', serif; font-size: 14px; font-weight: 600; margin: 0; }
.jst-task-group-count { font-family: 'IBM Plex Mono', monospace; font-size: 11px; background: var(--bg); color: var(--ink-soft); padding: 1px 9px; border-radius: 999px; }
.jst-task-table { margin: 0; }
.jst-task-row { grid-template-columns: 26px 1.3fr 1.1fr 1.6fr 0.9fr 48px !important; }
.jst-task-kind-icon { color: var(--ink-soft); display: flex; align-items: center; justify-content: center; }
.jst-task-label { font-size: 12.5px; }

.jst-card-title-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 16px; }
.jst-card-title-row .jst-card-title { margin: 0; }

.jst-picker-search { margin-bottom: 14px; }
.jst-picker-list { display: flex; flex-direction: column; gap: 6px; max-height: 340px; overflow-y: auto; }
.jst-picker-item { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; text-align: left; background: none; border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; cursor: pointer; font-family: 'Inter', sans-serif; transition: background .12s, border-color .12s; }
.jst-picker-item:hover { background: var(--bg); border-color: var(--ink-soft); }
.jst-picker-text { display: flex; flex-direction: column; min-width: 0; }
.jst-picker-role { font-size: 13.5px; font-weight: 500; color: var(--ink); }
.jst-picker-company { font-size: 12px; color: var(--ink-soft); }

.jst-hamburger-btn { display: none; background: transparent; border: none; color: var(--ink); cursor: pointer; padding: 8px; border-radius: 8px; align-items: center; justify-content: center; }
.jst-hamburger-btn:hover { background: var(--bg); }
.jst-mobile-menu-backdrop { position: fixed; inset: 0; background: rgba(20,24,20,0.35); z-index: 45; }
.jst-mobile-menu { position: relative; z-index: 46; display: flex; flex-direction: column; gap: 2px; background: var(--surface); border-bottom: 1px solid var(--line); box-shadow: 0 12px 24px rgba(0,0,0,0.08); padding: 8px; }
.jst-mobile-menu-btn { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; padding: 12px 14px; border: none; background: transparent; border-radius: 10px; font-family: 'Inter', sans-serif; font-size: 14.5px; font-weight: 500; color: var(--ink); cursor: pointer; }
.jst-mobile-menu-btn:hover { background: var(--bg); }
.jst-mobile-menu-active { background: var(--ink) !important; color: #fff !important; }
.jst-mobile-menu-divider { height: 1px; background: var(--line); margin: 6px 6px; }
.jst-mobile-menu-email { font-size: 12.5px; color: var(--ink-soft); padding: 4px 14px 6px; }

/* ---------------------------------------------------------------------
   OPS TRACKER — daily non-negotiables + weekly deliverables
--------------------------------------------------------------------- */
.jst-ops-headerrow { display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; margin-top: 4px; }
.jst-ops-daynav { display: flex; align-items: center; gap: 8px; }
.jst-ops-navbtn { width: 28px; height: 28px; border-radius: 8px; border: 1px solid var(--line); background: var(--surface); color: var(--ink); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background .12s; }
.jst-ops-navbtn:hover { background: var(--bg); }
.jst-ops-date { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; font-size: 13.5px; color: var(--ink-soft); }
.jst-ops-today-btn { border: none; background: none; padding: 0; font-family: 'Inter', sans-serif; font-size: 11.5px; font-weight: 600; color: var(--amber); cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }
.jst-ops-rest-note { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--ink-soft); background: var(--bg); padding: 2px 8px; border-radius: 999px; }

.jst-ops-weeknav { display: flex; align-items: center; gap: 8px; }
.jst-ops-weeknav .jst-ops-navbtn { width: 24px; height: 24px; }

.jst-ops-ring-wrap { display: flex; align-items: center; gap: 12px; }
.jst-ops-ring-label { font-size: 11.5px; color: var(--ink-soft); }
.jst-ops-ring-status { font-family: 'IBM Plex Mono', monospace; font-size: 14px; font-weight: 600; margin-top: 2px; }

.jst-ops-groupby { display: flex; gap: 2px; background: var(--bg); padding: 3px; border-radius: 8px; }
.jst-ops-groupby-btn { border: none; background: transparent; padding: 6px 11px; border-radius: 6px; font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500; color: var(--ink-soft); cursor: pointer; transition: background .12s, color .12s; }
.jst-ops-groupby-btn:hover { color: var(--ink); }
.jst-ops-groupby-active { background: var(--ink) !important; color: #fff !important; }

.jst-ops-section { margin-bottom: 6px; }
.jst-ops-section-title { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-soft); margin: 18px 0 2px; }
.jst-ops-section:first-of-type .jst-ops-section-title { margin-top: 4px; }

.jst-ops-list { display: flex; flex-direction: column; }
.jst-ops-list-manual { margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--line); }
.jst-ops-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--line); }
.jst-ops-row:last-child { border-bottom: none; }
.jst-ops-row-label { font-size: 13.5px; flex: 1; min-width: 0; }
.jst-ops-row-label-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.jst-ops-row-label small { display: block; color: var(--ink-soft); font-size: 11px; margin-top: 3px; }

.jst-ops-tag { font-family: 'IBM Plex Mono', monospace; font-size: 9.5px; letter-spacing: 0.05em; text-transform: uppercase; padding: 2px 7px; border-radius: 999px; flex-shrink: 0; }
.jst-ops-tag-technical { background: color-mix(in srgb, var(--amber) 16%, white); color: color-mix(in srgb, var(--amber) 70%, black); }
.jst-ops-tag-networking { background: #E4EEEC; color: #2F6155; }

.jst-ops-check { width: 26px; height: 26px; border-radius: 7px; border: 1.5px solid var(--line); background: var(--bg); display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; color: transparent; transition: background .12s, border-color .12s, color .12s; }
.jst-ops-check-done { background: #E4EFE7; border-color: #3F7D53; color: #3F7D53; }

.jst-ops-stepper { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.jst-ops-stepper button { width: 24px; height: 24px; border-radius: 6px; border: 1px solid var(--line); background: var(--bg); color: var(--ink); cursor: pointer; display: flex; align-items: center; justify-content: center; }
.jst-ops-stepper button:hover { background: var(--line); }
.jst-ops-count { font-family: 'IBM Plex Mono', monospace; font-size: 13px; min-width: 44px; text-align: center; }
.jst-ops-count-met { color: #3F7D53; }

.jst-ops-range { font-size: 12px; color: var(--ink-soft); white-space: nowrap; }
.jst-ops-bars { display: flex; flex-direction: column; }
.jst-ops-bar-row { padding: 9px 0; border-bottom: 1px solid var(--line); }
.jst-ops-bar-row:last-child { border-bottom: none; }
.jst-ops-bar-top { display: flex; justify-content: space-between; align-items: center; font-size: 13px; margin-bottom: 6px; gap: 10px; }
.jst-ops-bar-label { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.jst-ops-bar-track { height: 6px; background: var(--bg); border-radius: 3px; overflow: hidden; }
.jst-ops-bar-fill { height: 100%; background: var(--amber); border-radius: 3px; transition: width .2s; }
.jst-ops-bar-fill-met { background: #3F7D53; }

.jst-ops-callout { border: 1px solid color-mix(in srgb, var(--amber) 55%, var(--line)); background: color-mix(in srgb, var(--amber) 8%, white); }
.jst-ops-callout-k { display: flex; align-items: center; gap: 6px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--amber); margin-bottom: 8px; }
.jst-ops-callout p { margin: 0; font-size: 13.5px; line-height: 1.6; }

/* ---------------------------------------------------------------------
   MOBILE — tablet and below
--------------------------------------------------------------------- */
@media (max-width: 720px) {
  .jst-ops-headerrow { margin-top: 12px; flex-direction: column; align-items: stretch; gap: 14px; }
  .jst-ops-daynav { justify-content: space-between; }
  .jst-ops-ring-wrap { justify-content: center; }
  .jst-card-title-row { flex-wrap: wrap; }
  .jst-header { flex-direction: row; align-items: center; justify-content: space-between; padding: 14px 16px; gap: 10px; }
  .jst-nav { display: none; }
  .jst-account { display: none; }
  .jst-hamburger-btn { display: flex; }

  .jst-main { padding: 16px; }
  .jst-hero { padding: 16px 16px 14px; }
  .jst-hero-text .jst-eyebrow { display: none; }
  .jst-hero-text h2 { font-size: 16px; margin: 0 0 12px; line-height: 1.25; }
  .jst-card { padding: 18px 16px; }

  /* Pipeline rail becomes a compact row of chips instead of a horizontal scroller */
  .jst-rail-wrap { overflow: visible; padding-bottom: 0; }
  .jst-rail { flex-direction: row; flex-wrap: wrap; min-width: 0; gap: 6px; padding-top: 0; }
  .jst-station {
    flex: none; flex-direction: row; align-items: center; gap: 6px;
    width: auto; padding: 6px 10px; border-radius: 999px; background: var(--bg);
  }
  .jst-station-stem { display: none; }
  .jst-station-dot { order: 1; margin-top: 0; flex-shrink: 0; width: 8px; height: 8px; }
  .jst-station-label { order: 2; text-align: left; font-size: 11px; }
  .jst-station-count { order: 3; font-size: 12.5px; }

  .jst-toolbar { flex-direction: column; align-items: stretch; }
  .jst-toolbar-title { flex: none; }
  .jst-search, .jst-toolbar select, .jst-toolbar > button.jst-btn-primary { width: 100%; }

  .jst-form { grid-template-columns: 1fr; }

  /* Modals become bottom sheets, easier to reach with a thumb */
  .jst-modal-backdrop { padding: 0; align-items: flex-end; }
  .jst-modal { max-width: 100%; width: 100%; max-height: 90vh; border-radius: 18px 18px 0 0; }

  .jst-entity-head { padding: 14px; gap: 10px; }
  .jst-entity-stats { flex-wrap: wrap; row-gap: 4px; }
  .jst-entity-body { padding: 4px 16px 16px; }

  /* Tables collapse into stacked cards instead of a grid */
  .jst-table { background: transparent; border: none; border-radius: 0; overflow: visible; }
  .jst-table-head { display: none; }
  .jst-table-row {
    display: flex;
    flex-direction: column;
    gap: 5px;
    position: relative;
    background: var(--surface);
    border: 1px solid var(--line) !important;
    border-top: 1px solid var(--line) !important;
    border-left: 3px solid transparent;
    border-radius: 12px;
    padding: 14px 44px 14px 16px;
    margin-bottom: 8px;
  }
  .jst-row-overdue { border-left-color: #C1584A; }
  .jst-table-row > span[data-label]::before {
    content: attr(data-label);
    display: block;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--ink-soft);
  }
  .jst-table-row > .jst-row-actions { position: absolute; top: 12px; right: 10px; }

  .jst-entity-head { flex-wrap: wrap; }
  .jst-entity-head > .jst-row-actions { order: 1; margin-left: auto; }

  .jst-task-row { flex-direction: row; flex-wrap: wrap; align-items: center; }
  .jst-task-row > span:not(.jst-task-kind-icon):not(.jst-row-role) { width: 100%; }
}

/* ---------------------------------------------------------------------
   MOBILE — phones
--------------------------------------------------------------------- */
@media (max-width: 420px) {
  .jst-brand h1 { font-size: 21px; }
  .jst-hero-text h2 { font-size: 19px; }
  .jst-metric-num { font-size: 22px; }
}
`;