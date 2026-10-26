import { useState } from "react";
import { Role } from "../../shared/types";

const PRESETS: { name: string; role: Role; label: string }[] = [
  { name: "sam.rivera", role: "sourcing_manager", label: "Sourcing manager" },
  { name: "alex.chen", role: "finance_approver", label: "Finance approver" },
];

export default function Login({ onLogin, error }: { onLogin: (name: string, role: Role) => void; error?: string }) {
  const [name, setName] = useState("");
  return (
    <main className="login">
      <div className="card login-card">
        <h2>Sign in</h2>
        <p className="muted">Demo sign-in. In production this is Entra ID SSO and the role comes from your Entra app role.</p>
        <div className="presets">
          {PRESETS.map((p) => (
            <button key={p.name} className="preset" onClick={() => onLogin(p.name, p.role)}>
              <strong>{p.label}</strong>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
        <div className="custom">
          <input placeholder="or type a name" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="link" disabled={!name} onClick={() => onLogin(name, "sourcing_manager")}>
            Sign in as sourcing manager
          </button>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
      </div>
    </main>
  );
}
