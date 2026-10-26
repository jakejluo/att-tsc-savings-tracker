import { SavingsEvent, savingsOf } from "../types";
import { usd } from "../format";

interface Props {
  events: SavingsEvent[];
  canApprove: (e: SavingsEvent) => boolean;
  onApprove: (id: number) => void;
}

export default function EventsTable({ events, canApprove, onApprove }: Props) {
  return (
    <div className="card">
      <h2>Savings events</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Supplier</th>
              <th>Category</th>
              <th className="num">Baseline</th>
              <th className="num">Negotiated</th>
              <th className="num">Savings</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} data-testid={`event-${e.id}`}>
                <td>{e.date}</td>
                <td>{e.supplier}</td>
                <td>{e.category}</td>
                <td className="num">{usd(e.baselinePrice)}</td>
                <td className="num">{usd(e.negotiatedPrice)}</td>
                <td className="num">{usd(savingsOf(e))}</td>
                <td>
                  <span className={`pill ${e.status}`}>{e.status}</span>
                </td>
                <td>
                  {e.status === "pending" && canApprove(e) && (
                    <button className="link" onClick={() => onApprove(e.id)}>
                      Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
