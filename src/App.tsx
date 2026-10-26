import { useCallback, useEffect, useState } from "react";
import Header from "./components/Header";
import Login from "./components/Login";
import LogForm, { NewEvent } from "./components/LogForm";
import CategoryChart from "./components/CategoryChart";
import EventsTable from "./components/EventsTable";
import AuditLog from "./components/AuditLog";
import Workbench from "./components/Workbench";
import { api, loadSession, saveSession, Session } from "./api";
import { AuditEntry, Role, SavingsEvent, Summary } from "../shared/types";
import { usd } from "./format";

type Tab = "dashboard" | "audit";

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
    setEvents([]);
    setSummary(null);
    setAudit([]);
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

  if (!summary) {
    return (
      <>
        <Header>
          <button className="signout" onClick={logout}>Sign out</button>
        </Header>
        <main className="login">{error ? <p className="error" role="alert">{error}</p> : <p className="muted">Loading…</p>}</main>
      </>
    );
  }

  const isManager = session.user.role === "sourcing_manager";
  const isFinance = session.user.role === "finance_approver";

  return (
    <>
      <Header>
        <nav className="tabs">
          <button className={tab === "dashboard" ? "active" : ""} onClick={() => setTab("dashboard")}>{isManager ? "Workbench" : "Dashboard"}</button>
          <button className={tab === "audit" ? "active" : ""} onClick={() => setTab("audit")}>Audit log</button>
        </nav>
        <span className="who" data-testid="who">
          {session.user.name} · {isFinance ? "Finance approver" : "Sourcing manager"}
        </span>
        <button className="signout" onClick={logout}>Sign out</button>
      </Header>
      {tab === "audit" ? (
        <main className="layout single">
          <AuditLog entries={audit} />
        </main>
      ) : isManager ? (
        <main className="layout">
          <div className="rail">
            <LogForm onSubmit={add} error={error} />
          </div>
          <Workbench me={session.user.name} events={events} summary={summary} audit={audit} />
        </main>
      ) : (
        <main className="layout single">
          <section className="dashboard">
            {error && <p className="error" role="alert">{error}</p>}
            <div className="kpis">
              <div className="card kpi">
                <span className="kpi-label">Approved savings</span>
                <span className="kpi-value" data-testid="total-savings">{usd(summary.approvedTotal)}</span>
              </div>
              <div className="card kpi">
                <span className="kpi-label">Pending finance approval</span>
                <span className="kpi-value pending-value">{usd(summary.pendingTotal)}</span>
                <span className="kpi-sub">{summary.pendingCount} events</span>
              </div>
            </div>
            <CategoryChart totals={summary.byCategory} />
            <EventsTable events={events} canApprove={() => isFinance} onApprove={approve} />
          </section>
        </main>
      )}
    </>
  );
}
