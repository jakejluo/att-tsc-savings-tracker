import { useState } from "react";
import { AuditEntry, SavingsEvent, Summary, savingsOf } from "../../shared/types";
import { BUCKETS, bucketOf, daysSince, pendingSince } from "../aging";
import { usd } from "../format";
import EventHistory from "./EventHistory";

interface Props {
  events: SavingsEvent[];
  audit: AuditEntry[];
  summary: Summary | null;
  onApprove: (id: number) => Promise<void>;
}

export default function FinanceQueue({ events, audit, summary, onApprove }: Props) {
  const [selectedId, setSelectedId] = useState<number>();
  const [approvedHere, setApprovedHere] = useState<number[]>([]);

  const now = Date.now();
  const queue = events
    .filter((e) => e.status === "pending" || approvedHere.includes(e.id))
    .map((e) => ({ ...e, days: daysSince(pendingSince(e, audit), now) }))
    .sort((a, b) => b.days - a.days || a.id - b.id);
  const pending = queue.filter((e) => e.status === "pending");
  const overdue = pending.filter((e) => bucketOf(e.days) === "30+");
  const buckets = BUCKETS.map((b) => {
    const items = pending.filter((e) => bucketOf(e.days) === b);
    return { b, count: items.length, total: items.reduce((s, e) => s + savingsOf(e), 0) };
  });
  const selected = queue.find((e) => e.id === (selectedId ?? queue[0]?.id));

  async function approve(id: number) {
    setApprovedHere((ids) => [...ids, id]);
    await onApprove(id);
  }

  return (
    <>
      <div className="kpis">
        <div className="card kpi">
          <span className="kpi-label">Awaiting your approval</span>
          <span className="kpi-value pending-value">{usd(summary?.pendingTotal ?? 0)}</span>
          <span className="kpi-sub">{pending.length} events</span>
        </div>
        <div className="card kpi">
          <span className="kpi-label">Overdue (over 30 days)</span>
          <span className="kpi-value overdue-value" data-testid="overdue-count">{overdue.length}</span>
          <span className="kpi-sub">{usd(overdue.reduce((s, e) => s + savingsOf(e), 0))} held up</span>
        </div>
        <div className="card kpi">
          <span className="kpi-label">Oldest item</span>
          <span className="kpi-value">{pending[0]?.days ?? 0} days</span>
          <span className="kpi-sub">{pending[0]?.supplier ?? "Queue is clear"}</span>
        </div>
        <div className="card kpi">
          <span className="kpi-label">Approved savings</span>
          <span className="kpi-value" data-testid="total-savings">{usd(summary?.approvedTotal ?? 0)}</span>
          <span className="kpi-sub">{summary?.approvedCount ?? 0} events</span>
        </div>
      </div>

      <div className="card">
        <h2>Queue aging</h2>
        <div className="aging-bar" role="img" aria-label="Pending items by days pending">
          {buckets.map(({ b, count }) => (
            <div key={b} className={`seg b${b.replace("+", "p")}`} style={{ flexGrow: count }} />
          ))}
        </div>
        <div className="aging-legend">
          {buckets.map(({ b, count, total }) => (
            <span key={b}>
              <i className={`dot b${b.replace("+", "p")}`} /> {b} days: <strong>{count}</strong> · {usd(total)}
            </span>
          ))}
        </div>
      </div>

      <div className="queue-grid">
        <div className="card">
          <h2>Approval queue · oldest first</h2>
          <div className="table-wrap queue-wrap">
            <table aria-label="Approval queue">
              <thead>
                <tr>
                  <th>Pending</th>
                  <th>Supplier</th>
                  <th>Category</th>
                  <th className="num">Savings</th>
                  <th>Owner</th>
                  <th>Submitted</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {queue.map((e) => (
                  <tr
                    key={e.id}
                    data-testid={`queue-${e.id}`}
                    className={`clickable ${e.status === "pending" && bucketOf(e.days) === "30+" ? "overdue" : ""} ${e.id === selected?.id ? "selected" : ""}`}
                    tabIndex={0}
                    aria-selected={e.id === selected?.id}
                    onClick={() => setSelectedId(e.id)}
                    onKeyDown={(k) => k.key === "Enter" && setSelectedId(e.id)}
                  >
                    <td>
                      <span className={`age b${bucketOf(e.days).replace("+", "p")}`}>{e.days}d</span>
                    </td>
                    <td>{e.supplier}</td>
                    <td>{e.category}</td>
                    <td className="num">{usd(savingsOf(e))}</td>
                    <td>{e.createdBy}</td>
                    <td>{e.date}</td>
                    <td>
                      {e.status === "pending" ? (
                        <button className="approve" onClick={(c) => { c.stopPropagation(); approve(e.id); }}>
                          Approve
                        </button>
                      ) : (
                        <span className="pill approved">approved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {queue.length === 0 && <p className="muted">Nothing waiting for approval.</p>}
          </div>
        </div>
        <EventHistory event={selected} entries={audit} />
      </div>
    </>
  );
}
