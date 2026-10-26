import { Summary } from "../../shared/types";
import { usd } from "../format";

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

function Tile({ label, value, sub, tone = "" }: { label: string; value: string; sub: string; tone?: string }) {
  return (
    <div className={`card exec-tile ${tone}`}>
      <span className="exec-label">{label}</span>
      <span className="exec-value">{value}</span>
      <span className="exec-sub">{sub}</span>
    </div>
  );
}

export default function ExecSummary({ summary, lastActivity }: { summary: Summary; lastActivity?: string }) {
  const { approvedTotal, pendingTotal, approvedCount, pendingCount } = summary;
  const events = approvedCount + pendingCount;
  const pipeline = approvedTotal + pendingTotal;
  const approvedShare = pct(approvedTotal, pipeline);
  const categories = [...summary.byCategory].sort((a, b) => b.total - a.total);
  const top = Math.max(1, categories[0]?.total ?? 0);

  return (
    <section className="exec" aria-label="Executive summary">
      <div className="exec-head">
        <h1>Executive summary</h1>
        {lastActivity && <span className="muted">Last activity {lastActivity.replace("T", " ").slice(0, 16)} UTC</span>}
      </div>

      <div className="exec-tiles">
        <Tile label="Approved savings" value={usd(approvedTotal)} sub={`${approvedCount} events signed off by finance`} tone="good" />
        <Tile label="Pending savings" value={usd(pendingTotal)} sub={`${pendingCount} events awaiting finance`} tone="warn" />
        <Tile label="Savings events" value={String(events)} sub={`${usd(pipeline)} total pipeline`} />
        <Tile label="Approval rate" value={`${pct(approvedCount, events)}%`} sub={`${approvedCount} of ${events} events approved`} />
      </div>

      <div className="exec-row">
        <div className="card">
          <h2>Approved vs pending</h2>
          <div className="split" role="img" aria-label={`${approvedShare}% of pipeline value approved`}>
            <div className="split-approved" style={{ width: `${approvedShare}%` }} />
            <div className="split-pending" />
          </div>
          <div className="split-legend">
            <div>
              <span><span className="dot approved" />Approved</span>
              <strong>{usd(approvedTotal)}</strong>
              <span className="muted">{approvedShare}% of value</span>
            </div>
            <div>
              <span><span className="dot pending" />Pending</span>
              <strong>{usd(pendingTotal)}</strong>
              <span className="muted">{100 - approvedShare}% of value</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Approved savings by category</h2>
          <div className="exec-bars">
            {categories.map((c) => (
              <div className="exec-bar-row" key={c.category}>
                <span>{c.category}</span>
                <div className="bar-track">
                  <div className="bar" style={{ width: `${(c.total / top) * 100}%` }} />
                </div>
                <strong>{usd(c.total)}</strong>
                <span className="muted">{pct(c.total, approvedTotal)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
