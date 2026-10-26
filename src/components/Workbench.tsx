import { useState } from "react";
import { AuditEntry, SavingsEvent, Status, Summary, savingsOf } from "../../shared/types";
import { usd } from "../format";
import EventsTable from "./EventsTable";

interface Props {
  me: string;
  events: SavingsEvent[];
  summary: Summary;
  audit: AuditEntry[];
}

const STAGES: { status: Status; label: string; hint: string }[] = [
  { status: "pending", label: "Pending finance approval", hint: "Editable until approved" },
  { status: "approved", label: "Approved", hint: "Booked to a cost center" },
];

export default function Workbench({ me, events, summary, audit }: Props) {
  const [filter, setFilter] = useState<Status | "all">("all");
  const mine = events.filter((e) => e.createdBy === me);
  const myIds = new Set(mine.map((e) => e.id));
  const myTotal = mine.reduce((sum, e) => sum + savingsOf(e), 0);
  const stages = STAGES.map((s) => {
    const inStage = mine.filter((e) => e.status === s.status);
    return { ...s, count: inStage.length, total: inStage.reduce((sum, e) => sum + savingsOf(e), 0) };
  });
  const shown = filter === "all" ? mine : mine.filter((e) => e.status === filter);
  const activity = audit.filter((a) => a.eventId !== null && myIds.has(a.eventId)).slice(0, 6);

  return (
    <section className="dashboard">
      <div className="card">
        <h2>My pipeline</h2>
        <div className="pipeline">
          {stages.map((s, i) => (
            <div key={s.status} className="stage-wrap">
              {i > 0 && <span className="chevron" aria-hidden>›</span>}
              <div className={`stage ${s.status}`} data-testid={`stage-${s.status}`}>
                <span className="kpi-label">{s.label}</span>
                <span className="kpi-value">{usd(s.total)}</span>
                <span className="kpi-sub">{s.count} events · {s.hint}</span>
              </div>
            </div>
          ))}
          <div className="stage team">
            <span className="kpi-label">Team approved savings</span>
            <span className="kpi-value" data-testid="total-savings">{usd(summary.approvedTotal)}</span>
            <span className="kpi-sub">{summary.approvedCount} events across all managers</span>
          </div>
        </div>
        <div className="split" aria-label="Share of my savings by stage">
          {stages.map((s) => (
            <div key={s.status} className={`split-part ${s.status}`} style={{ flexGrow: s.total }} />
          ))}
        </div>
        <p className="kpi-sub">{usd(myTotal)} logged by {me} across {mine.length} events</p>
      </div>

      <div className="workbench-grid">
        <div className="mine">
          <div className="chips" role="group" aria-label="Filter my events">
            {(["all", "pending", "approved"] as const).map((f) => (
              <button key={f} className={`chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>
          <EventsTable title="My events" showOwner={false} events={shown} canApprove={() => false} onApprove={() => {}} />
        </div>
        <div className="card">
          <h2>Recent activity on my events</h2>
          {activity.length === 0 ? (
            <p className="muted">Nothing yet. Log a savings event to get started.</p>
          ) : (
            <ul className="activity">
              {activity.map((a) => (
                <li key={a.id}>
                  <strong>{a.action.replace("event.", "")}</strong> #{a.eventId} by {a.actor}
                  <span className="kpi-sub">{a.at.replace("T", " ").slice(0, 16)} UTC</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
