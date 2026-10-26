import { AuditEntry } from "../../shared/types";

export default function AuditLog({ entries }: { entries: AuditEntry[] }) {
  return (
    <div className="card">
      <h2>Audit log</h2>
      {entries.length === 0 ? (
        <p className="muted">No activity recorded yet.</p>
      ) : (
        <table aria-label="Audit log">
          <thead>
            <tr>
              <th>When (UTC)</th>
              <th>Who</th>
              <th>Role</th>
              <th>Action</th>
              <th>Event</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((a) => (
              <tr key={a.id}>
                <td>{a.at.replace("T", " ").slice(0, 19)}</td>
                <td>{a.actor}</td>
                <td>{a.role.replace("_", " ")}</td>
                <td>{a.action}</td>
                <td>{a.eventId ?? ""}</td>
                <td>{a.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
