import { Summary } from "../../shared/types";
import { usd } from "../format";

export default function CategoryChart({ totals }: { totals: Summary["byCategory"] }) {
  const max = Math.max(1, ...totals.map((t) => t.total));
  return (
    <div className="card">
      <h2>Approved savings by category</h2>
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
