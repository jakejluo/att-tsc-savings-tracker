import { AuditEntry, SavingsEvent, savingsOf } from "../../shared/types";
import { usd } from "../format";

export default function EventHistory({ event, entries }: { event?: SavingsEvent; entries: AuditEntry[] }) {
  if (!event) {
    return (
      <aside className="card history">
        <h2>Audit history</h2>
        <p className="muted">Select a row to see its audit trail.</p>
      </aside>
    );
  }
  const trail = entries.filter((a) => a.eventId === event.id).reverse();
  return (
    <aside className="card history" aria-label="Event audit history">
      <h2>Audit history · Event #{event.id}</h2>
      <dl className="facts">
        <dt>Supplier</dt><dd>{event.supplier}</dd>
        <dt>Category</dt><dd>{event.category}</dd>
        <dt>Baseline → negotiated</dt><dd>{usd(event.baselinePrice)} → {usd(event.negotiatedPrice)}</dd>
        <dt>Savings</dt><dd><strong>{usd(savingsOf(event))}</strong></dd>
        <dt>Cost center</dt><dd>{event.costCenter ?? "Assigned on approval"}</dd>
      </dl>
      {trail.length === 0 ? (
        <p className="muted">No audit entries for this event.</p>
      ) : (
        <ol className="timeline">
          {trail.map((a) => (
            <li key={a.id} className={a.action.replace(".", "-")}>
              <span className="tl-action">{a.action}</span>
              <span className="tl-who">{a.actor} · {a.role.replace("_", " ")}</span>
              <span className="tl-when">{a.at.replace("T", " ").slice(0, 16)} UTC</span>
              {a.detail && <span className="tl-detail">{a.detail}</span>}
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
