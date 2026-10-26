import { CATEGORIES, SavingsEvent, savingsOf } from "../types";
import { usd } from "../format";

export default function CategoryChart({ events }: { events: SavingsEvent[] }) {
  const totals = CATEGORIES.map((c) => ({
    category: c,
    total: events.filter((e) => e.category === c).reduce((s, e) => s + savingsOf(e), 0),
  }));
  const max = Math.max(1, ...totals.map((t) => t.total));
  return (
    <div className="card">
      <h2>Savings by category</h2>
      <div className="bars">
        {totals.map((t) => (
          <div className="bar-row" key={t.category}>
            <span className="bar-label">{t.category}</span>
            <div className="bar-track">
              <div className="bar" style={{ width: `${(t.total / max) * 100}%` }} />
            </div>
            <span className="bar-value">{usd(t.total)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
