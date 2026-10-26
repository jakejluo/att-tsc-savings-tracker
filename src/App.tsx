import { useCallback, useEffect, useState } from "react";
import Header from "./components/Header";
import Login from "./components/Login";
import LogForm, { NewEvent } from "./components/LogForm";
import CategoryChart from "./components/CategoryChart";
import EventsTable from "./components/EventsTable";
import AuditLog from "./components/AuditLog";
import ExecSummary from "./components/ExecSummary";
import { api, loadSession, saveSession, Session } from "./api";
import { AuditEntry, Role, SavingsEvent, Summary } from "../shared/types";
import { usd } from "./format";

type Tab = "dashboard" | "summary" | "audit";

export default function App() {
  const [session, setSession] = useState<Session | null>(loadSession);
  const [events, setEvents] = useState<SavingsEvent[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    if (!session) return;
    const [ev, sum, au] = await Promise.all([
      api.events(session.token),
      api.summary(session.token),
      api.audit(session.token),
    ]);
    setEvents(ev);
    setSummary(sum);
    setAudit(au);
  }, [session]);

  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, [refresh]);

  async function login(name: string, role: Role) {
    try {
      const s = await api.login(name, role);
      saveSession(s);
      setSession(s);
      setError(undefined);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function logout() {
    saveSession(null);
    setSession(null);
    setTab("dashboard");
  }

  async function add(e: NewEvent) {
    try {
      await api.create(session!.token, e);
      setError(undefined);
      await refresh();
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  }

  async function approve(id: number) {
    try {
      await api.approve(session!.token, id);
      setError(undefined);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (!session) {
    return (
      <>
        <Header />
        <Login onLogin={login} error={error} />
      </>
    );
  }

  const isManager = session.user.role === "sourcing_manager";
  const isFinance = session.user.role === "finance_approver";

  return (
    <>
      <Header>
        <nav className="tabs">
          <button className={tab === "dashboard" ? "active" : ""} onClick={() => setTab("dashboard")}>Dashboard</button>
          <button className={tab === "summary" ? "active" : ""} onClick={() => setTab("summary")}>Executive summary</button>
          <button className={tab === "audit" ? "active" : ""} onClick={() => setTab("audit")}>Audit log</button>
        </nav>
        <span className="who" data-testid="who">
          {session.user.name} · {isFinance ? "Finance approver" : "Sourcing manager"}
        </span>
        <button className="signout" onClick={logout}>Sign out</button>
      </Header>
      {tab === "summary" ? (
        <main className="layout single">
          {summary && <ExecSummary summary={summary} lastActivity={audit[0]?.at} />}
        </main>
      ) : tab === "audit" ? (
        <main className="layout single">
          <AuditLog entries={audit} />
        </main>
      ) : (
        <main className={`layout ${isManager ? "" : "single"}`}>
          {isManager && <LogForm onSubmit={add} error={error} />}
          <section className="dashboard">
            {!isManager && error && <p className="error" role="alert">{error}</p>}
            <div className="kpis">
              <div className="card kpi">
                <span className="kpi-label">Approved savings</span>
                <span className="kpi-value" data-testid="total-savings">{usd(summary?.approvedTotal ?? 0)}</span>
              </div>
              <div className="card kpi">
                <span className="kpi-label">Pending finance approval</span>
                <span className="kpi-value pending-value">{usd(summary?.pendingTotal ?? 0)}</span>
                <span className="kpi-sub">{summary?.pendingCount ?? 0} events</span>
              </div>
            </div>
            <CategoryChart totals={summary?.byCategory ?? []} />
            <EventsTable events={events} canApprove={() => isFinance} onApprove={approve} />
          </section>
        </main>
      )}
    </>
  );
}
